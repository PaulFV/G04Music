/* ============================================================
   G04Musik — Eigene Listen (Playlisten)
   Speichern im localStorage, Hinzufügen/Entfernen,
   Export als G04Musik-Datei (.json) oder M3U, Import beider Formate.

   Eine Liste: { id, name, created, items:[Eintrag] }
   Eigene Songs werden mit Dateiname + Größe gespeichert, damit sie nach
   einem Import auf einem anderen Gerät wiedergefunden werden.
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store;

  var PL = G.lists = { all: u.ls.get('playlists', []) };
  function save(){ u.ls.set('playlists', PL.all); S.emit('lists'); }

  /* Eintrag auf das Nötige kürzen */
  function slim(it){
    var o = { kind: it.kind, id: it.id, title: it.title, sub: it.sub || '' };
    if (it.kind === 'track') {
      o.fileName = it.fileName || ''; o.size = it.size || 0; o.artist = it.artist || '';
      o.album = it.album || ''; o.duration = it.duration || 0; o.isVideo = !!it.isVideo;
    }
    if (it.kind === 'radio') { o.url = it.url; o.hls = !!it.hls; o.art = it.art || ''; }
    if (it.kind === 'yt') { o.ytType = it.ytType; o.ytId = it.ytId; o.art = it.art || ''; if (it.duration) o.duration = it.duration; }
    return o;
  }

  PL.get = function(id){ for (var i = 0; i < PL.all.length; i++) if (PL.all[i].id === id) return PL.all[i]; return null; };
  function uniqueName(name){
    name = (name || '').trim() || 'Neue Liste';
    var taken = PL.all.map(function(l){ return l.name.toLowerCase(); }), n = name, k = 2;
    while (taken.indexOf(n.toLowerCase()) >= 0) n = name + ' (' + (k++) + ')';
    return n;
  }
  PL.create = function(name, items){
    var l = { id: u.uid(), name: uniqueName(name), created: Date.now(), items: (items || []).map(slim) };
    PL.all.unshift(l); save(); return l;
  };
  PL.rename = function(id, name){ var l = PL.get(id); if (!l) return; name = (name || '').trim(); if (name && name !== l.name) { l.name = uniqueName(name); save(); } };
  PL.remove = function(id){ PL.all = PL.all.filter(function(l){ return l.id !== id; }); save(); };
  PL.add = function(id, it){
    var l = PL.get(id); if (!l) return false;
    var k = S.key(it);
    if (l.items.some(function(x){ return S.key(x) === k; })) return false;
    l.items.push(slim(it)); save(); return true;
  };
  PL.removeAt = function(id, idx){ var l = PL.get(id); if (!l) return; l.items.splice(idx, 1); save(); };
  PL.move = function(id, idx, dir){
    var l = PL.get(id); if (!l) return; var j = idx + dir;
    if (j < 0 || j >= l.items.length) return;
    var t = l.items[idx]; l.items[idx] = l.items[j]; l.items[j] = t; save();
  };

  /* Einträge einer Liste für die Anzeige auflösen (eigene Songs aus der Bibliothek) */
  PL.resolve = function(l){
    return l.items.map(function(x){
      if (x.kind !== 'track') return x;
      return G.library.get(x.id) || findTrack(x);
    }).filter(Boolean);
  };
  PL.missing = function(l){ return l.items.length - PL.resolve(l).length; };
  PL.art = function(l){ var r = PL.resolve(l); for (var i = 0; i < r.length; i++) if (r[i].art) return r[i].art; return ''; };

  /* Song in der Bibliothek wiederfinden: erst Dateiname + Größe, dann Titel (+ Künstler) */
  function findTrack(x){
    var T = G.library.tracks, i, n = (x.fileName || '').toLowerCase(), t = (x.title || '').toLowerCase(), a = (x.artist || '').toLowerCase();
    if (n) for (i = 0; i < T.length; i++) if ((T[i].fileName || '').toLowerCase() === n && (!x.size || T[i].size === x.size)) return T[i];
    if (n) for (i = 0; i < T.length; i++) if ((T[i].fileName || '').toLowerCase() === n) return T[i];
    if (t) for (i = 0; i < T.length; i++) if (T[i].title.toLowerCase() === t && (!a || (T[i].artist || '').toLowerCase() === a)) return T[i];
    return null;
  }

  /* ---------- Export ---------- */
  function fileSafe(s){ return String(s).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Liste'; }
  /* Favoriten als Pseudo-Liste (gleiche Form wie eine Liste) */
  PL.FAV_ID = 'favorites';
  PL.favList = function(){ return { id: PL.FAV_ID, name: 'Favoriten', items: S.favs.map(function(f){ return f.kind === 'track' ? slim(G.library.get(f.id) || f) : f; }) }; };
  PL.toJSON = function(lists, favs){
    var o = { format: 'g04musik-playlist', version: 1, app: 'G04Musik ' + G.VERSION, exported: new Date().toISOString(),
      lists: lists.filter(function(l){ return l.id !== PL.FAV_ID; }).map(function(l){ return { name: l.name, items: l.items }; }) };
    if (favs) o.favorites = PL.favList().items;
    return JSON.stringify(o, null, 2);
  };
  PL.toM3U = function(l){
    var out = ['#EXTM3U', '#PLAYLIST:' + l.name];
    l.items.forEach(function(x){
      var dur = x.kind === 'radio' ? -1 : Math.round(x.duration || 0) || -1;
      var title = (x.kind === 'track' && x.artist ? x.artist + ' - ' : '') + x.title;
      out.push('#EXTINF:' + dur + ',' + title);
      if (x.kind === 'radio') out.push(x.url);
      else if (x.kind === 'yt') out.push(x.ytType === 'list' ? 'https://www.youtube.com/playlist?list=' + x.ytId : 'https://www.youtube.com/watch?v=' + x.ytId);
      else out.push(x.fileName || x.title);
    });
    return out.join('\r\n') + '\r\n';
  };
  /* what: 'all' (Favoriten + alle Listen) oder eine Liste/Favoriten; kind: 'json' | 'm3u' */
  PL.exportFile = function(what, kind){
    if (what === 'all') return u.saveFile('G04Musik-Sicherung.g04musik.json', PL.toJSON(PL.all, true), 'application/json');
    var l = what === PL.FAV_ID ? PL.favList() : PL.get(what); if (!l) return Promise.resolve(false);
    if (kind === 'm3u') return u.saveFile(fileSafe(l.name) + '.m3u', PL.toM3U(l), 'audio/x-mpegurl');
    return u.saveFile(fileSafe(l.name) + '.g04musik.json', l.id === PL.FAV_ID ? PL.toJSON([], true) : PL.toJSON([l]), 'application/json');
  };

  /* ---------- Import ---------- */
  function parseM3U(text, fallbackName){
    var lines = text.split(/\r?\n/), name = fallbackName, items = [], title = '';
    lines.forEach(function(raw){
      var line = raw.trim(); if (!line) return;
      if (/^#PLAYLIST:/i.test(line)) { name = line.slice(10).trim() || name; return; }
      if (/^#EXTINF:/i.test(line)) { title = line.replace(/^#EXTINF:[^,]*,/i, '').trim(); return; }
      if (line[0] === '#') return;
      var yt = G.yt.parse(line);
      if (yt && /youtu/.test(line)) { var it = G.yt.toItem(yt, { title: title || undefined }); items.push(it); }
      else if (/^https?:\/\//i.test(line)) items.push({ kind: 'radio', id: 'url:' + line, title: title || line.replace(/^https?:\/\//, '').split('/')[0], sub: 'Eigener Sender', url: line, hls: /\.m3u8(\?|$)/i.test(line), art: '' });
      else {
        var file = line.split(/[\\/]/).pop(), nm = G.tags.fromName(file);
        items.push({ kind: 'track', id: 'file:' + file, fileName: file, size: 0, title: nm.title, artist: nm.artist || '', sub: '' });
      }
      title = '';
    });
    return [{ name: name, items: items }];
  }
  /* Liefert {lists, tracks, missing} */
  PL.importText = function(text, fileName){
    var base = String(fileName || 'Importiert').replace(/\.(g04musik\.)?(json|m3u8?|txt)$/i, '');
    var lists, favIn = null;
    var trimmed = text.replace(/^﻿/, '').trim();
    if (trimmed[0] === '{') {
      var j = JSON.parse(trimmed);
      if (j.format !== 'g04musik-playlist' || (!Array.isArray(j.lists) && !Array.isArray(j.favorites))) throw new Error('Das ist keine G04Musik-Listendatei.');
      lists = j.lists || [];
      favIn = j.favorites || null;
    } else if (/^#EXTM3U|^#EXTINF|^https?:\/\//im.test(trimmed) || /\.(mp3|m4a|flac|wav|ogg|mp4)\s*$/im.test(trimmed)) {
      lists = parseM3U(trimmed, base);
    } else throw new Error('Unbekanntes Format. Erwartet wird eine .json-Datei aus G04Musik oder eine M3U-Liste.');

    var made = 0, tracks = 0, missing = 0, favs = 0;
    function fix(x){
      if (!x || !x.kind) return null;
      if (x.kind === 'track') {
          var t = G.library.get(x.id) || findTrack(x);
          if (!t) { missing++; return x; }   /* bleibt drin, wird gefunden, sobald die Datei in der Bibliothek ist */
          tracks++; return t;
        }
        if (x.kind === 'radio' && !x.url) return null;
        if (x.kind === 'yt' && !x.ytId) return null;
        return x;
    }
    /* rückwärts anlegen, damit die Reihenfolge der Datei erhalten bleibt (neue Listen kommen nach oben) */
    lists.slice().reverse().forEach(function(l){
      PL.create(l.name || base, (l.items || []).map(fix).filter(Boolean)); made++;
    });
    /* Favoriten zusammenführen (keine doppelten) */
    if (favIn) favIn.map(fix).filter(Boolean).forEach(function(x){ if (!S.isFav(x)) { S.toggleFav(x); favs++; } });
    return { lists: made, tracks: tracks, missing: missing, favs: favs };
  };
})();
