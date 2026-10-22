/* ============================================================
   G04Musik — Ansichten: Start, Meine Musik, Radio, YouTube, Einstellungen
   sowie Bühne, Bedienfeld und Mini-Player
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store, ic = u.ic, esc = u.esc;
  var V = G.views = {};

  /* Listen, aus denen gerade Kacheln gezeichnet sind: Klick spielt
     den Eintrag und nimmt die ganze Liste als Warteschlange. */
  var lists = {};
  function reg(name,arr){ lists[name]=arr; return arr; }
  V.lookup = function(l,i){ var a=lists[l]; return a? {item:a[+i],list:a} : null; };

  V.NAV = [
    {id:'start', n:'Start', i:'home'},
    {id:'music', n:'Meine Musik', short:'Musik', i:'music'},
    {id:'radio', n:'Radio', i:'radio'},
    {id:'yt',    n:'YouTube', i:'yt'},
    {id:'settings', n:'Einstellungen', short:'Mehr', i:'gear'}
  ];
  var TITLES = {
    start:['Start','Deine Musik, Radio und Videos an einem Ort'],
    music:['Meine Musik','Eigene Songs und Musikvideos auf diesem Gerät'],
    radio:['Radio','Sender aus aller Welt, live'],
    yt:['YouTube','Videos und Playlisten, die du dir merkst'],
    settings:['Einstellungen','Wiedergabe, Bibliothek, Über']
  };
  var HERO_VIEWS = {start:1,music:1,radio:1,yt:1};

  /* Status je Ansicht */
  var ui = { listOpen:null, ytQuery:'', ytResults:null, ytBusy:false, ytErr:'', musicTab:u.ls.get('musicTab','songs'), musicQuery:'', album:null, radioTag:'', radioQuery:'', radioItems:null, radioBusy:false, radioErr:'', radioKey:'' };

  /* ---------- Einträge auflösen ---------- */
  function resolve(arr){
    return arr.map(function(it){ return it.kind==='track' ? G.library.get(it.id) : it; }).filter(Boolean);
  }

  /* ---------- Bausteine ---------- */
  function isCur(it){ return G.player.cur && S.key(G.player.cur)===S.key(it); }
  function eq(){ return '<span class="eq'+(G.player.playing?'':' is-paused')+'"><i></i><i></i><i></i></span>'; }
  function artBox(it,cls){
    var logo = it.kind==='radio' && it.art;
    return '<div class="art '+(cls||'')+(logo?' art--logo':'')+'" style="'+u.artStyle(it)+'">'+u.artText(it)+'%BADGE%</div>';
  }
  function tile(it,l,i){
    var wide = it.kind==='yt' || it.isVideo;
    var badge = it.kind==='radio' ? '<span class="pill pill--live">LIVE</span>'
              : it.kind==='yt' ? '<span class="pill pill--yt">YouTube</span>'
              : it.isVideo ? '<span class="pill">Video</span>' : '';
    if(wide && (it.kind==='track'||it.kind==='yt') && it.duration) badge+='<span class="dur num">'+u.fmt(it.duration)+'</span>';
    var on=isCur(it);
    return '<button class="tile'+(on?' is-playing':'')+'" type="button" data-l="'+l+'" data-i="'+i+'" title="'+esc(it.title)+'">'+
      artBox(it,wide?'art--wide':'').replace('%BADGE%',badge)+
      '<span class="tile__fav'+(S.isFav(it)?' is-on':'')+'" role="button" tabindex="0" data-favbtn="1" title="'+(S.isFav(it)?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-label="'+(S.isFav(it)?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-pressed="'+S.isFav(it)+'">'+ic(S.isFav(it)?'starF':'star',17,2.1)+'</span>'+
      '<div class="tile__t">'+(on?eq():'')+esc(it.title)+'</div>'+
      '<div class="tile__s">'+esc(it.sub||'')+(it.kind==='track'&&!it.isVideo&&it.duration?' · '+u.fmt(it.duration):'')+'</div></button>';
  }
  function lay(){ return S.settings.layout==='list' ? 'list' : 'grid'; }
  function grid(arr,l,wide){
    reg(l,arr);
    if(lay()==='list') return '<div class="list">'+arr.map(function(it,i){ return lrow(it,l,i); }).join('')+'</div>';
    return '<div class="grid'+(wide?' grid--wide':'')+'">'+arr.map(function(it,i){ return tile(it,l,i); }).join('')+'</div>';
  }
  /* Eine Zeile der Listenansicht – für Songs, Videos, Sender und YouTube gleich */
  function lrow(it,l,i){
    var on=isCur(it), fav=S.isFav(it);
    var tag = it.kind==='radio' ? '<span class="pill pill--live">LIVE</span>'
            : it.kind==='yt' ? '<span class="pill pill--yt">YouTube</span>'
            : it.isVideo ? '<span class="row__x">Video</span>' : '';
    var dur = (it.kind==='track'||it.kind==='yt')&&it.duration ? u.fmt(it.duration) : '';
    return '<button class="row lrow'+(on?' is-playing':'')+'" type="button" data-l="'+l+'" data-i="'+i+'" title="'+esc(it.title)+'">'+
      artBox(it,(it.kind==='yt'||it.isVideo)?'art--wide':'').replace('%BADGE%','')+
      '<span class="row__t"><b>'+(on?eq():'')+esc(it.title)+'</b><span>'+esc(it.sub||'')+'</span></span>'+
      '<span class="lrow__end">'+tag+(dur?'<span class="row__d num">'+dur+'</span>':'')+'</span>'+
      '<span class="tile__fav row__fav'+(fav?' is-on':'')+'" role="button" tabindex="0" data-favbtn="1" aria-label="'+(fav?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-pressed="'+fav+'">'+ic(fav?'starF':'star',16,2.1)+'</span></button>';
  }
  /* Umschalter Kacheln / Liste */
  /* Kacheln/Liste: ein Knopf in der Kopfzeile */
  function layoutToggle(){ return ''; }
  V.renderLayBtn = function(){
    var btn=u.$('#layBtn'); if(!btn) return;
    var g=lay()==='grid', label=g?'Als Liste anzeigen':'Als Kacheln anzeigen';
    btn.dataset.layout=g?'list':'grid'; btn.title=label; btn.setAttribute('aria-label',label);
    btn.innerHTML=ic(g?'rows':'tiles',18);
    btn.hidden = S.view==='settings';
  };
  function rows(arr,l){
    reg(l,arr);
    return '<div class="list">'+arr.map(function(t,i){
      var on=isCur(t);
      return '<button class="row'+(on?' is-playing':'')+'" type="button" data-l="'+l+'" data-i="'+i+'">'+
        '<span class="row__n num">'+(on?eq():(t.track||i+1))+'</span>'+
        artBox(t,'').replace('%BADGE%','')+
        '<span class="row__t"><b>'+(S.isFav(t)?'<span style="color:var(--gold)">★</span> ':'')+esc(t.title)+'</b><span>'+esc(t.artist||'Unbekannt')+(t.album?' · '+esc(t.album):'')+'</span></span>'+
        '<span class="row__x">'+esc(t.album||(t.isVideo?'Video':'Single'))+'</span>'+
        '<span class="row__d num">'+(t.duration?u.fmt(t.duration):'')+'</span></button>';
    }).join('')+'</div>';
  }
  function empty(icon,title,text,btns){
    return '<div class="empty"><span class="empty__ic">'+ic(icon,26)+'</span><b>'+title+'</b><p>'+text+'</p>'+(btns?'<div class="btn-row" style="justify-content:center">'+btns+'</div>':'')+'</div>';
  }
  var BTN_FILES='<button class="btn btn--solid" type="button" data-act="pickFiles">'+ic('plus',17)+'Dateien hinzufügen</button>';
  var BTN_FOLDER='<button class="btn" type="button" data-act="pickFolder">'+ic('folder',17)+'Ordner</button>';
  function canFolder(){ var i=document.createElement('input'); return 'webkitdirectory' in i && !G.player.IOS && !/Android/.test(navigator.userAgent); }
  function importBar(){
    var im=G.library.importing; if(!im) return '';
    return '<div class="panel glass" style="display:flex;flex-direction:column;gap:8px"><div class="sec-h"><h3>Wird eingelesen …</h3><span class="num">'+im.done+' von '+im.total+'</span></div><div class="prog-line"><i style="width:'+(im.done/im.total*100)+'%"></i></div></div>';
  }

  /* ============================================================
     START
     ============================================================ */
  function viewStart(){
    var L=G.library, favs=resolve(S.favs), hist=resolve(S.history);
    /* jeder Reiter mit eigener Farbe (R,G,B) */
    var TABS=[['favs','Favoriten','star',favs.length,'255,200,87'],['songs','Songs','music',L.songs().length,'255,95,162'],['videos','Videos','video',L.videos().length,'167,139,250'],['radio','Radio','radio','','45,212,191'],['yt','YouTube','yt',S.yt.length,'255,64,64'],['history','Verlauf','clock',hist.length,'96,165,250']];
    var t=S.tab, body='';
    if(t==='favs') body = favs.length? grid(favs,'favs') : empty('star','Noch keine Favoriten','Tippe auf den Stern ☆ auf einem Song, Sender oder Video.');
    else if(t==='songs') body = L.songs().length? grid(L.songs(),'songs') : empty('music','Noch keine eigenen Songs','Füge MP3-, M4A-, FLAC- oder WAV-Dateien hinzu. Sie bleiben nur auf diesem Gerät.',BTN_FILES+(canFolder()?BTN_FOLDER:''));
    else if(t==='videos') body = L.videos().length? grid(L.videos(),'videos',true) : empty('video','Noch keine Musikvideos','MP4, WebM, MOV und M4V gehen in jedem modernen Browser. MKV klappt meist in Chrome und Edge.',BTN_FILES);
    else if(t==='radio') body = radioBody(true);
    else if(t==='yt') body = S.yt.length? grid(resolve(S.yt),'ytS',true) : empty('yt','Noch keine YouTube-Links','Kopiere einen Link zu einem Video oder einer Playlist und füge ihn im Bereich YouTube ein.','<button class="btn btn--solid" type="button" data-go="yt">'+ic('plus',17)+'Link einfügen</button>');
    else body = hist.length? grid(hist,'hist') : empty('clock','Noch nichts gehört','Hier erscheint, was zuletzt lief.');
    return importBar()+'<section class="panel glass" style="display:flex;flex-direction:column;gap:14px"><div class="tabs-row"><div class="tabs" id="startTabs" data-keep-scroll role="tablist">'+
      TABS.map(function(x){ return '<button class="tab tab--c'+(t===x[0]?' is-active':'')+'" style="--c:'+x[4]+'" type="button" role="tab" aria-selected="'+(t===x[0])+'" data-tab="'+x[0]+'">'+ic(x[2],16)+x[1]+(x[3]!==''?' <em class="num">'+x[3]+'</em>':'')+'</button>'; }).join('')+
      '</div>'+layoutToggle()+'</div>'+body+'</section>';
  }

  /* ============================================================
     MEINE MUSIK
     ============================================================ */
  function viewMusic(){
    var L=G.library;
    if(!L.ready) return '<section class="panel glass">'+empty('music','Bibliothek wird geladen …','')+'</section>';
    var head='<section class="panel glass filters">'+
      '<div class="filterbar"><label class="field field--sm">'+ic('search',17)+'<input id="musicSearch" type="search" placeholder="Suchen" value="'+esc(ui.musicQuery)+'" autocomplete="off"></label>'+
      '<button class="btn btn--solid btn--icon" type="button" data-act="pickFiles" title="Dateien hinzufügen" aria-label="Dateien hinzufügen">'+ic('plus',18)+'<span>Dateien</span></button>'+
      (canFolder()?'<button class="btn btn--icon" type="button" data-act="pickFolder" title="Ordner hinzufügen" aria-label="Ordner hinzufügen">'+ic('folder',18)+'<span>Ordner</span></button>':'')+layoutToggle()+'</div>'+
      '<div class="chips chips--sm" id="musicChips" data-keep-scroll>'+[['songs','Songs',L.songs().length],['albums','Alben',L.albums().length],['videos','Videos',L.videos().length],['lists','Listen',G.lists.all.length+1]].map(function(x){
        return '<button class="chip'+(ui.musicTab===x[0]&&!ui.album?' is-active':'')+'" type="button" data-mtab="'+x[0]+'">'+x[1]+' <span class="num" style="opacity:.6">'+x[2]+'</span></button>'; }).join('')+'</div></section>';
    if(ui.musicTab==='lists') return importBar()+head+viewLists();
    if(!L.tracks.length) return importBar()+head+'<section class="panel glass">'+empty('music','Deine Bibliothek ist leer','Wähle Musik- oder Videodateien von diesem Gerät. Titel, Künstler, Album und Cover werden automatisch gelesen.',BTN_FILES)+'</section>';

    var q=ui.musicQuery.trim().toLowerCase();
    var match=function(t){ return !q || (t.title+' '+(t.artist||'')+' '+(t.album||'')).toLowerCase().indexOf(q)>=0; };
    var body='';
    if(ui.album){
      var al=L.albums().filter(function(a){ return a.key===ui.album; })[0];
      if(!al){ ui.album=null; return viewMusic(); }
      var dur=al.tracks.reduce(function(a,t){return a+(t.duration||0);},0);
      body='<section class="panel glass" style="display:flex;flex-direction:column;gap:14px">'+
        '<div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap"><div class="art" style="width:120px;font-size:34px;'+u.artStyle({title:al.title,art:al.art})+'">'+(al.art?'':esc(u.initials(al.title)))+'</div>'+
        '<div style="min-width:0;flex:1"><small style="color:var(--acc);font-weight:700;letter-spacing:.08em;font-size:11.5px">ALBUM</small><h2 style="font-size:24px">'+esc(al.title)+'</h2><p style="color:var(--tx-1)">'+esc(al.artist)+' · '+al.tracks.length+' Titel · '+Math.round(dur/60)+' min</p></div>'+
        '<div class="btn-row"><button class="btn btn--ghost" type="button" data-act="albumBack">Alle Alben</button><button class="btn btn--solid" type="button" data-l="album" data-i="0">'+ic('play',16)+'Abspielen</button></div></div>'+
        rows(al.tracks,'album')+'</section>';
    } else if(ui.musicTab==='albums'){
      var albums=L.albums().filter(function(a){ return !q || (a.title+' '+a.artist).toLowerCase().indexOf(q)>=0; });
      body='<section class="panel glass"><div class="grid">'+albums.map(function(a){
        return '<button class="tile" type="button" data-album="'+esc(a.key)+'"><div class="art" style="'+u.artStyle({title:a.title,art:a.art})+'">'+(a.art?'':esc(u.initials(a.title)))+'</div><div class="tile__t">'+esc(a.title)+'</div><div class="tile__s">'+esc(a.artist)+' · '+a.tracks.length+' Titel</div></button>'; }).join('')+'</div></section>';
    } else if(ui.musicTab==='videos'){
      var vids=L.videos().filter(match);
      body='<section class="panel glass">'+(vids.length? grid(vids,'mvideos',true) : empty('video',q?'Kein Treffer':'Noch keine Musikvideos', q?'Versuch es mit einem anderen Wort.':'Füge MP4-, WebM-, MOV- oder MKV-Dateien hinzu.', q?'':BTN_FILES))+'</section>';
    } else {
      var songs=L.songs().filter(match), tot=songs.reduce(function(a,t){return a+(t.duration||0);},0);
      body='<section class="panel glass" style="display:flex;flex-direction:column;gap:10px"><div class="sec-h"><h3>Songs</h3><span class="num">'+songs.length+' Titel · '+Math.round(tot/60)+' min</span></div>'+
        (songs.length? (lay()==='list'? rows(songs,'msongs') : grid(songs,'msongs')) : empty('music',q?'Kein Treffer':'Noch keine Songs',q?'Versuch es mit einem anderen Wort.':'Füge Musikdateien hinzu.'))+'</section>';
    }
    return importBar()+head+body;
  }

  /* ============================================================
     LISTEN (eigene Playlisten + Favoriten)
     ============================================================ */
  function listArt(l){
    if(l.id===G.lists.FAV_ID) return '<div class="art art--list" style="background:linear-gradient(140deg,#FFD978,#E0A21A 60%,#7A4A00)">'+ic('starF',40)+'</div>';
    var a=G.lists.art(l);
    return '<div class="art art--list" style="'+(a?'background-image:url(&quot;'+esc(a)+'&quot;)':'background-image:'+u.grad(l.name))+'">'+(a?'':ic('lists',38))+'</div>';
  }
  function viewLists(){
    var PL=G.lists;
    if(ui.listOpen){
      var l = ui.listOpen===PL.FAV_ID ? PL.favList() : PL.get(ui.listOpen);
      if(!l){ ui.listOpen=null; return viewLists(); }
      var fav=l.id===PL.FAV_ID, items=fav? resolve(S.favs) : PL.resolve(l), miss=fav?0:PL.missing(l);
      var dur=items.reduce(function(a,t){ return a+(t.duration||0); },0);
      var btn=function(act,icon,label,cls){ return '<button class="qbtn qbtn--sm'+(cls||'')+'" type="button" data-act="'+act+'" title="'+label+'" aria-label="'+label+'">'+ic(icon,20)+'</button>'; };
      return '<section class="panel glass" style="display:flex;flex-direction:column;gap:14px">'+
        '<div class="pl-head">'+listArt(l)+
          '<div class="pl-head__t"><small>'+(fav?'FAVORITEN':'LISTE')+'</small><h2>'+esc(l.name)+'</h2><p>'+items.length+' Einträge'+(dur?' · '+Math.round(dur/60)+' min':'')+(miss?' · <span style="color:var(--warn,#FFB020)">'+miss+' Songs fehlen auf diesem Gerät</span>':'')+'</p></div></div>'+
        '<div class="pl-actions">'+
          btn('plBack','chev','Alle Listen',' qbtn--back')+
          (items.length? btn('plPlay','play','Abspielen',' qbtn--main')+btn('plShuffle','shuffle','Gemischt abspielen') : '')+
          btn('plExport','upload','Exportieren')+
          (fav?'':btn('plRename','edit','Umbenennen')+btn('plDelete','trash','Liste löschen',' qbtn--danger'))+
        '</div>'+
        (items.length? '<div class="list">'+reg('pl',items).map(function(it,i){ return lrow(it,'pl',i); }).join('')+'</div>'
          : empty(fav?'star':'listAdd','Noch leer', fav?'Tippe auf den Stern bei einem Song, Sender oder Video.':'Lang drücken auf einen Song, Sender oder ein Video und „Zu Liste hinzufügen“ wählen – oder beim Abspielen auf das Listen-Symbol tippen.'))+
        (items.length?'<p style="color:var(--tx-2);font-size:12.5px;padding:0 4px">Lang drücken auf einen Eintrag: verschieben oder aus der Liste entfernen.</p>':'')+
        '</section>';
    }
    var all=[PL.favList()].concat(PL.all);
    return '<section class="panel glass" style="display:flex;flex-direction:column;gap:14px">'+
      '<div class="sec-h" style="align-items:center"><h3>Deine Listen</h3><div class="pl-actions">'+
        '<button class="qbtn qbtn--sm qbtn--main" type="button" data-act="plNew" title="Neue Liste" aria-label="Neue Liste">'+ic('plus',20)+'</button>'+
        '<button class="qbtn qbtn--sm" type="button" data-act="plImport" title="Liste importieren" aria-label="Liste importieren">'+ic('download',20)+'</button>'+
        '<button class="qbtn qbtn--sm" type="button" data-act="plExportAll" title="Alles exportieren (Favoriten und alle Listen)" aria-label="Alles exportieren">'+ic('upload',20)+'</button>'+
      '</div></div>'+
      '<div class="grid">'+all.map(function(l){
        var n = l.id===PL.FAV_ID ? resolve(S.favs).length : l.items.length;
        return '<button class="tile" type="button" data-plopen="'+esc(l.id)+'">'+listArt(l)+'<div class="tile__t">'+esc(l.name)+'</div><div class="tile__s">'+n+' Einträge</div></button>';
      }).join('')+'</div>'+
      '<p style="color:var(--tx-2);font-size:12.5px;padding:0 4px">Import: G04Musik-Dateien (.json) und M3U-Listen. Eigene Songs werden über den Dateinamen in deiner Bibliothek wiedergefunden.</p>'+
      '</section>';
  }

  /* ============================================================
     RADIO
     ============================================================ */
  function radioKey(){ return S.radioCountry+'|'+ui.radioTag+'|'+ui.radioQuery.trim(); }
  function loadRadio(){
    var key=radioKey(); if(ui.radioKey===key&&(ui.radioItems||ui.radioBusy)) return;
    ui.radioKey=key; ui.radioBusy=true; ui.radioErr='';
    var q=ui.radioQuery.trim();
    var pr = q ? G.radio.search(q,S.radioCountry) : G.radio.top(S.radioCountry,ui.radioTag);
    pr.then(function(items){ if(ui.radioKey!==key) return; ui.radioItems=items; ui.radioBusy=false; V.refresh(); })
      .catch(function(){ if(ui.radioKey!==key) return; ui.radioItems=[]; ui.radioBusy=false; ui.radioErr='Die Senderliste ließ sich nicht laden. Bist du online?'; V.refresh(); });
  }
  function radioBody(compact){
    loadRadio();
    var favR=S.favs.filter(function(f){ return f.kind==='radio'; });
    var h='';
    if(compact && favR.length) h+='<div class="sec-h"><h3>Deine Sender</h3></div>'+grid(favR,'rfavS');
    if(compact) h+='<div class="sec-h"><h3>Beliebt in '+esc((G.radio.COUNTRIES.filter(function(c){return c[0]===S.radioCountry;})[0]||['','Weltweit'])[1])+'</h3><a href="#radio" data-go="radio" style="font-size:13px">Alle Sender '+'›</a></div>';
    if(ui.radioBusy && !ui.radioItems) h+='<div class="empty"><div class="stage__ring"></div><p>Sender werden geladen …</p></div>';
    else if(ui.radioErr) h+=empty('radio','Keine Verbindung',ui.radioErr,'<button class="btn" type="button" data-act="radioRetry">Noch einmal</button>');
    else if(ui.radioItems && !ui.radioItems.length) h+=empty('search','Keine Sender gefunden','Versuch einen anderen Namen oder ein anderes Land.');
    else if(ui.radioItems) h+=grid(compact?ui.radioItems.slice(0,18):ui.radioItems, compact?'radioS':'radio');
    return h;
  }
  function viewRadio(){
    var favR=S.favs.filter(function(f){ return f.kind==='radio'; });
    return '<section class="panel glass filters">'+
      '<div class="filterbar"><label class="field field--sm">'+ic('search',17)+'<input id="radioSearch" type="search" placeholder="Sender suchen" value="'+esc(ui.radioQuery)+'" autocomplete="off"></label>'+
      '<label class="select" title="Land">'+ic('globe',16)+'<select id="radioCountry" aria-label="Land">'+G.radio.COUNTRIES.map(function(c){ return '<option value="'+c[0]+'"'+(S.radioCountry===c[0]?' selected':'')+'>'+(c[0]||'Welt')+'</option>'; }).join('')+'</select></label>'+layoutToggle()+'</div>'+
      (ui.radioQuery.trim()?'':'<div class="chips chips--sm" id="genreChips" data-keep-scroll>'+G.radio.GENRES.map(function(g){ return '<button class="chip'+(ui.radioTag===g[0]?' is-active':'')+'" type="button" data-rtag="'+g[0]+'">'+g[1]+'</button>'; }).join('')+'</div>')+
      '</section>'+
      (favR.length?'<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>Deine Sender</h3><span>'+favR.length+'</span></div>'+grid(favR,'rfav')+'</section>':'')+
      '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>'+(ui.radioQuery.trim()?'Suchergebnis':'Sender')+'</h3><span>über radio-browser.info</span></div>'+radioBody(false)+'</section>';
  }

  /* ============================================================
     YOUTUBE
     ============================================================ */
  function viewYT(){
    var items=resolve(S.yt), q=ui.ytQuery||'';
    var res='';
    if(ui.ytBusy) res='<div class="empty"><div class="stage__ring"></div><p>Suche auf YouTube …</p></div>';
    else if(ui.ytErr) res=empty('search','Suche gerade nicht möglich',ui.ytErr,'<a class="btn btn--solid" href="'+esc(G.yt.resultsUrl(q))+'" target="_blank" rel="noopener">'+ic('yt',17)+'Auf YouTube suchen</a>');
    else if(ui.ytResults&&!ui.ytResults.length) res=empty('search','Nichts gefunden','Versuch es mit anderen Wörtern.');
    else if(ui.ytResults) res=grid(ui.ytResults,'ytres',true);
    return '<section class="panel glass filters">'+
      '<form class="filterbar" id="ytForm"><label class="field field--sm">'+ic('search',17)+'<input id="ytInput" type="search" enterkeyhint="search" placeholder="YouTube durchsuchen oder Link einfügen" value="'+esc(q)+'" autocomplete="off"></label>'+
      '<button class="btn btn--solid btn--icon" type="submit" title="Suchen" aria-label="Suchen">'+ic('search',18)+'</button></form>'+
      '</section>'+
      (ui.ytResults||ui.ytBusy||ui.ytErr ?
        '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>Ergebnisse für „'+esc(q)+'“</h3>'+
        '<span><a href="'+esc(G.yt.resultsUrl(q))+'" target="_blank" rel="noopener">auf YouTube öffnen ›</a> · <a href="#yt" data-act="ytClear">schließen</a></span></div>'+res+'</section>' : '')+
      '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>Gemerkt</h3><span>'+items.length+'</span></div>'+
      (items.length? grid(items,'yt',true) : empty('yt','Noch nichts gemerkt','Suche oben nach einem Video oder füge einen Link ein. Mit dem Stern merkst du dir Treffer als Favorit, mit langem Drücken in dieser Liste.'))+'</section>';
  }

  /* ============================================================
     EINSTELLUNGEN
     ============================================================ */
  function viewSettings(){
    var st=S.settings, L=G.library;
    var sw=function(k){ return '<button class="switch" type="button" role="switch" aria-checked="'+(st[k]?'true':'false')+'" data-sw="'+k+'" aria-label="Umschalten"></button>'; };
    var row=function(b,s,right,act){ return (act?'<button class="set__row" type="button" data-act="'+act+'">':'<div class="set__row">')+'<div><b>'+b+'</b><span>'+s+'</span></div>'+right+(act?'</button>':'</div>'); };
    var group=function(t,r){ return '<section class="panel glass"><div class="sec-h" style="margin-bottom:4px"><h3>'+t+'</h3></div><div class="set">'+r.join('')+'</div></section>'; };
    var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return group('Wiedergabe',[
        row('Visualizer','Spektrum auf der Bühne'+(G.player.IOS?' (auf iPhone/iPad nachgebildet)':''),sw('viz')),
        row('Bildschirm bleibt an','Solange ein Video läuft',sw('keepAwake')),
        row('Einschlaf-Timer','15 bis 90 Minuten, am Ende wird es leiser','<span class="set__val">'+(G.player.sleepAt?'noch '+G.player.sleepLeft()+' min':'aus')+'</span>','sleep'),
        row('Wiederholen','Aus, alle oder einen Titel','<span class="set__val">'+({off:'aus',all:'alle',one:'ein Titel'})[st.repeat]+'</span>','repeat'),
        row('Zufall','Reihenfolge mischen',sw('shuffle'))
      ])+
      group('YouTube',[
        row('Eigener Suchschlüssel','Optional: macht die Suche zuverlässiger (YouTube Data API v3). Bleibt nur auf diesem Gerät.','<span class="set__val">'+(u.ls.get('ytKey','')?'gespeichert':'keiner')+'</span>','ytKey')
      ])+
      group('Bibliothek',[
        row('Eigene Titel',L.songs().length+' Songs · '+L.videos().length+' Musikvideos','<span class="set__val num" id="storeUse">'+u.bytes(L.totalSize())+'</span>'),
        row('Dateien hinzufügen','Musik und Musikvideos von diesem Gerät','<span class="set__val">'+ic('chev',16)+'</span>','pickFiles'),
        row('Bibliothek leeren','Entfernt alle eigenen Titel von diesem Gerät','<span class="set__val" style="color:var(--live)">'+ic('trash',16)+'</span>','clearLib'),
        row('Alles zurücksetzen','Favoriten, Verlauf, YouTube-Liste, Einstellungen','<span class="set__val" style="color:var(--live)">'+ic('trash',16)+'</span>','resetAll')
      ])+
      group('Über',[
        standalone?'':row('Als App installieren','Auf dem Startbildschirm, ohne Adressleiste','<span class="set__val">'+ic('chev',16)+'</span>','install'),
        row('Version','G04Musik v'+G.VERSION,'<span class="set__val">© PaulFV</span>'),
        row('App-Icon','So erscheint es auf dem Home-Bildschirm','<img src="'+((document.querySelector('link[rel=apple-touch-icon]')||{}).href||'img/icon-180.png')+'" alt="App-Icon" width="52" height="52" style="border-radius:12px;flex:none">'),
        row('Datenschutz','Kein Konto, kein Tracking. Deine Dateien bleiben auf dem Gerät. Für Radio und YouTube werden nur deren Server abgefragt.','')
      ]);
  }

  var VIEWS={start:viewStart,music:viewMusic,radio:viewRadio,yt:viewYT,settings:viewSettings};

  /* ============================================================
     Zeichnen
     ============================================================ */
  V.renderNav = function(){
    var badge={music:G.library.tracks.length||'',yt:S.yt.length||''};
    u.$('#nav').innerHTML=V.NAV.map(function(n){
      return '<button class="nav__item'+(S.view===n.id?' is-active':'')+'" type="button" data-go="'+n.id+'" title="'+n.n+'">'+ic(n.i,20)+'<span>'+(window.innerWidth<1200&&window.innerWidth>=768?(n.short||n.n):n.n)+'</span>'+(badge[n.id]?'<span class="nav__badge num">'+badge[n.id]+'</span>':'')+'</button>';
    }).join('');
    u.$('#tabbar').innerHTML=V.NAV.map(function(n){
      return '<button class="'+(S.view===n.id?'is-active':'')+'" type="button" data-go="'+n.id+'">'+ic(n.i,21)+'<span>'+(n.short||n.n)+'</span></button>';
    }).join('');
  };

  V.render = function(){
    var t=TITLES[S.view]; u.$('#viewTitle').textContent=t[0]; u.$('#viewSub').textContent=t[1];
    var hasHero=!!HERO_VIEWS[S.view] && (S.view==='start' || window.innerWidth>=768);
    u.$('#hero').hidden=!hasHero; u.$('#content').classList.toggle('no-hero',!hasHero);
    u.$('#viewHost').innerHTML=VIEWS[S.view]();
    V.renderNav(); V.renderLayBtn();
  };
  /* Neu zeichnen, ohne dass ein Suchfeld den Fokus verliert */
  V.refresh = function(){
    var a=document.activeElement, id=a&&a.id, pos=a&&a.selectionStart;
    var y=window.scrollY, keep={};
    u.$$('[data-keep-scroll]').forEach(function(el){ if(el.id) keep[el.id]=el.scrollLeft; });
    V.render();
    Object.keys(keep).forEach(function(k){ var el=document.getElementById(k); if(el) el.scrollLeft=keep[k]; });
    V.revealActive();
    if(id){ var el=document.getElementById(id); if(el&&el.tagName==='INPUT'){ el.focus({preventScroll:true}); try{ el.setSelectionRange(pos,pos); }catch(e){} } }
    window.scrollTo(0,y);
  };

  /* Gewählten Reiter/Chip in seiner Leiste sichtbar halten, ohne die Seite zu bewegen */
  V.revealActive = function(){
    u.$$('[data-keep-scroll]').forEach(function(bar){
      var a=bar.querySelector('.is-active'); if(!a) return;
      var l=a.offsetLeft-bar.offsetLeft, r=l+a.offsetWidth, pad=12;
      if(l-pad<bar.scrollLeft) bar.scrollLeft=Math.max(0,l-pad);
      else if(r+pad>bar.scrollLeft+bar.clientWidth) bar.scrollLeft=r+pad-bar.clientWidth;
    });
  };

  /* ---------- Bühne ---------- */
  var KIND={track:'Meine Musik',radio:'Radio',yt:'YouTube'};
  V.renderStage = function(){
    var P=G.player, c=P.cur, st=u.$('#stage');
    u.$('#stageIdle').hidden=!!c;
    var isYT=c&&c.kind==='yt', isVid=c&&c.kind==='track'&&c.isVideo&&!u.$('#media').hidden;
    st.classList.toggle('has-video',!!isVid);
    u.$('#stageCover').hidden=!c||isYT;
    u.$('#stagePip').hidden=!(isVid&&document.pictureInPictureEnabled);
    u.$('#stageTools').hidden=!c||(!isVid&&!isYT);
    u.$('#stageBusy').hidden=!(c&&P.loading&&!isYT&&!P.error);
    u.$('#stageErr').hidden=!P.error; u.$('#stageErrText').textContent=P.error||'';
    u.$('#stageBg').style.backgroundImage = c&&c.art&&c.kind!=='radio' ? 'url("'+c.art+'")' : (c? u.grad(c.title) : 'none');
    u.$('#stageBg').style.opacity = c? '.5':'0';
    u.$('#stageBadges').innerHTML = !c? '' : c.kind==='radio'? '<span class="pill pill--live">LIVE</span>' : isYT? '' : c.isVideo? '<span class="pill">Musikvideo</span>' : '<span class="pill">'+esc(c.year?'Eigener Song · '+c.year:'Eigener Song')+'</span>';
    if(c&&!isYT){
      var art=u.$('#stageArt'); art.className='cover'+(c.kind==='radio'&&c.art?' art--logo':'');
      art.setAttribute('style',u.artStyle(c).replace(/&quot;/g,'"')); art.textContent=c.art?'':u.initials(c.title);
      u.$('#stageKind').textContent=c.isVideo?'Musikvideo':KIND[c.kind];
      u.$('#stageTitle').textContent=c.title; u.$('#stageSub').textContent=c.sub||'';
    }
  };

  /* ---------- Bedienfeld ---------- */
  V.renderNP = function(){
    var P=G.player, c=P.cur, st=S.settings, np=u.$('#np');
    if(!c){
      np.classList.remove('is-cover');
      np.innerHTML='<div class="np__head"><span class="np__ic">'+ic('music',22)+'</span><div><small>'+greet()+'</small><b>Noch nichts gewählt</b><span>Tippe auf eine Kachel, um zu starten.</span></div></div>'+
        (G.library.tracks.length? '<div class="np-quick">'+
          '<button class="qbtn qbtn--main" type="button" data-act="playAll" title="Alle Songs gemischt abspielen" aria-label="Alle Songs gemischt abspielen">'+ic('shuffle',24)+'</button>'+
          '<button class="qbtn" type="button" data-act="playOrder" title="Alle Songs der Reihe nach abspielen" aria-label="Alle Songs der Reihe nach abspielen">'+ic('queue',24)+'</button></div>'
         : '<div class="btn-row">'+BTN_FILES+'<button class="btn btn--ghost" type="button" data-go="radio">'+ic('radio',16)+'Radio hören</button></div>');
      return;
    }
    np.classList.toggle('is-cover',c.kind!=='yt'&&!c.isVideo);
    var live=P.isLive(), d=P.duration(), t=P.time(), fav=S.isFav(c);
    var nxt = P.queue.length>1 && !(c.kind==='yt'&&c.ytType==='list') ? P.queue[(P.index+1)%P.queue.length] : null;
    var rep = st.repeat==='one'?'repeat1':'repeat';
    np.innerHTML=
      '<div class="np__head"><span class="np__ic">'+ic(c.kind==='radio'?'radio':c.kind==='yt'?'yt':c.isVideo?'video':'music',22)+'</span><div><small>'+(P.error?'Fehler':P.loading?'Lädt …':P.playing?'Jetzt läuft':'Angehalten')+'</small><b>'+esc(c.title)+'</b><span>'+esc(c.sub||'')+'</span></div></div>'+
      '<div class="seek"><span class="num js-time" style="min-width:38px">'+(live?'LIVE':u.fmt(t))+'</span><div class="seek__bar js-seek'+(live?' is-live':'')+'" role="slider" aria-label="Position" tabindex="0"><i class="js-bar" style="width:'+(d?Math.min(100,t/d*100):0)+'%"></i></div><span class="num js-dur" style="min-width:38px;text-align:right">'+(live?'':u.fmt(d))+'</span></div>'+
      '<div class="ctl ctl--main"><button class="icon-btn'+(st.shuffle?' is-on':'')+'" type="button" data-act="shuffle" title="Zufall" aria-label="Zufall" aria-pressed="'+st.shuffle+'">'+ic('shuffle',18)+'</button>'+
      '<button class="icon-btn" type="button" data-act="prev" title="Zurück" aria-label="Zurück">'+ic('prev',18)+'</button>'+
      '<button class="play-btn" type="button" data-act="toggle" aria-label="'+(P.playing?'Pause':'Abspielen')+'">'+ic(P.playing?'pause':'play',26)+'</button>'+
      '<button class="icon-btn" type="button" data-act="next" title="Weiter" aria-label="Weiter">'+ic('next',18)+'</button>'+
      '<button class="icon-btn'+(st.repeat!=='off'?' is-on':'')+'" type="button" data-act="repeat" title="Wiederholen: '+({off:'aus',all:'alle',one:'ein Titel'})[st.repeat]+'" aria-label="Wiederholen">'+ic(rep,18)+'</button></div>'+
      '<div class="ctl"><button class="icon-btn'+(fav?' is-on':'')+'" type="button" data-act="fav" title="Favorit" aria-label="Favorit" aria-pressed="'+fav+'">'+ic(fav?'starF':'star',18)+'</button>'+
      '<button class="icon-btn" type="button" data-act="toList" title="Zu Liste hinzufügen" aria-label="Zu Liste hinzufügen">'+ic('listAdd',18)+'</button>'+
      '<button class="icon-btn'+(P.sleepAt?' is-on':'')+'" type="button" data-act="sleep" title="Einschlaf-Timer" aria-label="Einschlaf-Timer">'+ic('moon',18)+'</button>'+(P.sleepAt?'<span class="sleep-tag num">'+P.sleepLeft()+' min</span>':'')+
      '<label class="vol" title="Lautstärke">'+ic(st.volume>0?'vol':'mute',18)+'<input id="volRange" type="range" min="0" max="100" step="1" value="'+Math.round(st.volume*100)+'" aria-label="Lautstärke"></label>'+
      '<button class="icon-btn" type="button" data-act="stop" title="Beenden" aria-label="Beenden"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
      (nxt?'<div class="np__next">Danach: <b>'+esc(nxt.title)+'</b></div>':'');
  };
  function greet(){ var h=new Date().getHours(); return h<5?'Gute Nacht':h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend'; }

  /* ---------- Mini-Player und Leisten ---------- */
  V.dockWanted = false;
  V.renderDock = function(){
    var P=G.player, c=P.cur, d=u.$('#pdock');
    var show = !!c && V.dockWanted;
    d.hidden=!show; document.body.classList.toggle('has-dock',show);
    if(show){
      var dur=P.duration(), t=P.time();
      d.innerHTML='<div class="cover'+(c.kind==='radio'&&c.art?' art--logo':'')+'" style="'+u.artStyle(c)+'">'+u.artText(c)+'</div>'+
        '<button class="pdock__meta" type="button" data-act="toStage"><b>'+esc(c.title)+'</b><span>'+(P.error?'Fehler – antippen':esc(c.sub||''))+'</span></button>'+
        '<button class="icon-btn" type="button" data-act="next" aria-label="Weiter">'+ic('next',16)+'</button>'+
        '<button class="play-btn" type="button" data-act="toggle" aria-label="'+(P.playing?'Pause':'Abspielen')+'">'+ic(P.playing?'pause':'play',19)+'</button>'+
        (P.isLive()?'':'<span class="pdock__prog"><i class="js-bar" style="width:'+(dur?t/dur*100:0)+'%"></i></span>');
    }
    /* Kopfzeile und Seitenleiste */
    var lc=u.$('#liveChip'); lc.classList.toggle('is-on',!!(c&&P.playing));
    lc.querySelector('span').textContent = c? c.title : 'Nichts läuft';
    var sn=u.$('#sideNow');
    sn.className='now-chip'+(c&&P.playing?' is-live':'');
    sn.innerHTML='<span class="now-chip__ic" style="'+(c&&c.art?'background-image:url(&quot;'+esc(c.art)+'&quot;)':'')+'">'+(c&&c.art?'':ic(c?(c.kind==='radio'?'radio':c.kind==='yt'?'yt':'music'):'music',17))+'</span><span class="now-chip__meta"><b>'+(c?esc(c.title):'Nichts läuft')+'</b><span>'+(c?(P.playing?'spielt':'angehalten'):'bereit')+'</span></span>';
  };

  /* Laufende Zeit ohne alles neu zu zeichnen */
  V.tick = function(){
    var P=G.player; if(!P.cur||P.isLive()) return;
    var d=P.duration(), t=P.time(), w=(d?Math.min(100,t/d*100):0)+'%';
    if(V.seeking) return;
    u.$$('.js-bar').forEach(function(b){ b.style.width=w; });
    u.$$('.js-time').forEach(function(b){ b.textContent=u.fmt(t); });
    u.$$('.js-dur').forEach(function(b){ b.textContent=u.fmt(d); });
  };

  /* ---------- Visualizer ---------- */
  var cv=u.$('#viz'), cx=cv.getContext('2d'), bars=new Float32Array(56), buf=null;
  function sizeViz(){ var r=cv.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1); if(r.width){ cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr); } }
  window.addEventListener('resize',sizeViz);
  if('ResizeObserver' in window) new ResizeObserver(sizeViz).observe(cv);
  function frame(t){
    requestAnimationFrame(frame);
    var P=G.player;
    if(document.hidden||u.$('#hero').hidden||u.$('#stage').classList.contains('has-video')) return;
    var w=cv.width,h=cv.height; if(!w) return;
    cx.clearRect(0,0,w,h);
    var n=bars.length, on=P.playing&&P.cur&&P.cur.kind!=='yt'&&S.settings.viz, real=on&&P.realViz();
    if(real){ if(!buf) buf=new Uint8Array(P.analyser.frequencyBinCount); P.analyser.getByteFrequencyData(buf); }
    var acc=getComputedStyle(document.documentElement).getPropertyValue('--acc-rgb').trim()||'255,59,78';
    var bw=w/n;
    for(var i=0;i<n;i++){
      var target;
      if(real){ var k=Math.floor(Math.pow(i/n,1.6)*buf.length*.85); target=buf[k]/255; }
      else if(on){ target=(0.16+0.5*Math.abs(Math.sin(t/430+i*.55)*Math.cos(t/910+i*.23))+0.22*Math.random()*(i<n*.35?1:.55))*(1-i/n*.4); }
      else target=0.025+0.015*Math.sin(t/900+i*.4);
      bars[i]+=(target-bars[i])*(real?.5:.16);
      var bh=Math.max(2,bars[i]*h*.6), x=i*bw+bw*.2;
      var g=cx.createLinearGradient(0,h,0,h-bh);
      g.addColorStop(0,'rgba('+acc+',.04)'); g.addColorStop(1,'rgba('+acc+','+(on?.8:.22)+')');
      cx.fillStyle=g; cx.fillRect(x,h-bh,bw*.6,bh);
    }
  }
  requestAnimationFrame(frame);

  /* ---------- Rückgabe für app.js ---------- */
  V.ui = ui;
  V.loadRadio = loadRadio;
  V.HERO_VIEWS = HERO_VIEWS;
  V.hasHero = function(){ return !u.$('#hero').hidden; };
})();
