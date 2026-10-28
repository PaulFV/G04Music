/* ============================================================
   G04Musik — Ansichten: Musik, Radio, YouTube, Einstellungen
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
    {id:'music', n:'Musik', i:'music'},
    {id:'radio', n:'Radio', i:'radio'},
    {id:'yt',    n:'YouTube', i:'yt'},
    {id:'settings', n:'Einstellungen', short:'Mehr', i:'gear'}
  ];
  var TITLES = {
    music:['Musik','Eigene Songs, Alben, Videos und Listen'],
    radio:['Radio','Sender aus aller Welt, live'],
    yt:['YouTube','Suchen, merken, abspielen'],
    settings:['Einstellungen','Wiedergabe, Bibliothek, Über']
  };
  var HERO_VIEWS = {music:1,radio:1,yt:1};

  /* Farben der Reiter (R,G,B) */
  var C = { pink:'255,95,162', orange:'255,159,67', violet:'167,139,250', blue:'96,165,250', gold:'255,200,87', teal:'45,212,191', red:'255,64,64' };

  /* Status je Bereich */
  var ui = { listOpen:null, ytQuery:'', ytResults:null, ytBusy:false, ytErr:'',
    musicTab:u.ls.get('musicTab','songs'), radioTab:u.ls.get('radioTab','stations'), ytTab:u.ls.get('ytTab','search'),
    musicQuery:'', album:null, radioTag:'', radioQuery:'', radioItems:null, radioBusy:false, radioErr:'', radioKey:'' };
  if(ui.musicTab==='favs'||ui.musicTab==='lists'||ui.musicTab==='songs'||ui.musicTab==='albums'||ui.musicTab==='videos'){} else ui.musicTab='songs';

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
  /* „⋯“: öffnet dasselbe Menü wie langes Drücken oder Rechtsklick (app.js: itemMenu) */
  function moreBtn(cls,size){
    return '<span class="'+cls+'" role="button" tabindex="0" data-morebtn="1" title="Mehr" aria-label="Mehr">'+ic('more',size)+'</span>';
  }
  function tile(it,l,i){
    var wide = it.kind==='yt' || it.isVideo;
    var badge = it.kind==='radio' ? '<span class="pill pill--live">LIVE</span>'
              : it.kind==='yt' ? '<span class="pill pill--yt">YouTube</span>'
              : it.isVideo ? '<span class="pill">Video</span>' : '';

    var on=isCur(it);
    return '<button class="tile'+(on?' is-playing':'')+'" type="button" data-l="'+l+'" data-i="'+i+'" title="'+esc(it.title)+'">'+
      artBox(it,wide?'art--wide':'').replace('%BADGE%',badge)+
      '<span class="tile__fav'+(S.isFav(it)?' is-on':'')+'" role="button" tabindex="0" data-favbtn="1" title="'+(S.isFav(it)?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-label="'+(S.isFav(it)?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-pressed="'+S.isFav(it)+'">'+ic(S.isFav(it)?'starF':'star',17,2.1)+'</span>'+
      moreBtn('tile__more',17)+
      '<div class="tile__t">'+(on?eq():'')+esc(it.title)+'</div>'+
      '<div class="tile__s">'+esc(it.sub||'')+((it.kind==='track'||it.kind==='yt')&&it.duration?'<span class="tile__d"> · '+u.fmt(it.duration)+'</span>':'')+'</div></button>';
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
      '<span class="lrow__end">'+tag+(dur?'<span class="row__d num">'+dur+'</span>':'')+moreBtn('row__more',18)+'</span>'+
      '<span class="tile__fav row__fav'+(fav?' is-on':'')+'" role="button" tabindex="0" data-favbtn="1" aria-label="'+(fav?'Aus Favoriten entfernen':'Zu Favoriten')+'" aria-pressed="'+fav+'">'+ic(fav?'starF':'star',16,2.1)+'</span></button>';
  }
  /* Umschalter Kacheln / Liste */
  /* Kacheln/Liste: ein Knopf in der Kopfzeile */
  function layoutToggle(){ return ''; }
  V.renderTopBtns = function(){
    var lb=u.$('#langBtn'); if(lb) lb.textContent = G.lang==='en' ? 'EN' : 'DE';
    var tb=u.$('#themeBtn'); if(tb){ var light=document.documentElement.getAttribute('data-theme')==='light';
      tb.innerHTML=ic(light?'moon':'sun',18); var l=light?'Dunklen Modus aktivieren':'Hellen Modus aktivieren'; tb.title=l; tb.setAttribute('aria-label',l); }
  };
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
      return '<button class="row'+(on?' is-playing':'')+'" type="button" data-l="'+l+'" data-i="'+i+'" data-n="'+(t.track||i+1)+'">'+
        '<span class="row__n num">'+(on?eq():(t.track||i+1))+'</span>'+
        artBox(t,'').replace('%BADGE%','')+
        '<span class="row__t"><b>'+(S.isFav(t)?'<span style="color:var(--gold)">★</span> ':'')+esc(t.title)+'</b><span>'+esc(t.artist||'Unbekannt')+(t.album?' · '+esc(t.album):'')+'</span></span>'+
        '<span class="row__x">'+esc(t.album||(t.isVideo?'Video':'Single'))+'</span>'+
        '<span class="row__d row__end"><span class="num">'+(t.duration?u.fmt(t.duration):'')+'</span>'+moreBtn('row__more',18)+'</span></button>';
    }).join('')+'</div>';
  }
  function empty(icon,title,text,btns){
    return '<div class="empty"><span class="empty__ic">'+ic(icon,26)+'</span><b>'+title+'</b><p>'+text+'</p>'+(btns?'<div class="btn-row" style="justify-content:center">'+btns+'</div>':'')+'</div>';
  }
  var BTN_FILES='<button class="btn btn--solid" type="button" data-act="pickFiles">'+ic('plus',17)+'Dateien hinzufügen</button>';
  var BTN_DS='<button class="btn" type="button" data-act="dsServer">'+ic('nas',17)+'DS-Server</button>';
  var BTN_FOLDER='<button class="btn" type="button" data-act="pickFolder">'+ic('folder',17)+'Ordner</button>';
  function canFolder(){ var i=document.createElement('input'); return 'webkitdirectory' in i && !G.player.IOS && !/Android/.test(navigator.userAgent); }
  function importBar(){
    var im=G.library.importing; if(!im) return '';
    return '<div class="panel glass" style="display:flex;flex-direction:column;gap:8px"><div class="sec-h"><h3>Wird eingelesen …</h3><span class="num" id="impNum">'+im.done+' von '+im.total+'</span></div><div class="prog-line"><i id="impFill" style="width:'+(im.done/im.total*100)+'%"></i></div></div>';
  }
  /* Während des Einlesens nur den Balken bewegen, nicht die ganze Ansicht neu zeichnen */
  var importTimer=0;
  V.importTick = function(){
    var im=G.library.importing, fill=u.$('#impFill');
    if(im&&fill){
      fill.style.width=(im.done/im.total*100)+'%';
      var n=u.$('#impNum'); if(n) n.textContent=im.done+' von '+im.total;
      return;
    }
    /* Kein Balken sichtbar (z. B. anderer Bereich oder erster Aufruf): höchstens alle 400 ms neu zeichnen */
    if(!importTimer) importTimer=setTimeout(function(){ importTimer=0; V.refresh(); },400);
  };

  /* Willkommen: erster Start mit leerer Bibliothek */
  function welcome(){
    var btn=function(cls,act,icon,t,s){ return '<button class="welcome__btn'+cls+'" type="button" data-act="'+act+'"><span class="welcome__ic">'+ic(icon,26)+'</span><span class="welcome__t"><b>'+t+'</b><small>'+s+'</small></span></button>'; };
    return '<section class="panel glass welcome">'+
      '<div class="welcome__h"><h2>Willkommen bei G04Musik</h2><p>Womit möchtest du anfangen?</p></div>'+
      '<div class="welcome__grid">'+
        btn(' welcome__btn--main','pickFiles','plus','Eigene Musik hinzufügen','Songs und Videos von diesem Gerät')+
        btn('','welcomeRadio','radio','Radio hören','Tausende Sender, ganz ohne Dateien')+
        btn('','welcomeYT','yt','YouTube durchsuchen','Suchen und direkt abspielen')+
      '</div>'+
      '<button class="welcome__skip" type="button" data-act="welcomeHide">Nicht mehr anzeigen</button>'+
    '</section>';
  }

  /* Reiterleiste eines Bereichs: farbig, merkt ihre Position */
  function subTabs(id,attr,cur,tabs){
    return '<div class="tabs" id="'+id+'" data-keep-scroll role="tablist">'+tabs.map(function(x){
      var on=cur===x[0];
      return '<button class="tab tab--c'+(on?' is-active':'')+'" style="--c:'+x[4]+'" type="button" role="tab" aria-selected="'+on+'" '+attr+'="'+x[0]+'">'+ic(x[2],16)+x[1]+(x[3]!==''&&x[3]!=null?' <em class="num">'+x[3]+'</em>':'')+'</button>';
    }).join('')+'</div>';
  }
  /* Favoriten nur einer Art (track | radio | yt) */
  function favsOf(kind){ return resolve(S.favs.filter(function(f){ return f.kind===kind; })); }
  function recentOf(kind){ return resolve(S.history.filter(function(f){ return f.kind===kind; })); }
  var FAV_TXT = { track:'Tippe auf den Stern ☆ bei einem Song oder Musikvideo.', radio:'Tippe auf den Stern ☆ bei einem Sender.', yt:'Tippe auf den Stern ☆ bei einem Video oder Suchtreffer.' };
  function favSection(kind,l){
    var items=favsOf(kind), wide=kind==='yt';
    return '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h" style="align-items:center"><h3>Favoriten · <span class="num">'+items.length+'</span></h3>'+
      (items.length?'<button class="qbtn qbtn--sm" type="button" data-act="favExport" data-kind="'+kind+'" title="Favoriten exportieren" aria-label="Favoriten exportieren">'+ic('upload',20)+'</button>':'')+'</div>'+
      (items.length? grid(items,l,wide) : empty('star','Noch keine Favoriten',FAV_TXT[kind]))+'</section>';
  }
  function recentSection(kind,l){
    var items=recentOf(kind);
    return '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>Zuletzt gehört</h3><span>'+items.length+'</span></div>'+
      (items.length? grid(items,l,kind==='yt') : empty('clock','Noch nichts','Hier erscheint, was zuletzt lief.'))+'</section>';
  }

  /* ============================================================
     MUSIK: Songs · Alben · Videos · Listen · Favoriten
     ============================================================ */
  function viewMusic(){
    var L=G.library, t=ui.musicTab;
    if(!L.ready) return '<section class="panel glass">'+empty('music','Bibliothek wird geladen …','')+'</section>';
    var tabs=subTabs('musicTabs','data-mtab',ui.album?'albums':t,[
      ['songs','Songs','music',L.songs().length,C.pink],['albums','Alben','album',L.albums().length,C.orange],
      ['videos','Videos','video',L.videos().length,C.violet],['lists','Listen','lists',G.lists.all.length,C.blue],
      ['favs','Favoriten','star',favsOf('track').length,C.gold]]);
    var search = (t==='songs'||t==='albums'||t==='videos') && !ui.album;
    var head='<section class="panel glass filters">'+tabs+
      (search?'<div class="filterbar"><label class="field field--sm">'+ic('search',17)+'<input id="musicSearch" type="search" placeholder="Suchen" value="'+esc(ui.musicQuery)+'" autocomplete="off"></label>'+
      '<button class="btn btn--solid btn--icon" type="button" data-act="pickFiles" title="Dateien hinzufügen" aria-label="Dateien hinzufügen">'+ic('plus',18)+'<span>Dateien</span></button>'+
      (canFolder()?'<button class="btn btn--icon" type="button" data-act="pickFolder" title="Ordner hinzufügen" aria-label="Ordner hinzufügen">'+ic('folder',18)+'<span>Ordner</span></button>':'')+
      '<button class="btn btn--icon" type="button" data-act="dsServer" title="Vom DS-Server importieren" aria-label="Vom DS-Server importieren">'+ic('nas',18)+'<span>DS-Server</span></button></div>':'')+
      '</section>';
    if(t==='lists') return importBar()+head+viewLists();
    if(t==='favs') return importBar()+head+favSection('track','mfav');
    if(!L.tracks.length && !L.importing && !u.ls.get('welcomeDone',false)) return head+welcome();
    if(!L.tracks.length) return importBar()+head+'<section class="panel glass">'+empty('music','Deine Bibliothek ist leer','Wähle Musik- oder Videodateien von diesem Gerät oder hole sie von deiner Synology DiskStation. Titel, Künstler, Album und Cover werden automatisch gelesen.',BTN_FILES+BTN_DS)+'</section>';

    var q=ui.musicQuery.trim().toLowerCase();
    var match=function(x){ return !q || (x.title+' '+(x.artist||'')+' '+(x.album||'')).toLowerCase().indexOf(q)>=0; };
    var body='';
    if(ui.album){
      var al=L.albums().filter(function(a){ return a.key===ui.album; })[0];
      if(!al){ ui.album=null; return viewMusic(); }
      var dur=al.tracks.reduce(function(a,x){return a+(x.duration||0);},0);
      body='<section class="panel glass" style="display:flex;flex-direction:column;gap:14px">'+
        '<div class="pl-head"><div class="art" style="width:112px;font-size:34px;'+u.artStyle({title:al.title,art:al.art})+'">'+(al.art?'':esc(u.initials(al.title)))+'</div>'+
        '<div class="pl-head__t"><small>ALBUM</small><h2>'+esc(al.title)+'</h2><p>'+esc(al.artist)+' · '+al.tracks.length+' Titel · '+Math.round(dur/60)+' min</p></div></div>'+
        '<div class="pl-actions"><button class="qbtn qbtn--sm qbtn--back" type="button" data-act="albumBack" title="Alle Alben" aria-label="Alle Alben">'+ic('chev',20)+'</button>'+
        '<button class="qbtn qbtn--sm qbtn--main" type="button" data-l="album" data-i="0" title="Abspielen" aria-label="Abspielen">'+ic('play',20)+'</button></div>'+
        rows(al.tracks,'album')+'</section>';
    } else if(t==='albums'){
      var albums=L.albums().filter(function(a){ return !q || (a.title+' '+a.artist).toLowerCase().indexOf(q)>=0; });
      body='<section class="panel glass"><div class="grid">'+albums.map(function(a){
        return '<button class="tile" type="button" data-album="'+esc(a.key)+'"><div class="art" style="'+u.artStyle({title:a.title,art:a.art})+'">'+(a.art?'':esc(u.initials(a.title)))+'</div><div class="tile__t">'+esc(a.title)+'</div><div class="tile__s">'+esc(a.artist)+' · '+a.tracks.length+' Titel</div></button>'; }).join('')+'</div></section>';
    } else if(t==='videos'){
      var vids=L.videos().filter(match);
      body='<section class="panel glass">'+(vids.length? grid(vids,'mvideos',true) : empty('video',q?'Kein Treffer':'Noch keine Musikvideos', q?'Versuch es mit einem anderen Wort.':'Füge MP4-, WebM-, MOV- oder MKV-Dateien hinzu.', q?'':BTN_FILES))+'</section>';
    } else {
      var songs=L.songs().filter(match), tot=songs.reduce(function(a,x){return a+(x.duration||0);},0);
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
          btn('plShare','share','Teilen')+
          btn('plShareLink','link','Link & QR')+
          (fav?'':btn('plRename','edit','Umbenennen')+btn('plDelete','trash','Liste löschen',' qbtn--danger'))+
        '</div>'+
        (items.length? '<div class="list">'+reg('pl',items).map(function(it,i){ return lrow(it,'pl',i); }).join('')+'</div>'
          : empty(fav?'star':'listAdd','Noch leer', fav?'Tippe auf den Stern bei einem Song, Sender oder Video.':'Lang drücken auf einen Song, Sender oder ein Video und „Zu Liste hinzufügen“ wählen – oder beim Abspielen auf das Listen-Symbol tippen.'))+
        (items.length?'<p style="color:var(--tx-2);font-size:12.5px;padding:0 4px">Lang drücken auf einen Eintrag: verschieben oder aus der Liste entfernen.</p>':'')+
        '</section>';
    }
    var all=PL.all;
    return '<section class="panel glass" style="display:flex;flex-direction:column;gap:14px">'+
      '<div class="sec-h" style="align-items:center"><h3>Deine Listen</h3><div class="pl-actions">'+
        '<button class="qbtn qbtn--sm qbtn--main" type="button" data-act="plNew" title="Neue Liste" aria-label="Neue Liste">'+ic('plus',20)+'</button>'+
        '<button class="qbtn qbtn--sm" type="button" data-act="plImport" title="Liste importieren" aria-label="Liste importieren">'+ic('download',20)+'</button>'+
        '<button class="qbtn qbtn--sm" type="button" data-act="plExportAll" title="Alles exportieren (alle Listen und Favoriten)" aria-label="Alles exportieren">'+ic('upload',20)+'</button>'+
      '</div></div>'+
      (all.length?'':empty('lists','Noch keine Listen','Lege mit + eine Liste an oder importiere eine. Songs fügst du per langem Drücken hinzu.'))+
      '<div class="grid">'+all.map(function(l){
        var n = l.id===PL.FAV_ID ? resolve(S.favs).length : l.items.length;
        return '<button class="tile" type="button" data-plopen="'+esc(l.id)+'">'+listArt(l)+'<div class="tile__t">'+esc(l.name)+'</div><div class="tile__s">'+n+' Einträge</div></button>';
      }).join('')+'</div>'+
      '<p style="color:var(--tx-2);font-size:12.5px;padding:0 4px">Import: G04Musik (.json), M3U/M3U8, PLS, XSPF, CSV und TXT. Eigene Songs werden über den Dateinamen in deiner Bibliothek wiedergefunden.</p>'+
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
  function radioBody(){
    loadRadio();
    if(ui.radioBusy && !ui.radioItems) return '<div class="empty"><div class="stage__ring"></div><p>Sender werden geladen …</p></div>';
    if(ui.radioErr) return empty('radio','Keine Verbindung',ui.radioErr,'<button class="btn" type="button" data-act="radioRetry">Noch einmal</button>');
    if(ui.radioItems && !ui.radioItems.length) return empty('search','Keine Sender gefunden','Versuch einen anderen Namen oder ein anderes Land.');
    return ui.radioItems? grid(ui.radioItems,'radio') : '';
  }
  /* RADIO: Sender · Favoriten · Zuletzt */
  function viewRadio(){
    var t=ui.radioTab;
    var tabs=subTabs('radioTabs','data-rtab',t,[['stations','Sender','radio','',C.teal],['favs','Favoriten','star',favsOf('radio').length,C.gold],['recent','Zuletzt','clock','',C.blue]]);
    if(t==='favs') return '<section class="panel glass filters">'+tabs+'</section>'+favSection('radio','rfav');
    if(t==='recent') return '<section class="panel glass filters">'+tabs+'</section>'+recentSection('radio','rrec');
    return '<section class="panel glass filters">'+tabs+
      '<div class="filterbar"><label class="field field--sm">'+ic('search',17)+'<input id="radioSearch" type="search" placeholder="Sender suchen" value="'+esc(ui.radioQuery)+'" autocomplete="off"></label>'+
      '<label class="select" title="Land">'+ic('globe',16)+'<select id="radioCountry" aria-label="Land">'+G.radio.COUNTRIES.map(function(c){ return '<option value="'+c[0]+'"'+(S.radioCountry===c[0]?' selected':'')+'>'+(c[0]||'Welt')+'</option>'; }).join('')+'</select></label></div>'+
      (ui.radioQuery.trim()?'':'<div class="chips chips--sm" id="genreChips" data-keep-scroll>'+G.radio.GENRES.map(function(g){ return '<button class="chip'+(ui.radioTag===g[0]?' is-active':'')+'" type="button" data-rtag="'+g[0]+'">'+g[1]+'</button>'; }).join('')+'</div>')+
      '</section>'+
      '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>'+(ui.radioQuery.trim()?'Suchergebnis':'Sender')+'</h3><span>über radio-browser.info</span></div>'+radioBody()+'</section>';
  }

  /* ============================================================
     YOUTUBE
     ============================================================ */
  /* YOUTUBE: Suche · Favoriten · Zuletzt */
  function viewYT(){
    if(ui.ytTab==='saved') ui.ytTab='favs';
    var t=ui.ytTab, q=ui.ytQuery||'';
    var tabs=subTabs('ytTabs','data-ytab',t,[['search','Suche','search','',C.red],['favs','Favoriten','star',favsOf('yt').length,C.gold],['recent','Zuletzt','clock','',C.blue]]);
    var form='<form class="filterbar" id="ytForm"><label class="field field--sm">'+ic('search',17)+'<input id="ytInput" type="search" enterkeyhint="search" placeholder="YouTube durchsuchen oder Link einfügen" value="'+esc(q)+'" autocomplete="off"></label>'+
      '<button class="btn btn--solid btn--icon" type="submit" title="Suchen" aria-label="Suchen">'+ic('search',18)+'</button></form>';
    if(t==='favs') return '<section class="panel glass filters">'+tabs+'</section>'+favSection('yt','yfav');
    if(t==='recent') return '<section class="panel glass filters">'+tabs+'</section>'+recentSection('yt','yrec');
    var res='';
    if(ui.ytBusy) res='<div class="empty"><div class="stage__ring"></div><p>Suche auf YouTube …</p></div>';
    else if(ui.ytErr) res=empty('search','Suche gerade nicht möglich',ui.ytErr,'<a class="btn btn--solid" href="'+esc(G.yt.resultsUrl(q))+'" target="_blank" rel="noopener">'+ic('yt',17)+'Auf YouTube suchen</a>');
    else if(ui.ytResults&&!ui.ytResults.length) res=empty('search','Nichts gefunden','Versuch es mit anderen Wörtern.');
    else if(ui.ytResults) res=grid(ui.ytResults,'ytres',true);
    return '<section class="panel glass filters">'+tabs+form+'</section>'+
      (ui.ytResults||ui.ytBusy||ui.ytErr ?
        '<section class="panel glass" style="display:flex;flex-direction:column;gap:12px"><div class="sec-h"><h3>Ergebnisse für „'+esc(q)+'“</h3>'+
        '<span><a href="'+esc(G.yt.resultsUrl(q))+'" target="_blank" rel="noopener">auf YouTube öffnen ›</a> · <a href="#yt" data-act="ytClear">schließen</a></span></div>'+res+'</section>'
        : '<section class="panel glass">'+empty('yt','YouTube durchsuchen','Gib oben einen Künstler oder Song ein. Einen kopierten YouTube-Link legt die App direkt in deine Favoriten.')+'</section>');
  }

  /* ============================================================
     EINSTELLUNGEN
     ============================================================ */
  function viewSettings(){
    var st=S.settings, L=G.library;
    var sw=function(k){ return '<button class="switch" type="button" role="switch" aria-checked="'+(st[k]?'true':'false')+'" data-sw="'+k+'" aria-label="Umschalten"></button>'; };
    var row=function(b,s,right,act){ return (act?'<button class="set__row" type="button" data-act="'+act+'">':'<div class="set__row">')+'<div><b>'+b+'</b><span>'+s+'</span></div>'+right+(act?'</button>':'</div>'); };
    var group=function(t,r){ return '<section class="panel glass"><div class="sec-h" style="margin-bottom:4px"><h3>'+t+'</h3></div><div class="set">'+r.join('')+'</div></section>'; };
    /* aufklappbare Gruppe; ob offen, wird je Gruppe gemerkt */
    var fold=function(id,t,r){ var open=u.ls.get('fold.'+id,false);
      return '<details class="panel glass fold" data-fold="'+id+'"'+(open?' open':'')+'><summary class="fold__head"><h3>'+t+'</h3><span class="fold__chev">'+ic('down',16)+'</span></summary><div class="set">'+r.join('')+'</div></details>'; };
    var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    /* Als App installieren – wie in G04TV */
    var plat=function(os,name,how,cur){ return '<div class="inst-platform'+(cur?' is-cur':'')+'"><span class="inst-platform__os">'+os+'</span><b>'+name+'</b><span>'+how+'</span></div>'; };
    var ios=G.player.IOS, android=/Android/i.test(navigator.userAgent), desk=!ios&&!android;
    var iconSrc=(document.querySelector('link[rel=apple-touch-icon]')||{}).href||'img/icon-180.png';
    var instOpen=u.ls.get('instOpen',false);
    var installCard='<details class="panel glass inst-card fold" id="instFold"'+(instOpen?' open':'')+'>'+
      '<summary class="fold__head"><h3>Als App installieren</h3>'+(standalone?'<span class="inst-ok">'+ic('starF',12)+' Installiert</span>':'')+'<span class="fold__chev">'+ic('down',16)+'</span></summary>'+
      '<div class="inst">'+
        '<div class="inst__art"><img src="'+iconSrc+'" alt="G04Musik-Icon" width="72" height="72"></div>'+
        '<div class="inst__platforms">'+
          plat('●','iPhone / iPad','Safari · Teilen · Zum Home-Bildschirm',ios)+
          plat('◆','Android','Chrome · Menü ⋮ · App installieren',android)+
          plat('■','Computer','Chrome/Edge · Symbol in der Adressleiste',desk)+
        '</div>'+
        '<div class="inst__action">'+(standalone?'<p class="inst__note">Läuft als App – ohne Adressleiste, mit eigenem Icon.</p>'
          : (G.app&&G.app.canInstall()?'<button class="btn btn--solid" type="button" data-act="install">'+ic('download',16)+'Jetzt installieren</button>'
          : '<button class="btn" type="button" data-act="install">'+ic('info',16)+'So geht’s</button>'))+'</div>'+
      '</div></details>';
    var light=document.documentElement.getAttribute('data-theme')==='light';
    return group('Allgemein',[
        row('Sprache','Deutsch / English','<span class="seg2"><button type="button" class="seg2__b'+(G.lang!=='en'?' is-on':'')+'" data-setlang="de" data-noi18n>DE</button><button type="button" class="seg2__b'+(G.lang==='en'?' is-on':'')+'" data-setlang="en" data-noi18n>EN</button></span>'),
        row('Design','Hell oder dunkel','<span class="seg2"><button type="button" class="seg2__b'+(!light?' is-on':'')+'" data-settheme="dark">'+ic('moon',15)+'<span>Dunkel</span></button><button type="button" class="seg2__b'+(light?' is-on':'')+'" data-settheme="light">'+ic('sun',15)+'<span>Hell</span></button></span>')
      ])+
      group('Wiedergabe',[
        row('Klangbalken','Bewegte Balken im Abspielfenster',sw('viz')),
        row('Bildschirm bleibt an','Solange ein Video läuft',sw('keepAwake')),
        row('Einschlaf-Timer','15 bis 90 Minuten, am Ende wird es leiser','<span class="set__val">'+(G.player.sleepAt?'noch '+G.player.sleepLeft()+' min':'aus')+'</span>','sleep'),
        row('Wiederholen','Aus, alle oder einen Titel','<span class="set__val">'+({off:'aus',all:'alle',one:'ein Titel'})[st.repeat]+'</span>','repeat'),
        row('Zufall','Reihenfolge mischen',sw('shuffle')),
        row('Songinfos zu Radio','Cover, Album und Jahr über Apple (iTunes) laden',sw('songInfo'))
      ])+
      fold('lib','Bibliothek',[
        row('Eigene Titel',L.songs().length+' Songs · '+L.videos().length+' Musikvideos','<span class="set__val num" id="storeUse">'+u.bytes(L.totalSize())+'</span>'),
        row('Dateien hinzufügen','Musik und Musikvideos von diesem Gerät','<span class="set__val">'+ic('chev',16)+'</span>','pickFiles'),
        row('Vom DS-Server importieren','Synology Audio Station oder DS File','<span class="set__val">'+(G.ds.cfg().url?ic('nas',16):ic('chev',16))+'</span>','dsServer'),
        row('Bibliothek leeren','Entfernt alle eigenen Titel von diesem Gerät','<span class="set__val" style="color:var(--live)">'+ic('trash',16)+'</span>','clearLib'),
        row('Alles zurücksetzen','Favoriten, Verlauf, Einstellungen','<span class="set__val" style="color:var(--live)">'+ic('trash',16)+'</span>','resetAll')
      ])+
      fold('adv','Erweitert',[
        row('YouTube-Suchschlüssel','Nur nötig, wenn die YouTube-Suche nicht klappt','<span class="set__val">'+(u.ls.get('ytKey','')?'gespeichert':'keiner')+'</span>','ytKey'),
        row('Songtitel-Server','Zeigt bei mehr Radiosendern Künstler und Titel','<span class="set__val">'+(G.nowplaying.hasProxy()?'an':'aus')+'</span>','npProxy')
      ])+
      installCard+
      fold('fb','Feedback &amp; Ideen',['<form id="fbForm" class="fb" novalidate>'+
        '<p class="fb__intro">Fehler gefunden, eine Idee oder etwas, das dir fehlt? Schick es direkt an mich – ganz ohne Konto.</p>'+
        '<label class="fb__label" for="fbMessage">Deine Nachricht*</label>'+
        '<textarea class="fb__text" id="fbMessage" name="message" rows="4" maxlength="2000" placeholder="Was möchtest du mir mitteilen?"></textarea>'+
        '<label class="fb__label" for="fbEmail">Deine E-Mail (optional, für eine Antwort)</label>'+
        '<input class="fb__input" id="fbEmail" name="_replyto" type="email" maxlength="120" inputmode="email" autocomplete="email" placeholder="name@beispiel.de">'+
        '<input type="text" name="_honey" class="fb__honey" tabindex="-1" autocomplete="off" aria-hidden="true">'+
        '<div class="fb__row"><button type="submit" class="btn btn--solid" id="fbSend">'+ic('upload',16)+'Senden</button><span class="fb__status" id="fbStatus" aria-live="polite"></span></div>'+
        '<p class="fb__hint">Beim Senden geht dein Text über formsubmit.co als E-Mail an mich. Mitgeschickt werden außerdem die App-Version, die Sprache und dein Browser- und Gerätetyp – keine Songs, Listen oder Favoriten. Deine E-Mail-Adresse nur, wenn du sie einträgst.</p>'+
        '<p class="fb__hint">Oder als öffentliches Issue auf <a href="https://github.com/PaulFV/G04Music/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>'+
      '</form>'])+
      fold('about','Version &amp; Copyright',[
        row('Version','G04Musik v'+G.VERSION,'<span class="set__val">'+G.VERSION+'</span>'),
        row('Copyright','© '+Math.max(2026,new Date().getFullYear())+' PaulFV · Alle Rechte vorbehalten','<span class="set__val">'+ic('chev',16)+'</span>','copyright'),
                row('Datenschutz','Kein Konto, kein Tracking. Deine Musikdateien bleiben auf dem Gerät. Radio, YouTube, die Suche und Songinfos fragen dafür fremde Dienste an.','')
      ])+
      '<p class="set-foot">G04Musik · © '+Math.max(2026,new Date().getFullYear())+' PaulFV</p>';
  }

  var VIEWS={music:viewMusic,radio:viewRadio,yt:viewYT,settings:viewSettings};

  /* ============================================================
     Zeichnen
     ============================================================ */
  V.renderNav = function(){
    var badge={music:G.library.tracks.length||''};
    u.$('#nav').innerHTML=V.NAV.map(function(n){
      return '<button class="nav__item'+(S.view===n.id?' is-active':'')+'" type="button" data-go="'+n.id+'" title="'+n.n+'">'+ic(n.i,20)+'<span>'+(window.innerWidth<1200&&window.innerWidth>=768?(n.short||n.n):n.n)+'</span>'+(badge[n.id]?'<span class="nav__badge num">'+badge[n.id]+'</span>':'')+'</button>';
    }).join('');
    u.$('#tabbar').innerHTML=V.NAV.map(function(n){
      return '<button class="'+(S.view===n.id?'is-active':'')+'" type="button" data-go="'+n.id+'">'+ic(n.i,21)+'<span>'+(n.short||n.n)+'</span></button>';
    }).join('');
  };

  V.render = function(){
    var t=TITLES[S.view]; u.$('#viewTitle').textContent=t[0]; u.$('#viewSub').textContent=t[1];
    var hasHero=!!HERO_VIEWS[S.view];
    u.$('#hero').hidden=!hasHero; u.$('#content').classList.toggle('no-hero',!hasHero);
    u.$('#viewHost').innerHTML=VIEWS[S.view]();
    u.$('#viewHost').classList.toggle('set-view',S.view==='settings');
    V.renderNav(); V.renderLayBtn(); V.renderTopBtns();
    if(!G.player.cur) V.renderNP();
    V.updateLand();
  };

  /* Handy quer: Läuft etwas und ist ein Abspielfenster zu sehen, füllt es den ganzen Bildschirm */
  var landMQ = window.matchMedia('(max-width:1023px) and (orientation:landscape) and (max-height:520px)');
  V.updateLand = function(){
    if(!G.player.cur) ui.landMin=false;   /* nach dem Beenden startet das nächste Lied wieder groß */
    document.body.classList.toggle('land-full', landMQ.matches && !!G.player.cur && V.hasHero() && !ui.landMin);
  };
  if(landMQ.addEventListener) landMQ.addEventListener('change',function(){ V.updateLand(); }); else if(landMQ.addListener) landMQ.addListener(function(){ V.updateLand(); });
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

  /* „Läuft gerade“ umschalten, ohne alle Kacheln neu zu zeichnen (wichtig bei großen Bibliotheken).
     Nur die Einträge, bei denen sich etwas ändert, werden angefasst. */
  V.markPlaying = function(){
    u.$$('#viewHost [data-l][data-i]').forEach(function(el){
      var r=V.lookup(el.dataset.l,el.dataset.i), on=!!(r&&r.item&&isCur(r.item));
      if(on===el.classList.contains('is-playing')) return;
      el.classList.toggle('is-playing',on);
      var num=el.querySelector('.row__n');
      if(num){ if(on) num.innerHTML=eq(); else num.textContent=el.dataset.n||''; return; }
      var host=el.querySelector('.tile__t, .row__t b'); if(!host) return;
      var old=host.querySelector('.eq'); if(old) old.remove();
      if(on) host.insertAdjacentHTML('afterbegin',eq());
    });
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

  /* ---------- Was angezeigt wird: bei Radio mit bekanntem Titel das Lied, sonst der Sender ---------- */
  V.shown = function(c){
    var m = c && c.kind==='radio' && G.nowplaying.meta;
    if(m && m.title) return { song:true, m:m, title:m.title, artist:m.artist||'', sub:(m.artist?m.artist+' · ':'')+c.title, art:(m.info&&m.info.cover)||'' };
    return { song:false, m:null, title:c?c.title:'', artist:'', sub:c?(c.sub||''):'', art:'' };
  };
  function coverStyle(url){ return 'background-image:url(&quot;'+esc(url)+'&quot;)'; }

  /* Infos zum Sender und, wenn bekannt, zum Lied (Bedienfeld am Rechner und Blatt „Songinfos“) */
  V.radioInfo = function(c){
    var N=G.nowplaying, sh=V.shown(c), m=sh.m, inf=m&&m.info, h='', line=function(k,v){ return v? '<div><b>'+k+'</b> '+esc(v)+'</div>' : ''; };
    if(sh.song){
      h+=line('Titel',m.title)+line('Künstler',m.artist);
      if(inf){ h+=line('Album',inf.album)+line('Jahr',inf.year)+line('Genre',inf.genre)+line('Länge',inf.seconds?u.fmt(inf.seconds):''); }
      else if(S.settings.songInfo===false) h+='<div>Songinfos sind in den Einstellungen aus.</div>';
    } else if(N.state==='loading') h+='<div>Songtitel wird gesucht …</div>';
    else if(N.state==='none' || N.state==='idle') h+='<div>'+(c.hls?'Dieser Sender (HLS) meldet keinen Songtitel.':'Dieser Sender meldet gerade keinen Songtitel.')+'</div>';
    var q=(c.tags||'').split(',').map(function(x){return x.trim();}).filter(Boolean).slice(0,3).join(', ');
    var qual=[c.bitrate?c.bitrate+' kbit/s':'', (c.codec||'').toUpperCase()].filter(Boolean).join(' ');
    var sender=[q, c.country, qual].filter(Boolean).join(' · ');
    h+=line('Radiosender',c.title+(sender?' · '+sender:''));
    var links='';
    if(sh.song) links+='<a class="btn btn--sm btn--ghost" href="'+esc(G.yt.resultsUrl((m.artist+' '+m.title).trim()))+'" target="_blank" rel="noopener">'+ic('yt',15)+'Auf YouTube suchen</a>';
    if(inf&&inf.url) links+='<a class="btn btn--sm btn--ghost" href="'+esc(inf.url)+'" target="_blank" rel="noopener">'+ic('music',15)+'Bei Apple Music</a>';
    if(c.homepage) links+='<a class="btn btn--sm btn--ghost" href="'+esc(c.homepage)+'" target="_blank" rel="noopener">'+ic('link',15)+'Webseite des Senders</a>';
    return h+(links?'<div class="info-links">'+links+'</div>':'');
  };

  /* ---------- Bühne ---------- */
  var KIND={track:'Meine Musik',radio:'Radio',yt:'YouTube'};
  V.renderStage = function(){
    var P=G.player, c=P.cur, st=u.$('#stage');
    u.$('#stageIdle').hidden=!!c;
    u.$('#hero').classList.toggle('is-idle',!c);
    u.$('#hero').classList.toggle('is-video',!!(c&&(c.kind==='yt'||c.isVideo)));
    st.classList.toggle('is-paused',!!(c&&c.kind!=='yt'&&!P.playing&&!P.loading&&!P.error));
    st.classList.toggle('can-tap',!!(c&&c.kind!=='yt'&&!P.error));
    var isYT=c&&c.kind==='yt', isVid=c&&c.kind==='track'&&c.isVideo&&!u.$('#media').hidden;
    st.classList.toggle('has-video',!!isVid);
    u.$('#stageCover').hidden=!c||isYT;
    u.$('#stagePip').hidden=true;
    u.$('#stageFull').hidden=!(isVid||isYT);
    u.$('#stageTools').hidden=!c;
    u.$('#stageBusy').hidden=!(c&&P.loading&&!isYT&&!P.error);
    u.$('#stageErr').hidden=!P.error; u.$('#stageErrText').textContent=P.error||'';
    var sh = c ? V.shown(c) : null;
    u.$('#stageBg').style.backgroundImage = sh&&sh.art ? 'url("'+sh.art+'")' : c&&c.art&&c.kind!=='radio' ? 'url("'+c.art+'")' : (c? u.grad(c.title) : 'none');
    u.$('#stageBg').style.opacity = c? '.5':'0';
    u.$('#stageBadges').innerHTML = !c? '' : c.kind==='radio'? '<span class="pill pill--live">LIVE</span>' : isYT? '' : c.isVideo? '<span class="pill">Musikvideo</span>' : '<span class="pill">'+esc(c.year?'Eigener Song · '+c.year:'Eigener Song')+'</span>';
    if(c&&!isYT){
      var art=u.$('#stageArt'); art.className='cover'+(c.kind==='radio'&&c.art&&!sh.art?' art--logo':'');
      art.setAttribute('style',(sh.art?coverStyle(sh.art):u.artStyle(c)).replace(/&quot;/g,'"')); art.textContent=(c.art||sh.art)?'':u.initials(c.title);
      u.$('#stageKind').textContent=sh.song?'Radio · '+c.title:c.isVideo?'Musikvideo':KIND[c.kind];
      u.$('#stageTitle').textContent=sh.title; u.$('#stageSub').textContent=sh.song?sh.artist:(c.sub||'');
    }
  };

  /* ---------- Bedienfeld ---------- */
  V.renderNP = function(){
    var P=G.player, c=P.cur, st=S.settings, np=u.$('#np');
    if(!c){
      /* Nichts läuft: gleiches Fenster wie beim Abspielen, Play startet passend zum Bereich */
      np.classList.remove('is-cover');
      var hint = S.view==='radio' ? 'Tippe auf einen Sender oder Play.' : S.view==='yt' ? 'Suche ein Video oder tippe auf einen Treffer.' : (G.library.ready && !G.library.songs().length) ? 'Füge Musik hinzu oder wechsle zu Radio.' : 'Tippe auf einen Song oder Play.';
      var canStart = S.view==='music' ? G.library.songs().length>0 : S.view==='radio' ? !!(favsOf('radio').length || (ui.radioItems&&ui.radioItems.length)) : !!(favsOf('yt').length || S.yt.length || (ui.ytResults&&ui.ytResults.length));
      var dis=' disabled';
      np.innerHTML='<div class="np__head"><span class="np__ic">'+ic(S.view==='radio'?'radio':S.view==='yt'?'yt':'music',22)+'</span><div><small>'+greet()+'</small><b>Nichts läuft</b><span>'+hint+'</span></div></div>'+
        '<div class="seek"><span class="num" style="min-width:38px">0:00</span><div class="seek__bar"><i style="width:0"></i></div><span class="num" style="min-width:38px;text-align:right">–:––</span></div>'+
        '<div class="ctl ctl--main">'+
          '<button class="icon-btn" type="button" data-act="playAll" title="Alle Songs gemischt" aria-label="Alle Songs gemischt"'+(S.view==='music'&&canStart?'':dis)+'>'+ic('shuffle',18)+'</button>'+
          '<button class="icon-btn" type="button" aria-label="Zurück"'+dis+'>'+ic('prev',18)+'</button>'+
          '<button class="play-btn" type="button" data-act="idlePlay" aria-label="Abspielen"'+(canStart?'':dis)+'>'+ic('play',26)+'</button>'+
          '<button class="icon-btn" type="button" aria-label="Weiter"'+dis+'>'+ic('next',18)+'</button>'+
          '<button class="icon-btn np-phone" type="button" aria-label="Favorit"'+dis+'>'+ic('star',18)+'</button>'+
          '<button class="icon-btn np-phone" type="button" aria-label="Mehr"'+dis+'>'+ic('more',18)+'</button>'+
          '<button class="icon-btn np-desk" type="button" aria-label="Wiederholen"'+dis+'>'+ic('repeat',18)+'</button>'+
        '</div>'+
        (S.view==='music'&&!G.library.songs().length?'<div class="btn-row np-desk">'+BTN_FILES+'</div>':'');
      return;
    }
    np.classList.toggle('is-cover',c.kind!=='yt'&&!c.isVideo);
    var live=P.isLive(), d=P.duration(), t=P.time(), fav=S.isFav(c), sh=V.shown(c);
    var nxt = P.queue.length>1 && !(c.kind==='yt'&&c.ytType==='list') ? P.queue[(P.index+1)%P.queue.length] : null;
    var rep = st.repeat==='one'?'repeat1':'repeat';
    var landLbl = ui.landMin ? 'Großes Abspielfenster' : 'Verkleinern';
    np.innerHTML=
      '<button class="icon-btn np-land" type="button" data-act="'+(ui.landMin?'landFull':'landMin')+'" title="'+landLbl+'" aria-label="'+landLbl+'">'+ic(ui.landMin?'expand':'shrink',18)+'</button>'+
      '<div class="np__head"><span class="np__ic">'+ic(c.kind==='radio'?'radio':c.kind==='yt'?'yt':c.isVideo?'video':'music',22)+'</span><div><small>'+(P.error?'Fehler':P.loading?'Lädt …':P.playing?'Jetzt läuft':'Angehalten')+'</small><b>'+esc(sh.title)+'</b><span>'+esc(sh.sub)+'</span></div></div>'+
      '<div class="seek"><span class="num js-time" style="min-width:38px">'+(live?'LIVE':u.fmt(t))+'</span><div class="seek__bar js-seek'+(live?' is-live':'')+'" role="slider" aria-label="Position" tabindex="0"><i class="js-bar" style="width:'+(d?Math.min(100,t/d*100):0)+'%"></i></div><span class="num js-dur" style="min-width:38px;text-align:right">'+(live?'':u.fmt(d))+'</span></div>'+
      '<div class="ctl ctl--main"><button class="icon-btn'+(st.shuffle?' is-on':'')+'" type="button" data-act="shuffle" title="Zufall" aria-label="Zufall" aria-pressed="'+st.shuffle+'">'+ic('shuffle',18)+'</button>'+
      '<button class="icon-btn" type="button" data-act="prev" title="Zurück" aria-label="Zurück">'+ic('prev',18)+'</button>'+
      '<button class="play-btn" type="button" data-act="toggle" aria-label="'+(P.playing?'Pause':'Abspielen')+'">'+ic(P.playing?'pause':'play',26)+'</button>'+
      '<button class="icon-btn" type="button" data-act="next" title="Weiter" aria-label="Weiter">'+ic('next',18)+'</button>'+
      '<button class="icon-btn np-desk'+(st.repeat!=='off'?' is-on':'')+'" type="button" data-act="repeat" title="Wiederholen: '+({off:'aus',all:'alle',one:'ein Titel'})[st.repeat]+'" aria-label="Wiederholen">'+ic(rep,18)+'</button>'+
      (G.pip&&G.pip.supported()?'<button class="icon-btn np-phone" type="button" data-act="pip" title="Mini-Fenster: bleibt über anderen Apps sichtbar" aria-label="Mini-Fenster">'+ic('pip',18)+'</button>':'')+
      '<button class="icon-btn np-phone np-fav'+(fav?' is-on':'')+'" type="button" data-act="fav" title="Favorit" aria-label="Favorit" aria-pressed="'+fav+'">'+ic(fav?'starF':'star',18)+'</button>'+
      '<button class="icon-btn np-phone'+(P.sleepAt||st.repeat!=='off'?' is-on':'')+'" type="button" data-act="npMore" title="Mehr" aria-label="Mehr">'+ic('more',18)+'</button></div>'+
      '<div class="ctl np-desk"><button class="icon-btn'+(fav?' is-on':'')+'" type="button" data-act="fav" title="Favorit" aria-label="Favorit" aria-pressed="'+fav+'">'+ic(fav?'starF':'star',18)+'</button>'+
      '<button class="icon-btn" type="button" data-act="toList" title="Zu Liste hinzufügen" aria-label="Zu Liste hinzufügen">'+ic('listAdd',18)+'</button>'+
      (G.pip&&G.pip.supported()?'<button class="icon-btn" type="button" data-act="pip" title="Mini-Fenster: bleibt über anderen Apps sichtbar" aria-label="Mini-Fenster">'+ic('pip',18)+'</button>':'')+
      '<button class="icon-btn'+(P.sleepAt?' is-on':'')+'" type="button" data-act="sleep" title="Einschlaf-Timer" aria-label="Einschlaf-Timer">'+ic('moon',18)+'</button>'+(P.sleepAt?'<span class="sleep-tag num">'+P.sleepLeft()+' min</span>':'')+
      '<div class="vol" title="Lautstärke"><button class="icon-btn vol__btn" type="button" data-act="mute" data-volicon="18"></button><input id="volRange" type="range" min="0" max="100" step="1" value="'+Math.round(st.volume*100)+'" aria-label="Lautstärke"></div>'+
      '<button class="icon-btn" type="button" data-act="stop" title="Beenden" aria-label="Beenden"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
      (c.kind==='radio'?'<details class="np__info np__fold np-desk" data-fold="npinfo"'+(u.ls.get('fold.npinfo',false)?' open':'')+'>'+
        '<summary><span>'+(sh.song?'Songinfos':'Senderinfos')+'</span><span class="fold__chev">'+ic('down',16)+'</span></summary>'+
        '<div class="np__infobody">'+V.radioInfo(c)+'</div></details>':'')+
      (nxt?'<div class="np__next np-desk">Danach: <b>'+esc(nxt.title)+'</b></div>':'');
    V.syncVol();
  };

  /* Ton-Knöpfe (Symbol, Beschriftung) und Regler dem aktuellen Stand anpassen */
  V.syncVol = function(){
    var P=G.player, off=P.muted||S.settings.volume===0, label=off?'Ton einschalten':'Ton ausschalten', pct=Math.round(S.settings.volume*100);
    u.$$('[data-volicon]').forEach(function(b){
      b.innerHTML=ic(off?'mute':'vol',+b.dataset.volicon||18);
      b.setAttribute('aria-label',label); b.title=label; b.classList.toggle('is-on',off);
    });
    ['volRange','volRange2'].forEach(function(id){ var r=document.getElementById(id); if(r&&document.activeElement!==r) r.value=pct; });
    var t=document.getElementById('volPct'); if(t) t.textContent=pct+' %';
  };
  function greet(){ var h=new Date().getHours(); return h<5?'Gute Nacht':h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend'; }

  /* ---------- Mini-Player und Leisten ---------- */
  V.dockWanted = false;
  V.renderDock = function(){
    var P=G.player, c=P.cur, d=u.$('#pdock');
    var show = !!c && V.dockWanted;
    d.hidden=!show; document.body.classList.toggle('has-dock',show);
    if(show){
      var dur=P.duration(), t=P.time(), sh=V.shown(c);
      d.innerHTML='<div class="cover'+(c.kind==='radio'&&c.art&&!sh.art?' art--logo':'')+'" style="'+(sh.art?coverStyle(sh.art):u.artStyle(c))+'">'+(sh.art?'':u.artText(c))+'</div>'+
        '<button class="pdock__meta" type="button" data-act="toStage"><b>'+esc(sh.title)+'</b><span>'+(P.error?'Fehler – antippen':esc(sh.sub))+'</span></button>'+
        '<button class="icon-btn" type="button" data-act="next" aria-label="Weiter">'+ic('next',16)+'</button>'+
        '<button class="play-btn" type="button" data-act="toggle" aria-label="'+(P.playing?'Pause':'Abspielen')+'">'+ic(P.playing?'pause':'play',19)+'</button>'+
        (P.isLive()?'':'<span class="pdock__prog"><i class="js-bar" style="width:'+(dur?t/dur*100:0)+'%"></i></span>');
    }
    /* Kopfzeile und Seitenleiste */
    var lc=u.$('#liveChip'); lc.classList.toggle('is-on',!!(c&&P.playing));
    lc.querySelector('span').textContent = c? V.shown(c).title : 'Nichts läuft';
    var sn=u.$('#sideNow');
    sn.className='now-chip'+(c&&P.playing?' is-live':'');
    sn.innerHTML='<span class="now-chip__ic" style="'+(c&&c.art?'background-image:url(&quot;'+esc(c.art)+'&quot;)':'')+'">'+(c&&c.art?'':ic(c?(c.kind==='radio'?'radio':c.kind==='yt'?'yt':'music'):'music',17))+'</span><span class="now-chip__meta"><b>'+(c?esc(V.shown(c).title):'Nichts läuft')+'</b><span>'+(c?(P.playing?'spielt':'angehalten'):'bereit')+'</span></span>';
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

  /* ---------- Klangbalken ----------
     Abgerundete Balken in Regenbogenfarben (wandern langsam) mit hellem Ende, weichem Schein und
     kleinen „Spitzen“, die langsam nachsinken. Füllen bis ca. 55 % der Höhe. */
  var cv=u.$('#viz'), cx=cv.getContext('2d'), bars=new Float32Array(64), peaks=new Float32Array(64), buf=null;
  function sizeViz(){ var r=cv.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1); if(r.width){ cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr); } }
  window.addEventListener('resize',sizeViz);
  if('ResizeObserver' in window) new ResizeObserver(sizeViz).observe(cv);
  function hsl(h,l,a){ return 'hsla('+h+',92%,'+l+'%,'+a+')'; }
  /* Balken, unten gerade, oben abgerundet */
  function barPath(x,y,w,h,bottom,r){
    r=Math.min(r,w/2,h);
    cx.beginPath(); cx.moveTo(x,bottom); cx.lineTo(x,y+r);
    cx.arc(x+r,y+r,r,Math.PI,1.5*Math.PI); cx.arc(x+w-r,y+r,r,1.5*Math.PI,2*Math.PI);
    cx.lineTo(x+w,bottom); cx.closePath();
  }
  /* Takt: Wir messen den Bass (40–150 Hz). Springt er über seinen Durchschnitt, ist es ein Schlag (kick):
     die tiefen Balken federn dann zusätzlich nach oben und der Schein leuchtet kurz auf. */
  var beatAvg=0, kick=0, agc=.6;
  function frame(t){
    requestAnimationFrame(frame);
    var P=G.player;
    if(document.hidden||u.$('#hero').hidden||u.$('#stage').classList.contains('has-video')) return;
    var w=cv.width,h=cv.height; if(!w) return;
    cx.clearRect(0,0,w,h);
    var dpr=w/(cv.clientWidth||w), n=Math.max(24,Math.min(64,Math.round((cv.clientWidth||w)/13)));
    var on=P.playing&&P.cur&&P.cur.kind!=='yt'&&S.settings.viz, real=on&&P.realViz();
    var hz=0, lvl=0;
    if(real){
      var bins=P.analyser.frequencyBinCount; if(!buf||buf.length!==bins) buf=new Uint8Array(bins);
      P.analyser.getByteFrequencyData(buf);
      hz=(P.analyser.context.sampleRate||44100)/2/bins;
      var b0=Math.max(1,Math.round(40/hz)), b1=Math.max(b0+1,Math.round(150/hz)), bass=0;
      for(var q=b0;q<b1;q++) bass+=buf[q];
      bass/=(b1-b0)*255;
      beatAvg+=(bass-beatAvg)*.04;
      kick = (bass>beatAvg*1.2+.05 && bass>.3) ? 1 : kick*.86;
    } else if(on){
      kick=Math.pow(Math.max(0,Math.sin(t/1000*Math.PI*4)),8);   /* nachgebildeter Schlag (ca. 120 Schläge pro Minute) */
    } else kick*=.8;
    var bw=w/n, gap=bw*.3, bwid=bw-gap, rad=Math.min(bwid/2,9*dpr), top=h*.55, vals=null;
    if(real){
      /* Balken liegen gleichmäßig auf einer Tonleiter von 40 Hz bis 14 kHz; hohe Töne sind leiser, darum angehoben */
      vals=new Float32Array(n);
      for(var j=0;j<n;j++){
        var k0=Math.max(1,Math.floor(40*Math.pow(350,j/n)/hz)), k1=Math.min(buf.length,Math.max(k0+1,Math.ceil(40*Math.pow(350,(j+1)/n)/hz)));
        var sum=0, mx=0; for(var m=k0;m<k1;m++){ sum+=buf[m]; if(buf[m]>mx) mx=buf[m]; }
        var v=((sum/(k1-k0))*.5+mx*.5)/255*(1+j/n*.9);
        vals[j]=v; if(v>lvl) lvl=v;
      }
      agc=Math.max(.45,agc*.997,lvl);   /* leise Stücke werden angehoben, laute nicht gekappt */
    }
    for(var i=0;i<n;i++){
      var target;
      if(real){ target=Math.min(1,Math.pow(vals[i]/agc,1.15)+kick*.16*(1-i/n)); }
      else if(on){ target=Math.min(1,(0.16+0.5*Math.abs(Math.sin(t/430+i*.55)*Math.cos(t/910+i*.23))+0.22*Math.random()*(i<n*.35?1:.55))*(1-i/n*.4)+kick*.18*(1-i/n)); }
      else target=0.03+0.02*Math.sin(t/900+i*.4);
      bars[i]+=(target-bars[i])*(target>bars[i]?(real?.75:.22):(real?.17:.13));
      var bh=Math.max(3*dpr,bars[i]*top), x=i*bw+gap/2, y=h-bh;
      var hue=Math.round((330+i/n*300+t/70)%360);   /* Regenbogen quer über das Fenster, wandert langsam */
      /* weicher Schein hinter dem Balken (blitzt beim Schlag auf) */
      cx.fillStyle=hsl(hue,60,(on?.14:.04)+kick*.16); barPath(x-gap*.35,y-5*dpr,bwid+gap*.7,bh+5*dpr,h,rad*1.4); cx.fill();
      /* Balken: unten blass, oben kräftig mit hellem Ende */
      var g=cx.createLinearGradient(0,h,0,y);
      g.addColorStop(0,hsl(hue,48,on?.35:.14)); g.addColorStop(.6,hsl(hue,58,on?.9:.32)); g.addColorStop(1,hsl(hue,82,on?1:.38));
      cx.fillStyle=g; barPath(x,y,bwid,bh,h,rad); cx.fill();
      /* Spitze, die langsam nach unten sinkt */
      peaks[i]=Math.max(bars[i],peaks[i]-(on?.004:.02));
      if(on&&peaks[i]>.07){
        var py=h-peaks[i]*top-8*dpr; cx.fillStyle=hsl(hue,88,.95);
        barPath(x,py,bwid,3*dpr,py+3*dpr,1.5*dpr); cx.fill();
      }
    }
  }
  requestAnimationFrame(frame);

  /* ---------- Rückgabe für app.js ---------- */
  V.ui = ui;
  V.loadRadio = loadRadio;
  V.HERO_VIEWS = HERO_VIEWS;
  V.hasHero = function(){ return !u.$('#hero').hidden; };
})();
