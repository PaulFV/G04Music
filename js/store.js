/* ============================================================
   G04Musik — Zustand: Favoriten, Verlauf, YouTube-Liste, Einstellungen
   Alles im localStorage; die Dateien selbst liegen in der IndexedDB.

   Ein "Eintrag" (item) sieht für alle Quellen gleich aus:
   { kind:'track'|'radio'|'yt', id, title, sub, art, ... }
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;

  var s = G.store = {
    favs: u.ls.get('favs', []),          /* Einträge (Radio und YouTube vollständig, Songs per id) */
    history: u.ls.get('history', []),
    yt: u.ls.get('yt', []),
    view: u.ls.get('view', 'start'),
    tab: u.ls.get('tab', 'favs'),
    radioCountry: u.ls.get('radioCountry', 'DE'),
    settings: Object.assign({
      volume: 0.9,
      viz: true,
      keepAwake: true,
      sleepDefault: 30,
      repeat: 'off',      /* off | all | one */
      shuffle: false
    }, u.ls.get('settings', {})),
    listeners: []
  };

  s.save = function(key){
    if(key==='settings') u.ls.set('settings', s.settings);
    else u.ls.set(key, s[key]);
  };
  s.on = function(fn){ s.listeners.push(fn); };
  s.emit = function(what){ s.listeners.forEach(function(fn){ try{ fn(what); }catch(e){ console.error(e); } }); };

  /* Nur das Nötige speichern (keine Blob-Adressen) */
  function slim(it){
    var o={kind:it.kind,id:it.id,title:it.title,sub:it.sub||''};
    if(it.kind!=='track') o.art=it.art||'';
    if(it.kind==='radio'){ o.url=it.url; o.hls=!!it.hls; o.tags=it.tags||''; o.country=it.country||''; }
    if(it.kind==='yt'){ o.ytType=it.ytType; o.ytId=it.ytId; }
    return o;
  }
  s.key = function(it){ return it.kind+':'+it.id; };
  s.isFav = function(it){ var k=s.key(it); return s.favs.some(function(f){ return s.key(f)===k; }); };
  s.toggleFav = function(it){
    var k=s.key(it), i=-1;
    s.favs.forEach(function(f,j){ if(s.key(f)===k) i=j; });
    if(i>=0) s.favs.splice(i,1); else s.favs.unshift(slim(it));
    s.save('favs'); s.emit('favs');
    return i<0;
  };
  s.addHistory = function(it){
    var k=s.key(it);
    s.history = [slim(it)].concat(s.history.filter(function(h){ return s.key(h)!==k; })).slice(0,40);
    s.save('history'); s.emit('history');
  };
  s.dropTrack = function(id){
    s.favs = s.favs.filter(function(f){ return !(f.kind==='track'&&f.id===id); });
    s.history = s.history.filter(function(f){ return !(f.kind==='track'&&f.id===id); });
    s.save('favs'); s.save('history');
  };
  s.addYT = function(it){
    if(s.yt.some(function(y){ return y.id===it.id; })) return false;
    s.yt.unshift(slim(it)); s.save('yt'); s.emit('yt'); return true;
  };
  s.removeYT = function(id){
    s.yt = s.yt.filter(function(y){ return y.id!==id; });
    s.favs = s.favs.filter(function(f){ return !(f.kind==='yt'&&f.id===id); });
    s.save('yt'); s.save('favs'); s.emit('yt');
  };
  s.set = function(k,v){ s.settings[k]=v; s.save('settings'); s.emit('settings'); };
  s.resetAll = function(){
    ['favs','history','yt','view','tab','radioCountry','settings'].forEach(u.ls.del);
  };
})();
