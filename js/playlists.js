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
  var KIND_NAME = { track: 'Musik', radio: 'Radio', yt: 'YouTube' };
  PL.favList = function(kind){
    var f = S.favs.filter(function(x){ return !kind || x.kind === kind; });
    return { id: kind ? 'fav:' + kind : PL.FAV_ID, name: 'Favoriten' + (kind ? ' ' + KIND_NAME[kind] : ''), items: f.map(function(x){ return x.kind === 'track' ? slim(G.library.get(x.id) || x) : x; }) };
  };
  PL.toJSON = function(lists, favs){
    var o = { format: 'g04musik-playlist', version: 1, app: 'G04Musik ' + G.VERSION, exported: new Date().toISOString(),
      lists: lists.filter(function(l){ return l.id !== PL.FAV_ID; }).map(function(l){ return { name: l.name, items: l.items }; }) };
    if (favs) o.favorites = Array.isArray(favs) ? favs : PL.favList().items;
    return JSON.stringify(o, null, 2);
  };
  /* ---------- Gemeinsame Hilfen für die Listen-Formate ---------- */
  function loc(x){
    if (x.kind === 'radio') return x.url;
    if (x.kind === 'yt') return x.ytType === 'list' ? 'https://www.youtube.com/playlist?list=' + x.ytId : 'https://www.youtube.com/watch?v=' + x.ytId;
    return x.fileName || x.title;
  }
  function artistOf(x){ return x.kind === 'track' ? (x.artist || '') : x.kind === 'radio' ? 'Radio' : 'YouTube'; }
  function fullTitle(x){ return (x.kind === 'track' && x.artist ? x.artist + ' - ' : '') + x.title; }
  function secs(x){ return x.kind === 'radio' ? -1 : (Math.round(x.duration || 0) || -1); }
  function xml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]; }); }
  function csvCell(s){ s = String(s == null ? '' : s); return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  var KIND_DE = { track: 'Song', radio: 'Radio', yt: 'YouTube' };

  /* ---------- Export: M3U / M3U8 ---------- */
  PL.toM3U = function(l, utf8){
    var out = ['#EXTM3U'];
    if (utf8) out.push('#EXTENC:UTF-8');
    out.push('#PLAYLIST:' + l.name);
    l.items.forEach(function(x){ out.push('#EXTINF:' + secs(x) + ',' + fullTitle(x)); out.push(loc(x)); });
    return out.join('\r\n') + '\r\n';
  };
  /* ---------- Export: PLS ---------- */
  PL.toPLS = function(l){
    var out = ['[playlist]'];
    l.items.forEach(function(x, i){ var n = i + 1; out.push('File' + n + '=' + loc(x), 'Title' + n + '=' + fullTitle(x), 'Length' + n + '=' + secs(x)); });
    out.push('NumberOfEntries=' + l.items.length, 'Version=2');
    return out.join('\r\n') + '\r\n';
  };
  /* ---------- Export: XSPF (VLC) ---------- */
  PL.toXSPF = function(l){
    var tr = l.items.map(function(x){
      var href = loc(x), isUrl = /^https?:\/\//i.test(href);
      return '    <track>\n' +
        '      <location>' + xml(isUrl ? href : encodeURI(href)) + '</location>\n' +
        '      <title>' + xml(x.title) + '</title>\n' +
        (artistOf(x) ? '      <creator>' + xml(artistOf(x)) + '</creator>\n' : '') +
        (x.album ? '      <album>' + xml(x.album) + '</album>\n' : '') +
        (x.duration && x.kind !== 'radio' ? '      <duration>' + Math.round(x.duration * 1000) + '</duration>\n' : '') +
        '      <annotation>' + xml(KIND_DE[x.kind] || '') + '</annotation>\n' +
        '    </track>';
    }).join('\n');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<playlist version="1" xmlns="http://xspf.org/ns/0/">\n  <title>' + xml(l.name) + '</title>\n  <creator>G04Musik · PaulFV</creator>\n  <trackList>\n' + tr + '\n  </trackList>\n</playlist>\n';
  };
  /* ---------- Export: CSV (Excel, Google Tabellen) ---------- */
  PL.toCSV = function(l){
    var rows = [['Nr', 'Titel', 'Künstler', 'Album', 'Länge', 'Art', 'Adresse / Datei']];
    l.items.forEach(function(x, i){ rows.push([i + 1, x.title, x.kind === 'track' ? (x.artist || '') : '', x.album || '', x.kind === 'radio' ? 'LIVE' : (x.duration ? u.fmt(x.duration) : ''), KIND_DE[x.kind] || '', loc(x)]); });
    /* Semikolon + BOM: so öffnet Excel mit deutschen Einstellungen Umlaute und Spalten richtig */
    return '﻿' + rows.map(function(r){ return r.map(csvCell).join(';'); }).join('\r\n') + '\r\n';
  };
  /* ---------- Export: TXT ---------- */
  PL.toTXT = function(l){
    var out = [l.name, ''];
    l.items.forEach(function(x, i){
      var extra = x.kind === 'radio' ? ' (Radio: ' + loc(x) + ')' : x.kind === 'yt' ? ' (YouTube: ' + loc(x) + ')' : (x.duration ? ' (' + u.fmt(x.duration) + ')' : '');
      out.push((i + 1) + '. ' + fullTitle(x) + extra);
    });
    out.push('', '– exportiert aus G04Musik');
    return out.join('\r\n') + '\r\n';
  };

  PL.FORMATS = {
    json: { ext: '.g04musik.json', mime: 'application/json' },
    m3u:  { ext: '.m3u',  mime: 'audio/x-mpegurl' },
    m3u8: { ext: '.m3u8', mime: 'application/vnd.apple.mpegurl' },
    pls:  { ext: '.pls',  mime: 'audio/x-scpls' },
    xspf: { ext: '.xspf', mime: 'application/xspf+xml' },
    csv:  { ext: '.csv',  mime: 'text/csv' },
    txt:  { ext: '.txt',  mime: 'text/plain' }
  };
  /* what: 'all' (Favoriten + alle Listen) oder eine Liste/Favoriten; kind: siehe FORMATS */
  PL.exportFile = function(what, kind){
    if (what === 'all') return u.saveFile('G04Musik-Sicherung.g04musik.json', PL.toJSON(PL.all, true), 'application/json');
    var isFav = what === PL.FAV_ID || String(what).indexOf('fav:') === 0;
    var l = isFav ? PL.favList(what === PL.FAV_ID ? '' : what.slice(4)) : PL.get(what); if (!l) return Promise.resolve(false);
    var f = PL.FORMATS[kind] || PL.FORMATS.json, text;
    if (kind === 'm3u') text = PL.toM3U(l);
    else if (kind === 'm3u8') text = PL.toM3U(l, true);
    else if (kind === 'pls') text = PL.toPLS(l);
    else if (kind === 'xspf') text = PL.toXSPF(l);
    else if (kind === 'csv') text = PL.toCSV(l);
    else if (kind === 'txt') text = PL.toTXT(l);
    else text = isFav ? PL.toJSON([], l.items) : PL.toJSON([l]);
    return u.saveFile(fileSafe(l.name) + f.ext, text, f.mime);
  };

  /* ---------- Import ---------- */
  /* Aus Adresse + Titel einen Eintrag machen (YouTube, Sender oder eigener Song) */
  function entry(where, title, artist){
    where = String(where || '').trim(); title = (title || '').trim();
    if (where.indexOf('file://') === 0) { try { where = decodeURI(where.replace(/^file:\/+/, '')); } catch (e) {} }
    var yt = G.yt.parse(where);
    if (yt && /youtu/.test(where)) return G.yt.toItem(yt, { title: title || undefined });
    if (/^https?:\/\//i.test(where)) return { kind: 'radio', id: 'url:' + where, title: title || where.replace(/^https?:\/\//, '').split('/')[0], sub: 'Eigener Sender', url: where, hls: /\.m3u8(\?|$)/i.test(where), art: '' };
    var file = where.split(/[\\/]/).pop();
    var nm = G.tags.fromName(file || title), t = title, a = artist || '';
    if (t && !a) { var m = t.split(/\s+[-–—]\s+/); if (m.length >= 2) { a = m[0]; t = m.slice(1).join(' - '); } }
    return { kind: 'track', id: 'file:' + (file || t), fileName: file || '', size: 0, title: t || nm.title, artist: a || nm.artist || '', sub: '' };
  }
  function parseM3U(text, fallbackName){
    var name = fallbackName, items = [], title = '';
    text.split(/\r?\n/).forEach(function(raw){
      var line = raw.trim(); if (!line) return;
      if (/^#PLAYLIST:/i.test(line)) { name = line.slice(10).trim() || name; return; }
      if (/^#EXTINF:/i.test(line)) { title = line.replace(/^#EXTINF:[^,]*,/i, '').trim(); return; }
      if (line[0] === '#') return;
      items.push(entry(line, title)); title = '';
    });
    return [{ name: name, items: items }];
  }
  function parsePLS(text, fallbackName){
    var f = {}, t = {};
    text.split(/\r?\n/).forEach(function(raw){
      var m = raw.trim().match(/^(File|Title)(\d+)\s*=\s*(.*)$/i); if (!m) return;
      (m[1].toLowerCase() === 'file' ? f : t)[+m[2]] = m[3];
    });
    var items = Object.keys(f).map(Number).sort(function(a, b){ return a - b; }).map(function(n){ return entry(f[n], t[n]); });
    return [{ name: fallbackName, items: items }];
  }
  function parseXSPF(text, fallbackName){
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Die XSPF-Datei ist beschädigt.');
    var get = function(el, tag){ var x = el.getElementsByTagName(tag)[0]; return x ? x.textContent.trim() : ''; };
    var pl = doc.getElementsByTagName('playlist')[0] || doc.documentElement;
    var name = ''; for (var i = 0; i < pl.children.length; i++) if (pl.children[i].localName === 'title') name = pl.children[i].textContent.trim();
    var items = Array.prototype.map.call(doc.getElementsByTagName('track'), function(tr){
      var it = entry(get(tr, 'location'), get(tr, 'title'), get(tr, 'creator') === 'Radio' || get(tr, 'creator') === 'YouTube' ? '' : get(tr, 'creator'));
      if (it.kind === 'track') { it.album = get(tr, 'album'); var d = +get(tr, 'duration'); if (d) it.duration = d / 1000; }
      return it;
    });
    return [{ name: name || fallbackName, items: items }];
  }
  function splitCSV(line, sep){
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === sep) { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur); return out;
  }
  function parseCSV(text, fallbackName){
    var lines = text.split(/\r?\n/).filter(function(l){ return l.trim(); }); if (!lines.length) return [{ name: fallbackName, items: [] }];
    var sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
    var head = splitCSV(lines[0], sep).map(function(h){ return h.trim().toLowerCase(); });
    var col = function(){ for (var i = 0; i < arguments.length; i++) { var k = head.indexOf(arguments[i]); if (k >= 0) return k; } return -1; };
    var cT = col('titel', 'title'), cA = col('künstler', 'artist', 'interpret'), cL = col('adresse / datei', 'adresse', 'datei', 'url', 'location', 'file');
    if (cT < 0 && cL < 0) throw new Error('In der CSV-Datei fehlt eine Spalte „Titel“ oder „Adresse“.');
    var items = lines.slice(1).map(function(l){ var r = splitCSV(l, sep); return entry(cL >= 0 ? r[cL] : '', cT >= 0 ? r[cT] : '', cA >= 0 ? r[cA] : ''); })
      .filter(function(x){ return x.title || x.url || x.ytId; });
    return [{ name: fallbackName, items: items }];
  }
  function parseTXT(text, fallbackName){
    var lines = text.split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
    var name = fallbackName;
    if (lines.length && !/^\d+[.)]\s/.test(lines[0])) name = lines.shift();
    var items = lines.filter(function(l){ return /^\d+[.)]\s/.test(l) || /^https?:\/\//i.test(l); }).map(function(l){
      l = l.replace(/^\d+[.)]\s*/, '');
      var yt = l.match(/\(YouTube:\s*([^)]+)\)\s*$/); if (yt) return entry(yt[1], l.replace(yt[0], ''));
      var rd = l.match(/\(Radio:\s*([^)]+)\)\s*$/); if (rd) return entry(rd[1], l.replace(rd[0], ''));
      if (/\(Radio\)\s*$/.test(l)) return null;   /* Sender ohne Adresse lassen sich nicht wiederherstellen */
      if (/^https?:\/\//i.test(l)) return entry(l, '');
      return entry('', l.replace(/\s*\(\d+:\d{2}(:\d{2})?\)\s*$/, ''));
    }).filter(Boolean);
    return [{ name: name, items: items }];
  }
  /* Liefert {lists, tracks, missing} */
  PL.importText = function(text, fileName){
    var ext = (String(fileName || '').match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
    var base = String(fileName || 'Importiert').replace(/\.(g04musik\.)?(json|m3u8?|pls|xspf|csv|txt)$/i, '');
    var lists, favIn = null;
    var trimmed = text.replace(/^﻿/, '').trim();
    if (trimmed[0] === '{') {
      var j = JSON.parse(trimmed);
      if (j.format !== 'g04musik-playlist' || (!Array.isArray(j.lists) && !Array.isArray(j.favorites))) throw new Error('Das ist keine G04Musik-Listendatei.');
      lists = j.lists || [];
      favIn = j.favorites || null;
    }
    else if (ext === 'xspf' || /^<\?xml|<playlist[\s>]/i.test(trimmed)) lists = parseXSPF(trimmed, base);
    else if (ext === 'pls' || /^\[playlist\]/i.test(trimmed)) lists = parsePLS(trimmed, base);
    else if (ext === 'csv') lists = parseCSV(trimmed, base);
    else if (ext === 'm3u' || ext === 'm3u8' || /^#EXTM3U|^#EXTINF/im.test(trimmed)) lists = parseM3U(trimmed, base);
    else if (ext === 'txt') lists = parseTXT(trimmed, base);
    else if (/^https?:\/\//im.test(trimmed) || /\.(mp3|m4a|flac|wav|ogg|mp4)\s*$/im.test(trimmed)) lists = parseM3U(trimmed, base);
    else throw new Error('Unbekanntes Format. Erwartet: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV oder TXT.');
    if (!lists.some(function(l){ return l.items && l.items.length; }) && !favIn) throw new Error('In der Datei wurden keine Einträge gefunden.');

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
