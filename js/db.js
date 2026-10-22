/* ============================================================
   G04Musik — IndexedDB: eigene Songs und Videos
   Zwei Speicher: "tracks" (Kopfdaten + Cover, schnell zu laden)
   und "files" (die eigentlichen Dateien, nur beim Abspielen).
   ============================================================ */
(function(){
  'use strict';
  var G = window.G;
  var NAME='g04musik', VER=1, dbp=null;

  function open(){
    if(dbp) return dbp;
    dbp = new Promise(function(res,rej){
      if(!('indexedDB' in window)) return rej(new Error('IndexedDB fehlt'));
      var r=indexedDB.open(NAME,VER);
      r.onupgradeneeded=function(){
        var db=r.result;
        if(!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks',{keyPath:'id'});
        if(!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      };
      r.onsuccess=function(){ res(r.result); };
      r.onerror=function(){ rej(r.error); };
    });
    return dbp;
  }
  function tx(stores,mode,fn){
    return open().then(function(db){
      return new Promise(function(res,rej){
        var t=db.transaction(stores,mode), out;
        t.oncomplete=function(){ res(out); };
        t.onerror=t.onabort=function(){ rej(t.error); };
        out=fn(t);
      });
    });
  }
  function req(r){ return new Promise(function(res,rej){ r.onsuccess=function(){res(r.result);}; r.onerror=function(){rej(r.error);}; }); }

  G.db = {
    putTrack:function(meta,file){
      return tx(['tracks','files'],'readwrite',function(t){
        t.objectStore('tracks').put(meta);
        t.objectStore('files').put(file,meta.id);
      });
    },
    updateTrack:function(meta){ return tx(['tracks'],'readwrite',function(t){ t.objectStore('tracks').put(meta); }); },
    allTracks:function(){
      return open().then(function(db){ return req(db.transaction('tracks').objectStore('tracks').getAll()); });
    },
    file:function(id){
      return open().then(function(db){ return req(db.transaction('files').objectStore('files').get(id)); });
    },
    remove:function(id){
      return tx(['tracks','files'],'readwrite',function(t){ t.objectStore('tracks').delete(id); t.objectStore('files').delete(id); });
    },
    clear:function(){
      return tx(['tracks','files'],'readwrite',function(t){ t.objectStore('tracks').clear(); t.objectStore('files').clear(); });
    }
  };
})();
