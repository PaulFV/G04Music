/* ============================================================
   G04Musik — DS-Server (Synology DiskStation): Musik importieren
   Audio Station (Bibliothek nach Titeln) und DS File / File Station (Ordner).
   Es wird nur die Sitzungs-ID im Speicher gehalten, nie das Passwort.
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;
  var DS = G.ds = { sid:{}, apis:null, base:'' };

  var MEDIA = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|wma|aiff?|alac|mp4|m4v|webm|mov|mkv)$/i;
  DS.isMedia = function(name){ return MEDIA.test(name||''); };

  DS.cfg = function(){ return u.ls.get('dsCfg', {url:'', user:'', mode:'audio'}); };
  DS.saveCfg = function(c){ u.ls.set('dsCfg', c); };

  /* Adresse vereinheitlichen: https:// ergänzen, Schrägstrich am Ende weg */
  DS.normUrl = function(s){
    s = String(s||'').trim().replace(/\/+$/,'');
    if(!s) return '';
    if(!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s;
  };

  function err(code, msg){ var e = new Error(msg); e.code = code; return e; }

  /* Ein API-Aufruf. POST mit Formular-Daten, damit Passwörter nicht in Adressen landen. */
  function call(path, params){
    var body = new URLSearchParams();
    Object.keys(params).forEach(function(k){ if(params[k]!=null) body.append(k, params[k]); });
    return fetch(DS.base + '/webapi/' + path, { method:'POST', body:body, credentials:'omit', mode:'cors' })
      .catch(function(){ throw err('NET', 'Keine Verbindung zur DiskStation.'); })
      .then(function(r){
        if(!r.ok) throw err('HTTP'+r.status, 'Die DiskStation antwortet mit Fehler '+r.status+'.');
        return r.json().catch(function(){ throw err('JSON', 'Unter dieser Adresse antwortet keine DiskStation.'); });
      });
  }
  function api(name, method, params, sidKey){
    var a = DS.apis && DS.apis[name];
    if(!a) return Promise.reject(err('NOAPI', name === 'SYNO.AudioStation.Song' ? 'Audio Station ist auf dieser DiskStation nicht installiert.' : 'Diese Funktion gibt es auf der DiskStation nicht ('+name+').'));
    var p = Object.assign({ api:name, version:Math.min(a.maxVersion, (params&&params._v)||a.maxVersion), method:method }, params||{});
    delete p._v;
    if(sidKey) p._sid = DS.sid[sidKey];
    return call(a.path, p).then(function(j){
      if(!j.success) throw err('API'+((j.error&&j.error.code)||0), apiMsg(name, j.error&&j.error.code));
      return j.data || {};
    });
  }
  function apiMsg(name, c){
    if(name === 'SYNO.API.Auth') return ({400:'Benutzername oder Passwort ist falsch.',401:'Dieses Konto ist deaktiviert.',402:'Keine Berechtigung für diese App.',403:'Bitte den Code aus deiner Authentifizierungs-App eingeben.',404:'Der Bestätigungscode stimmt nicht.',406:'Auf der DiskStation muss die 2-Faktor-Anmeldung eingerichtet werden.',407:'Deine Adresse ist auf der DiskStation gesperrt (zu viele Fehlversuche).'})[c] || 'Anmeldung fehlgeschlagen (Fehler '+c+').';
    return ({105:'Keine Berechtigung.',106:'Die Sitzung ist abgelaufen. Bitte neu verbinden.',119:'Die Sitzung ist abgelaufen. Bitte neu verbinden.',408:'Ordner oder Datei nicht gefunden.',407:'Keine Berechtigung für diesen Ordner.'})[c] || 'Fehler '+c+' von der DiskStation.';
  }

  /* Verbinden: verfügbare Schnittstellen abfragen und anmelden */
  DS.connect = function(url, user, pass, otp, mode){
    DS.base = DS.normUrl(url);
    if(!DS.base) return Promise.reject(err('URL','Bitte die Adresse deiner DiskStation eingeben.'));
    if(location.protocol === 'https:' && /^http:/i.test(DS.base))
      return Promise.reject(err('MIXED','Die App läuft über https. Die DiskStation muss deshalb auch über https erreichbar sein (meist Port 5001).'));
    var names = 'SYNO.API.Auth,SYNO.AudioStation.Song,SYNO.AudioStation.Stream,SYNO.AudioStation.Download,SYNO.FileStation.List,SYNO.FileStation.Download';
    return call('query.cgi', {api:'SYNO.API.Info', version:1, method:'query', query:names}).then(function(j){
      if(!j.success || !j.data || !j.data['SYNO.API.Auth']) throw err('JSON','Unter dieser Adresse antwortet keine DiskStation.');
      DS.apis = j.data;
      var session = mode === 'files' ? 'FileStation' : 'AudioStation';
      return api('SYNO.API.Auth','login',{ _v:6, account:user, passwd:pass, otp_code:otp||null, session:session, format:'sid' });
    }).then(function(d){
      if(!d.sid) throw err('API0','Anmeldung fehlgeschlagen.');
      DS.sid[mode] = d.sid; DS.user = user;
      return true;
    });
  };
  DS.connected = function(mode){ return !!DS.sid[mode]; };
  DS.logout = function(){
    Object.keys(DS.sid).forEach(function(m){
      api('SYNO.API.Auth','logout',{ _v:6, session: m==='files'?'FileStation':'AudioStation' }, m).catch(function(){});
    });
    DS.sid = {};
  };

  /* ---------- Audio Station ---------- */
  DS.songs = function(onProgress){
    var all = [], step = 1000;
    function page(off){
      return api('SYNO.AudioStation.Song','list',{ library:'all', limit:step, offset:off, additional:'song_tag,song_audio', sort_by:'title', sort_direction:'ASC' },'audio').then(function(d){
        (d.songs||[]).forEach(function(s){
          var tag = (s.additional&&s.additional.song_tag)||{}, au = (s.additional&&s.additional.song_audio)||{};
          var name = String(s.path||s.title||'').split('/').pop();
          all.push({ id:s.id, title:s.title||name, artist:tag.artist||tag.album_artist||'', album:tag.album||'', track:tag.track||0,
                     duration:au.duration||0, size:au.filesize||0, name:name, path:s.path||'' });
        });
        if(onProgress) onProgress(all.length, d.total||all.length);
        if((d.songs||[]).length === step && all.length < (d.total||0)) return page(off+step);
        return all;
      });
    }
    return page(0);
  };

  /* ---------- DS File / File Station ---------- */
  DS.shares = function(){
    return api('SYNO.FileStation.List','list_share',{ additional:'real_path', sort_by:'name' },'files').then(function(d){
      return (d.shares||[]).map(function(s){ return { name:s.name, path:s.path, dir:true }; });
    });
  };
  DS.list = function(path){
    var out = [], step = 1000;
    function page(off){
      return api('SYNO.FileStation.List','list',{ folder_path:path, offset:off, limit:step, additional:'size', sort_by:'name' },'files').then(function(d){
        (d.files||[]).forEach(function(f){
          if(f.isdir) out.push({ name:f.name, path:f.path, dir:true });
          else if(DS.isMedia(f.name)) out.push({ name:f.name, path:f.path, dir:false, size:(f.additional&&f.additional.size)||0 });
        });
        if((d.files||[]).length === step && out.length < (d.total||0)) return page(off+step);
        return out;
      });
    }
    return page(0);
  };
  /* Alle Musikdateien eines Ordners samt Unterordnern (höchstens 5000) */
  DS.walk = function(path, onProgress){
    var files = [], queue = [path], dirs = 0;
    function next(){
      if(!queue.length || files.length >= 5000) return Promise.resolve(files);
      var p = queue.shift();
      return DS.list(p).then(function(items){
        dirs++;
        items.forEach(function(x){ if(x.dir) queue.push(x.path); else files.push(x); });
        if(onProgress) onProgress(files.length, dirs);
        return next();
      });
    }
    return next();
  };

  /* ---------- Datei holen ---------- */
  function fetchFile(url, params, name, type){
    var body = new URLSearchParams(); Object.keys(params).forEach(function(k){ body.append(k, params[k]); });
    return fetch(url, { method:'POST', body:body, credentials:'omit', mode:'cors' })
      .catch(function(){ throw err('NET','Keine Verbindung zur DiskStation.'); })
      .then(function(r){
        if(!r.ok) throw err('HTTP'+r.status,'Fehler '+r.status+' beim Laden von „'+name+'“.');
        var ct = r.headers.get('content-type')||'';
        if(/json/.test(ct)) return r.json().then(function(j){ throw err('API'+((j.error&&j.error.code)||0), apiMsg('', j.error&&j.error.code)); });
        return r.blob();
      }).then(function(b){
        var f = new File([b], name, { type: b.type && !/octet-stream/.test(b.type) ? b.type : (type||'') });
        f.g04source = 'ds';
        return f;
      });
  }
  DS.getSong = function(s){
    var a = DS.apis['SYNO.AudioStation.Stream'];
    if(a) return fetchFile(DS.base+'/webapi/'+a.path, { api:'SYNO.AudioStation.Stream', version:Math.min(2,a.maxVersion), method:'stream', id:s.id, _sid:DS.sid.audio }, s.name);
    var d = DS.apis['SYNO.AudioStation.Download'];
    return fetchFile(DS.base+'/webapi/'+d.path, { api:'SYNO.AudioStation.Download', version:1, method:'download', songs:s.id, _sid:DS.sid.audio }, s.name);
  };
  DS.getFile = function(f){
    var a = DS.apis['SYNO.FileStation.Download'];
    return fetchFile(DS.base+'/webapi/'+a.path, { api:'SYNO.FileStation.Download', version:Math.min(2,a.maxVersion), method:'download', path:JSON.stringify([f.path]), mode:'download', _sid:DS.sid.files }, f.name);
  };
})();
