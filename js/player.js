/* ============================================================
   G04Musik — Wiedergabe
   Drei Wege, immer nur einer aktiv:
     track : eigene Datei (Musik oder Musikvideo) über <video id="media">
     radio : Sender über ein eigenes Audio-Element (HLS über hls.js)
     yt    : eingebetteter YouTube-Player
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store;

  var media = u.$('#media');
  var radio = new Audio(); radio.preload='none';
  var hls = null, fileUrl = null;
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);

  var P = G.player = {
    cur:null, queue:[], index:-1, playing:false, loading:false, error:'',
    sleepAt:0, analyser:null
  };

  function emit(){ S.emit('player'); }
  function vol(){ return S.settings.volume; }
  function setError(msg){ P.error=msg; P.loading=false; P.playing=false; emit(); }

  /* ---------- Web Audio für den Visualizer (nur eigene Dateien) ----------
     Auf iPhone/iPad nicht: dort verstummt die Musik sonst im Hintergrund. */
  var actx=null;
  function ensureAnalyser(){
    if(IOS||actx||!S.settings.viz) return;
    try{
      var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      actx=new AC();
      var src=actx.createMediaElementSource(media);
      P.analyser=actx.createAnalyser(); P.analyser.fftSize=256; P.analyser.smoothingTimeConstant=.78;
      src.connect(P.analyser); P.analyser.connect(actx.destination);
    }catch(e){ console.warn('Visualizer',e); P.analyser=null; }
  }
  P.realViz = function(){ return !!(P.analyser && P.cur && P.cur.kind==='track' && !P.cur.isVideo); };

  /* ---------- Anhalten aller Wege ---------- */
  function stopTrack(){ try{ media.pause(); }catch(e){} media.removeAttribute('src'); try{ media.load(); }catch(e){} media.hidden=true; if(fileUrl){ URL.revokeObjectURL(fileUrl); fileUrl=null; } }
  function stopRadio(){ try{ radio.pause(); }catch(e){} if(hls){ try{hls.destroy();}catch(e){} hls=null; } radio.removeAttribute('src'); try{ radio.load(); }catch(e){} }
  function stopYT(){ G.yt.unmount(u.$('#ytHost')); }
  function stopAll(){ stopTrack(); stopRadio(); stopYT(); }

  /* ---------- Abspielen ---------- */
  P.play = function(item,queue){
    if(!item) return;
    if(P.cur && S.key(P.cur)===S.key(item) && !P.error){ P.toggle(); return; }
    stopAll();
    P.cur=item; P.error=''; P.loading=true; P.playing=false;
    P.queue = queue && queue.length ? queue.slice() : [item];
    P.index = Math.max(0, P.queue.map(S.key).indexOf(S.key(item)));
    S.addHistory(item);
    emit(); session();

    if(item.kind==='track') playTrack(item);
    else if(item.kind==='radio') playRadio(item);
    else if(item.kind==='yt') playYT(item);
  };

  function playTrack(item){
    ensureAnalyser();
    if(actx&&actx.state==='suspended') actx.resume().catch(function(){});
    G.db.file(item.id).then(function(file){
      if(!file){ setError('Die Datei fehlt in der Bibliothek. Bitte neu hinzufügen.'); return; }
      if(P.cur!==item) return;
      fileUrl=URL.createObjectURL(file);
      media.hidden=!item.isVideo;
      media.src=fileUrl; media.volume=vol();
      var pr=media.play(); if(pr&&pr.catch) pr.catch(function(e){ if(e.name==='NotAllowedError'){ P.loading=false; emit(); } });
    }).catch(function(){ setError('Die Datei ließ sich nicht laden.'); });
  }

  function loadHls(){
    if(window.Hls) return Promise.resolve(window.Hls);
    return new Promise(function(res,rej){
      var s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
      s.onload=function(){ res(window.Hls); }; s.onerror=function(){ rej(new Error('hls.js')); };
      document.head.appendChild(s);
    });
  }
  function playRadio(item){
    radio.volume=vol();
    var isHls = item.hls || /\.m3u8(\?|$)/i.test(item.url);
    if(isHls && !radio.canPlayType('application/vnd.apple.mpegurl')){
      loadHls().then(function(Hls){
        if(P.cur!==item) return;
        if(!Hls.isSupported()){ setError('Dieser Sender sendet im HLS-Format, das dein Browser nicht kann.'); return; }
        hls=new Hls(); hls.loadSource(item.url); hls.attachMedia(radio);
        hls.on(Hls.Events.MANIFEST_PARSED,function(){ radio.play().catch(function(){}); });
        hls.on(Hls.Events.ERROR,function(e,d){ if(d&&d.fatal) setError('Der Sender antwortet gerade nicht.'); });
      }).catch(function(){ setError('Der HLS-Abspieler ließ sich nicht laden. Bist du online?'); });
    } else {
      radio.src=item.url;
      radio.play().catch(function(e){ if(e.name==='NotAllowedError'){ P.loading=false; emit(); } });
    }
    G.radio.click(item);
  }

  function playYT(item){
    G.yt.mount(u.$('#ytHost'),item,vol());
    P.loading=false; P.playing=true; emit();
  }

  P.toggle = function(){
    if(!P.cur) return;
    if(P.error){ var c=P.cur; P.cur=null; P.play(c,P.queue); return; }
    if(P.cur.kind==='track'){ if(media.paused) media.play().catch(function(){}); else media.pause(); }
    else if(P.cur.kind==='radio'){
      if(radio.paused){ if(!radio.src&&!hls) playRadio(P.cur); else radio.play().catch(function(){}); }
      else { radio.pause(); }
    }
    else { if(G.yt.state.playing) G.yt.pause(); else G.yt.play(); P.playing=!G.yt.state.playing; emit(); }
  };
  P.pause = function(){ if(P.playing) P.toggle(); };

  function pick(step){
    var n=P.queue.length; if(!n) return null;
    if(S.settings.shuffle && n>1 && step>0){ var j; do{ j=Math.floor(Math.random()*n); }while(j===P.index); return j; }
    var i=P.index+step;
    if(i>=n){ if(S.settings.repeat==='all') i=0; else return null; }
    if(i<0) i = S.settings.repeat==='all' ? n-1 : 0;
    return i;
  }
  P.next = function(auto){
    if(!P.cur) return;
    if(P.cur.kind==='yt' && P.cur.ytType==='list' && !auto){ G.yt.next(); return; }
    var i=pick(1);
    if(i==null){ if(auto){ P.playing=false; emit(); } else u.toast('Das war der letzte Titel.'); return; }
    var q=P.queue; P.cur=null; P.play(q[i],q);
  };
  P.prev = function(){
    if(!P.cur) return;
    if(P.cur.kind==='track' && media.currentTime>4){ media.currentTime=0; return; }
    if(P.cur.kind==='yt' && P.cur.ytType==='list'){ G.yt.prev(); return; }
    var i=pick(-1); if(i==null) return;
    var q=P.queue; P.cur=null; P.play(q[i],q);
  };
  P.stop = function(){ stopAll(); P.cur=null; P.playing=false; P.loading=false; P.error=''; emit(); session(); };

  P.seekTo = function(frac){
    if(!P.cur) return;
    var d=P.duration(); if(!d) return;
    if(P.cur.kind==='track') media.currentTime=frac*d;
    else if(P.cur.kind==='yt') G.yt.seek(frac*d);
  };
  P.time = function(){ if(!P.cur) return 0; if(P.cur.kind==='track') return media.currentTime||0; if(P.cur.kind==='yt') return G.yt.state.time||0; return 0; };
  P.duration = function(){
    if(!P.cur) return 0;
    if(P.cur.kind==='track') return isFinite(media.duration)&&media.duration>0? media.duration : (P.cur.duration||0);
    if(P.cur.kind==='yt') return G.yt.state.duration||0;
    return 0;
  };
  P.isLive = function(){ return P.cur && P.cur.kind==='radio'; };
  P.setVolume = function(v){
    v=Math.max(0,Math.min(1,v)); S.settings.volume=v; S.save('settings');
    media.volume=v; radio.volume=v; G.yt.volume(v); media.muted=radio.muted=false;
  };
  P.mediaEl = function(){ return media; };

  /* ---------- Ereignisse der Elemente ---------- */
  function bind(el,kind){
    el.addEventListener('playing',function(){ if(P.cur&&P.cur.kind===kind){ P.loading=false; P.playing=true; P.error=''; emit(); wake(); } });
    el.addEventListener('pause',function(){ if(P.cur&&P.cur.kind===kind){ P.playing=false; emit(); wake(); } });
    el.addEventListener('waiting',function(){ if(P.cur&&P.cur.kind===kind){ P.loading=true; emit(); } });
    el.addEventListener('canplay',function(){ if(P.cur&&P.cur.kind===kind&&P.loading){ P.loading=false; emit(); } });
    el.addEventListener('error',function(){
      if(!P.cur||P.cur.kind!==kind||!el.getAttribute('src')&&!hls) return;
      var c=el.error&&el.error.code;
      setError(kind==='radio'
        ? 'Der Sender antwortet gerade nicht oder sendet in einem Format, das dein Browser nicht kann.'
        : (c===4 ? 'Dieses Format kann dein Browser nicht abspielen. MP3, M4A, MP4 und WebM gehen überall; MKV, AVI und WMV oft nicht.' : 'Die Datei ließ sich nicht abspielen.'));
    });
  }
  bind(media,'track'); bind(radio,'radio');
  media.addEventListener('ended',function(){
    if(!P.cur||P.cur.kind!=='track') return;
    if(S.settings.repeat==='one'){ media.currentTime=0; media.play().catch(function(){}); return; }
    P.next(true);
  });
  media.addEventListener('loadedmetadata',function(){
    /* Erst hier wissen wir sicher, ob eine Datei Bild hat */
    if(P.cur&&P.cur.kind==='track'){ var v=media.videoWidth>0; media.hidden=!v; u.$('#stage').classList.toggle('has-video',v); }
    emit();
  });

  G.yt.onState(function(st){
    if(!P.cur||P.cur.kind!=='yt') return;
    if(st.error){ setError(st.error===101||st.error===150||st.error===153 ? 'Dieses Video darf nicht eingebettet werden. Öffne es direkt auf YouTube.' : 'Das Video ließ sich nicht abspielen.'); return; }
    if(st.ended){ if(P.cur.ytType==='list') return; if(S.settings.repeat==='one'){ G.yt.seek(0); G.yt.play(); return; } P.next(true); return; }
    var was=P.playing; P.playing=st.playing; P.loading=false;
    if(was!==P.playing) { emit(); wake(); }
  });

  /* ---------- Bildschirm an lassen (Videos) ---------- */
  var lock=null;
  function wake(){
    var want = S.settings.keepAwake && P.playing && P.cur && (P.cur.kind==='yt' || P.cur.isVideo);
    if(want && !lock && navigator.wakeLock){ navigator.wakeLock.request('screen').then(function(l){ lock=l; l.addEventListener('release',function(){ lock=null; }); }).catch(function(){}); }
    else if(!want && lock){ lock.release().catch(function(){}); lock=null; }
  }
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible') wake(); });

  /* ---------- Sperrbildschirm, Kontrollzentrum, Auto ---------- */
  function session(){
    if(!('mediaSession' in navigator)) return;
    var ms=navigator.mediaSession, c=P.cur;
    if(!c){ ms.metadata=null; ms.playbackState='none'; return; }
    var art=[];
    if(c.art) art.push({src:c.art,sizes:'512x512'});
    art.push({src:'img/icon-512.png?v=6',sizes:'512x512',type:'image/png'});
    try{
      ms.metadata=new MediaMetadata({
        title:c.title,
        artist: c.kind==='radio'?'Radio · '+(c.sub||''):(c.artist||c.sub||''),
        album: c.album || (c.kind==='yt'?'YouTube':c.kind==='radio'?'G04Musik Radio':''),
        artwork:art
      });
    }catch(e){}
  }
  if('mediaSession' in navigator){
    var A=function(n,f){ try{ navigator.mediaSession.setActionHandler(n,f); }catch(e){} };
    A('play',function(){ if(!P.playing) P.toggle(); });
    A('pause',function(){ if(P.playing) P.toggle(); });
    A('nexttrack',function(){ P.next(); });
    A('previoustrack',function(){ P.prev(); });
    A('seekto',function(d){ var du=P.duration(); if(du&&d.seekTime!=null) P.seekTo(d.seekTime/du); });
    S.on(function(w){ if(w==='player'&&'mediaSession' in navigator) try{ navigator.mediaSession.playbackState=P.playing?'playing':(P.cur?'paused':'none'); }catch(e){} });
  }

  /* ---------- Einschlaf-Timer ---------- */
  P.setSleep = function(min){
    P.sleepAt = min ? Date.now()+min*60000 : 0;
    if(!min) restoreVol();
    emit();
  };
  P.sleepLeft = function(){ return P.sleepAt ? Math.max(0,Math.ceil((P.sleepAt-Date.now())/60000)) : 0; };
  var fading=false;
  function restoreVol(){ if(fading){ fading=false; media.volume=radio.volume=vol(); G.yt.volume(vol()); } }
  setInterval(function(){
    if(!P.sleepAt) return;
    var left=(P.sleepAt-Date.now())/1000;
    if(left<=0){ P.sleepAt=0; if(P.playing) P.toggle(); restoreVol(); u.toast('Einschlaf-Timer: Wiedergabe beendet. Gute Nacht.'); emit(); return; }
    if(left<30){ fading=true; var f=vol()*left/30; media.volume=radio.volume=f; G.yt.volume(f); }
  },1000);

  P.IOS = IOS;
})();
