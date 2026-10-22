/* ============================================================
   G04Musik — Eigene Musik & Musikvideos: einlesen, ordnen, löschen
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;

  var AUDIO = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|wma|aiff?|alac|caf)$/i;
  var VIDEO = /\.(mp4|m4v|webm|mov|mkv|ogv|3gp|avi|wmv)$/i;

  var L = G.library = { tracks: [], ready: false };
  var urls = {};

  function toItem(m){
    if(m.cover && !urls[m.id]) urls[m.id] = URL.createObjectURL(m.cover);
    m.kind = 'track';
    m.art = urls[m.id] || '';
    m.sub = [m.artist||(m.isVideo?'Musikvideo':'Unbekannter Künstler'), m.album].filter(Boolean).join(' · ');
    return m;
  }
  function sort(){
    L.tracks.sort(function(a,b){
      return (a.album||'~').localeCompare(b.album||'~','de') || (a.track||999)-(b.track||999) || a.title.localeCompare(b.title,'de');
    });
  }

  L.load = function(){
    return G.db.allTracks().then(function(list){
      L.tracks = (list||[]).map(toItem); sort(); L.ready=true; G.store.emit('library');
    }).catch(function(e){ console.warn(e); L.ready=true; G.store.emit('library'); });
  };
  L.get = function(id){ for(var i=0;i<L.tracks.length;i++) if(L.tracks[i].id===id) return L.tracks[i]; return null; };
  L.songs = function(){ return L.tracks.filter(function(t){ return !t.isVideo; }); };
  L.videos = function(){ return L.tracks.filter(function(t){ return t.isVideo; }); };
  L.albums = function(){
    var map={}, out=[];
    L.songs().forEach(function(t){
      var k=(t.album||'Singles')+'\u0001'+(t.album?(t.artist||''):'');
      if(!map[k]){ map[k]={key:k,title:t.album||'Singles',artist:t.album?(t.artist||''):'Verschiedene',tracks:[],art:''}; out.push(map[k]); }
      map[k].tracks.push(t); if(!map[k].art&&t.art) map[k].art=t.art;
    });
    return out;
  };
  L.isMedia = function(f){
    return /^(audio|video)\//.test(f.type) || AUDIO.test(f.name) || VIDEO.test(f.name);
  };
  L.isVideoFile = function(f){ return /^video\//.test(f.type) || VIDEO.test(f.name); };

  /* Länge und (bei Videos) ein Vorschaubild ermitteln */
  function probe(file,isVideo){
    return new Promise(function(res){
      var v=document.createElement('video'), url=URL.createObjectURL(file), done=false;
      v.muted=true; v.preload='metadata'; v.playsInline=true;
      function finish(r){ if(done) return; done=true; clearTimeout(to); v.removeAttribute('src'); try{v.load();}catch(e){} URL.revokeObjectURL(url); res(r); }
      var to=setTimeout(function(){ finish({duration:0,playable:false}); },9000);
      v.onerror=function(){ finish({duration:0,playable:false}); };
      v.onloadedmetadata=function(){
        var d=isFinite(v.duration)?v.duration:0, hasPic=v.videoWidth>0;
        if(!isVideo||!hasPic) return finish({duration:d,playable:true,hasVideo:hasPic});
        v.onseeked=function(){
          try{
            var w=480, h=Math.round(w*v.videoHeight/v.videoWidth)||270, c=document.createElement('canvas');
            c.width=w; c.height=h; c.getContext('2d').drawImage(v,0,0,w,h);
            c.toBlob(function(b){ finish({duration:d,playable:true,hasVideo:true,thumb:b}); },'image/jpeg',.8);
          }catch(e){ finish({duration:d,playable:true,hasVideo:true}); }
        };
        try{ v.currentTime=Math.min(8,d*0.15||1); }catch(e){ finish({duration:d,playable:true,hasVideo:true}); }
      };
      v.src=url;
    });
  }

  L.importing = null; /* {done,total} während des Einlesens */

  L.importFiles = function(fileList){
    var files=Array.prototype.slice.call(fileList||[]).filter(L.isMedia);
    var skipped=(fileList?fileList.length:0)-files.length;
    if(!files.length){ u.toast(skipped? 'Keine Musik- oder Videodateien gefunden.' : 'Nichts ausgewählt.', !!skipped); return Promise.resolve(0); }
    if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(function(){});

    var known={}; L.tracks.forEach(function(t){ known[t.fileName+'|'+t.size]=1; });
    var added=0, dup=0, bad=0, i=0;
    L.importing={done:0,total:files.length}; G.store.emit('import');

    function next(){
      if(i>=files.length) return Promise.resolve();
      var f=files[i++];
      if(known[f.name+'|'+f.size]){ dup++; L.importing.done++; G.store.emit('import'); return next(); }
      var isVid=L.isVideoFile(f);
      return G.tags.read(f).then(function(t){
        return probe(f,isVid).then(function(p){
          if(!p.playable) bad++;
          var meta={
            id:u.uid(), title:t.title||f.name, artist:t.artist, album:isVid?'':t.album, track:t.track, year:t.year,
            duration:p.duration||0, isVideo:isVid&&p.hasVideo!==false, size:f.size, type:f.type||'', fileName:f.name,
            added:Date.now(), cover:t.cover||p.thumb||null, playable:p.playable
          };
          return G.db.putTrack(meta,f).then(function(){
            known[f.name+'|'+f.size]=1; L.tracks.push(toItem(meta)); added++;
          });
        });
      }).catch(function(e){
        console.warn('Import',f.name,e); bad++;
        if(e&&e.name==='QuotaExceededError'){ i=files.length; u.toast('Der Speicher ist voll. Lösche Titel oder gib in den Einstellungen mehr frei.',true); }
      }).then(function(){ L.importing.done++; G.store.emit('import'); return next(); });
    }
    return next().then(function(){
      sort(); L.importing=null; G.store.emit('library');
      var msg = added? added+(added===1?' Titel':' Titel')+' hinzugefügt' : 'Nichts Neues hinzugefügt';
      if(dup) msg+=' · '+dup+' schon vorhanden';
      u.toast(msg);
      if(bad) setTimeout(function(){ u.toast(bad+(bad===1?' Datei kann':' Dateien können')+' dieser Browser vermutlich nicht abspielen (z. B. AVI, WMV oder MKV mit seltenem Format).',true); },700);
      return added;
    });
  };

  L.remove = function(id){
    return G.db.remove(id).then(function(){
      if(urls[id]){ URL.revokeObjectURL(urls[id]); delete urls[id]; }
      L.tracks = L.tracks.filter(function(t){ return t.id!==id; });
      G.store.dropTrack(id); G.store.emit('library');
    });
  };
  L.clear = function(){
    return G.db.clear().then(function(){
      Object.keys(urls).forEach(function(k){ URL.revokeObjectURL(urls[k]); }); urls={};
      L.tracks=[]; G.store.emit('library');
    });
  };
  L.totalSize = function(){ return L.tracks.reduce(function(a,t){ return a+(t.size||0); },0); };
})();
