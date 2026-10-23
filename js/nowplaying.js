/* ============================================================
   G04Musik — Radio: was läuft gerade? (Künstler, Titel, Songinfos)

   Woher der Titel kommt (der erste Weg, der klappt):
     1. Titel-Server (tools/nowplaying-worker.js): liest den Titel aus dem Stream.
        Adresse unten bei DEFAULT_PROXY oder in den Einstellungen unter „Erweitert“.
     2. Direkt aus dem Stream (ICY): geht im Browser nur bei Sendern, die das erlauben.
   Dazu holt die App bei einem bekannten Künstler und Titel Cover, Album, Jahr und
   Genre von Apple (iTunes-Suche), wenn die Einstellung „Songinfos“ an ist.
   Bei HLS-Sendern (.m3u8) gibt es keinen Titel.
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store;

  /* Adresse des eigenen Titel-Servers, z. B. 'https://g04musik-titel.deinname.workers.dev'.
     Leer lassen, dann gilt nur die Adresse aus den Einstellungen. */
  var DEFAULT_PROXY = '';

  var N = G.nowplaying = { meta: null, state: 'idle' };   /* state: idle | loading | ok | none */
  var timer = 0, token = 0, ctl = null, directFailed = {}, infoCache = {};

  function proxy(){ return String(u.ls.get('npProxy','') || DEFAULT_PROXY || '').trim(); }
  N.proxy = proxy;
  N.hasProxy = function(){ return !!proxy(); };

  function set(meta,state){ N.meta = meta; N.state = state; S.emit('meta'); }

  /* ---------- Text aus dem Stream aufräumen ---------- */
  function norm(s){
    return String(s||'').toLowerCase().replace(/\(.*?\)|\[.*?\]/g,' ').replace(/[^a-z0-9äöüß]+/g,' ').replace(/\s+/g,' ').trim();
  }
  /* „Künstler - Titel“ → {artist,title}; Senderwerbung, leere und Platzhalter-Texte → null */
  function clean(raw,station){
    raw = String(raw||'').replace(/\0+/g,'').trim();
    var m = raw.match(/StreamTitle='((?:[^']|'(?!;|$))*)'/); if(m) raw = m[1];
    raw = raw.replace(/\s+/g,' ').trim();
    if(!norm(raw) || /^(unknown|n\/a|null|undefined)$/i.test(raw)) return null;
    /* Steht der Sendername im Text, ist es Senderkennung oder Werbung, kein Lied */
    var st = norm(station);
    if(st.length>=3 && (' '+norm(raw)+' ').indexOf(' '+st+' ')>=0) return null;
    var parts = raw.split(/\s+[-–—]\s+/), artist = '', title = raw;
    if(parts.length>=2){ artist = parts[0].trim(); title = parts.slice(1).join(' - ').trim(); }
    /* „*** Bayern 1 - Gehört ins Leben“ bei Sender „Bayern 1 Oberbayern“: der „Künstler“ ist der Sendername */
    var ap = norm(artist).replace(/ /g,''), sc = st.replace(/ /g,'');
    if(ap.length>=4 && sc.indexOf(ap)===0) return null;
    /* Zierzeichen vorn entfernen: „*** Nachrichten“ → „Nachrichten“ */
    title = title.replace(/^[*#=~\s]+/,'').trim(); artist = artist.replace(/^[*#=~\s]+/,'').trim();
    if(!title) return null;
    return { artist: artist, title: title, raw: raw };
  }

  /* ---------- Weg 1: Titel-Server ---------- */
  function viaProxy(url,sig){
    var base = proxy();
    return fetch(base+(base.indexOf('?')<0?'?':'&')+'url='+encodeURIComponent(url),{signal:sig}).then(function(r){
      if(!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(j){ return j && j.ok ? (j.title||'') : Promise.reject(new Error('Server')); });
  }

  /* ---------- Weg 2: direkt aus dem Stream (ICY) ---------- */
  function decode(b){
    try{ return new TextDecoder('utf-8',{fatal:true}).decode(b); }catch(e){ return new TextDecoder('windows-1252').decode(b); }
  }
  function readIcy(url,sig){
    return fetch(url,{headers:{'Icy-MetaData':'1'},signal:sig}).then(function(r){
      var every = parseInt(r.headers.get('icy-metaint')||'0',10);
      if(!every || !r.body) throw new Error('kein ICY');
      var reader = r.body.getReader(), buf = new Uint8Array(0), pos = 0, block = 0;
      function fill(need){
        if(buf.length>=need) return Promise.resolve();
        return reader.read().then(function(x){
          if(x.done) throw new Error('Ende');
          var n = new Uint8Array(buf.length+x.value.length); n.set(buf); n.set(x.value,buf.length); buf = n;
          return fill(need);
        });
      }
      /* Der erste Textblock ist oft leer – bis zu 4 Blöcke lesen */
      function next(){
        var at = pos+every;
        return fill(at+1).then(function(){
          var size = buf[at]*16, end = at+1+size;
          if(!size){ pos = end; return ++block<4 ? next() : ''; }
          return fill(end).then(function(){ return decode(buf.subarray(at+1,end)); });
        });
      }
      return next().then(function(t){ try{ reader.cancel(); }catch(e){} return t; });
    });
  }

  /* ---------- Abfragen ---------- */
  function poll(item,my){
    if(my!==token) return;
    if(ctl){ try{ ctl.abort(); }catch(e){} }
    ctl = ('AbortController' in window) ? new AbortController() : null;
    var sig = ctl ? ctl.signal : undefined, c = ctl;
    var t = setTimeout(function(){ if(c) c.abort(); },10000);
    var usingProxy = !!proxy();
    var p = usingProxy ? viaProxy(item.url,sig) : readIcy(item.url,sig);
    p.then(function(raw){ clearTimeout(t); got(item,my,raw); },
           function(){
             clearTimeout(t); if(my!==token) return;
             if(!usingProxy) directFailed[item.url] = true;   /* Sender erlaubt es nicht: nicht weiter versuchen */
             if(!N.meta) set(null,'none');
           });
  }
  function got(item,my,raw){
    if(my!==token) return;
    var m = clean(raw,item.title);
    if(!m){ if(N.meta||N.state!=='none') set(null,'none'); return; }
    if(N.meta && N.meta.raw===m.raw) return;
    set(m,'ok');
    enrich(m,my);
  }

  /* ---------- Songinfos von Apple (iTunes): Cover, Album, Jahr, Genre ---------- */
  var SKIP = /^(feat|ft|and|und|the|der|die|das|with|vs|von)$/;
  /* Wörter des Künstlers, ohne Füllwörter („A x B“, „A feat. B“, „A & B“ → A, B) */
  function words(artist){ return norm(artist).split(' ').filter(function(w){ return w.length>=3 && !SKIP.test(w); }); }
  function firstArtist(artist){ return artist.split(/\s+(?:x|feat\.?|ft\.?|vs\.?|&|and|und)\s+|\s*[,\/;]\s*/i)[0].trim(); }
  function pick(results,m){
    var t = norm(m.title), a = norm(m.artist), aw = words(m.artist);
    for(var i=0;i<results.length;i++){
      var r = results[i], rt = norm(r.trackName), ra = norm(r.artistName);
      var tOk = rt && (rt===t || rt.indexOf(t)===0 || t.indexOf(rt)===0);
      /* Künstler passt, wenn der Name (ganz oder in Teilen) auch bei Apple vorkommt */
      var aOk = ra && a && (ra.indexOf(a)>=0 || a.indexOf(ra)>=0 || aw.some(function(w){ return (' '+ra+' ').indexOf(' '+w+' ')>=0; }));
      if(tOk && aOk) return {
        cover: (r.artworkUrl100||'').replace('100x100bb','600x600bb'),
        album: r.collectionName||'', year: (r.releaseDate||'').slice(0,4), genre: r.primaryGenreName||'',
        seconds: r.trackTimeMillis ? Math.round(r.trackTimeMillis/1000) : 0, url: r.trackViewUrl||''
      };
    }
    return null;
  }
  function enrich(m,my){
    if(S.settings.songInfo===false || !m.artist) return;
    var key = norm(m.artist+' '+m.title);
    if(Object.prototype.hasOwnProperty.call(infoCache,key)){
      if(infoCache[key]){ m.info = infoCache[key]; S.emit('meta'); }
      return;
    }
    /* Erst „Titel + erster Künstler“, dann „Künstler + Titel“ (Apple findet mal das eine, mal das andere) */
    var terms = [m.title+' '+firstArtist(m.artist), m.artist+' '+m.title];
    if(terms[0]===terms[1]) terms.pop();
    function search(i){
      if(i>=terms.length){ infoCache[key] = null; return Promise.resolve(null); }
      return fetch('https://itunes.apple.com/search?media=music&entity=song&limit=5&country=DE&term='+encodeURIComponent(terms[i]))
        .then(function(r){ return r.json(); })
        .then(function(j){ return pick(j.results||[],m) || search(i+1); });
    }
    search(0).then(function(hit){
      if(hit) infoCache[key] = hit;
      if(hit && my===token && N.meta===m){ m.info = hit; S.emit('meta'); }
    }).catch(function(){});   /* Fehler (offline): nicht merken, nächstes Mal neu versuchen */
  }

  /* ---------- Start / Stopp (vom Player aufgerufen) ---------- */
  N.stop = function(silent){
    token++; clearInterval(timer); timer = 0;
    if(ctl){ try{ ctl.abort(); }catch(e){} ctl = null; }
    var had = N.meta || N.state!=='idle';
    N.meta = null; N.state = 'idle';
    if(had && !silent) S.emit('meta');
  };
  N.start = function(item){
    N.stop(true);
    if(!item || item.kind!=='radio' || !item.url) return;
    if(item.hls || /\.m3u8(\?|$)/i.test(item.url)) return;   /* HLS: kein Titel */
    var my = ++token;
    N.state = 'loading';
    poll(item,my);
    timer = setInterval(function(){
      if(my!==token){ clearInterval(timer); return; }
      if(!proxy() && directFailed[item.url]) return;
      if(G.player && !G.player.playing) return;              /* pausiert: nicht nachfragen */
      poll(item,my);
    },20000);
  };
  /* Nach einer geänderten Einstellung neu anfragen */
  N.restart = function(){ var c = G.player && G.player.cur; if(c && c.kind==='radio'){ directFailed = {}; N.start(c); } };
})();
