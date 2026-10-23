/* ============================================================
   G04Musik — Start, Navigation, Bedienung
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store, V = G.views, P = G.player;

  u.$('#brandVer').textContent = 'v'+G.VERSION;

  /* ---------- Navigation ---------- */
  function go(view,keepScroll){
    if(!V.NAV.some(function(n){ return n.id===view; })) view='music';
    S.view=view; S.save('view');
    if(location.hash.slice(1)!==view) history.replaceState(null,'','#'+view);
    V.render(); updateDock();
    if(!keepScroll) window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',function(){ var h=location.hash.slice(1); if(h&&h!==S.view) go(h); });

  /* ---------- Mini-Player: sichtbar, wenn die Bühne nicht zu sehen ist ---------- */
  var heroVisible=true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ heroVisible=es[0].isIntersecting; updateDock(); },{threshold:.12}).observe(u.$('#hero'));
  }
  function updateDock(){ V.dockWanted = u.$('#hero').hidden || !heroVisible; V.renderDock(); }

  /* ---------- Reaktion auf Änderungen ---------- */
  var lastKey=null, lastPlaying=null;
  S.on(function(what){
    if(what==='player'){
      V.renderStage(); V.renderNP(); V.renderDock();
      var k=P.cur?S.key(P.cur):null;
      if(k!==lastKey){ lastKey=k; V.refresh(); }
      else if(P.playing!==lastPlaying){ u.$$('.eq').forEach(function(e){ e.classList.toggle('is-paused',!P.playing); }); }
      lastPlaying=P.playing;
    }
    else if(what==='favs'){ V.refresh(); V.renderNP(); }
    else if(what==='lists'){ V.refresh(); }
    else if(what==='library'||what==='import'||what==='yt'){ V.refresh(); if(what==='library') V.renderNP(); }
    else if(what==='settings'){ V.renderNP(); if(S.view==='settings') V.refresh(); }
  });
  setInterval(V.tick,500);

  /* ---------- Klicks ---------- */
  /* Stern auf einer Kachel: Favorit an/aus, ohne abzuspielen */
  function favFromTile(fb){
    var tile=fb.closest('[data-l][data-i]'); if(!tile) return;
    var r=V.lookup(tile.dataset.l,tile.dataset.i); if(!r||!r.item) return;
    var on=S.toggleFav(r.item);
    u.toast(on?'„'+r.item.title+'“ zu Favoriten hinzugefügt':'Aus Favoriten entfernt');
    var nb=document.querySelector('[data-l="'+tile.dataset.l+'"][data-i="'+tile.dataset.i+'"] [data-favbtn]'); if(nb) nb.classList.add('pop');
  }
  document.addEventListener('click',function(e){
    var fb=e.target.closest('[data-favbtn]');
    if(fb){ e.preventDefault(); e.stopPropagation(); favFromTile(fb); return; }
  },true);
  document.addEventListener('keydown',function(e){
    var fb=e.target.closest&&e.target.closest('[data-favbtn]');
    if(fb&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); e.stopPropagation(); favFromTile(fb); }
  },true);

  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-go],[data-rtab],[data-ytab],[data-l],[data-act],[data-mtab],[data-album],[data-cc],[data-rtag],[data-sw],[data-layout],[data-plopen],[data-setlang],[data-settheme]');
    if(!el) return;
    var d=el.dataset;
    if(d.go){ e.preventDefault(); go(d.go); return; }
    if(d.rtab){ V.ui.radioTab=d.rtab; u.ls.set('radioTab',d.rtab); V.refresh(); return; }
    if(d.ytab){ V.ui.ytTab=d.ytab; u.ls.set('ytTab',d.ytab); V.refresh(); return; }
    if(d.l!=null&&d.i!=null){ var r=V.lookup(d.l,d.i); if(r&&r.item) P.play(r.item,r.list); return; }
    if(d.mtab){ V.ui.musicTab=d.mtab; V.ui.album=null; V.ui.listOpen=null; u.ls.set('musicTab',d.mtab); V.refresh(); return; }
    if(d.album!=null){ V.ui.album=d.album; V.render(); window.scrollTo(0,u.$('#viewHost').offsetTop-80); return; }
    if(d.cc!=null){ S.radioCountry=d.cc; S.save('radioCountry'); V.ui.radioItems=null; V.refresh(); return; }
    if(d.rtag!=null){ V.ui.radioTag=d.rtag; V.ui.radioItems=null; V.refresh(); return; }
    if(d.setlang){ G.setLang(d.setlang); V.refresh(); V.renderNP(); V.renderStage(); V.renderDock(); return; }
    if(d.settheme){ setTheme(d.settheme); return; }
    if(d.plopen){ V.ui.listOpen=d.plopen; V.ui.musicTab='lists'; V.refresh(); var vh=u.$('#viewHost'); window.scrollTo(0,Math.max(0,vh.offsetTop-80)); return; }
    if(d.layout){ if(S.settings.layout!==d.layout){ S.set('layout',d.layout); V.refresh(); } return; }
    if(d.sw){ S.set(d.sw,!S.settings[d.sw]); if(d.sw==='viz'&&S.settings.viz&&!P.IOS) u.toast('Der echte Visualizer startet mit dem nächsten Song.'); return; }
    if(d.act) act(d.act,el);
  });

  function act(a,el){
    switch(a){
      case 'pickFiles': u.$('#pickFiles').click(); break;
      case 'pickFolder': u.$('#pickFolder').click(); break;
      case 'toggle': P.toggle(); break;
      case 'next': P.next(); break;
      case 'prev': P.prev(); break;
      case 'stop': P.stop(); break;
      case 'shuffle': S.set('shuffle',!S.settings.shuffle); u.toast(S.settings.shuffle?'Zufall an':'Zufall aus'); break;
      case 'repeat': var nx={off:'all',all:'one',one:'off'}[S.settings.repeat]; S.set('repeat',nx); u.toast({off:'Wiederholen aus',all:'Alle wiederholen',one:'Diesen Titel wiederholen'}[nx]); break;
      case 'fav': if(P.cur) u.toast(S.toggleFav(P.cur)?'Zu Favoriten hinzugefügt':'Aus Favoriten entfernt'); break;
      case 'sleep': sleepSheet(); break;
      case 'toStage': if(!V.hasHero()) go(P.cur&&P.cur.kind==='radio'?'radio':P.cur&&P.cur.kind==='yt'?'yt':'music'); u.$('#hero').scrollIntoView({behavior:'smooth',block:'start'}); break;
      case 'playOrder': var so=G.library.songs(); if(so.length){ S.set('shuffle',false); P.play(so[0],so); } break;
      case 'playAll': var s=G.library.songs(); if(s.length){ S.set('shuffle',true); P.play(s[Math.floor(Math.random()*s.length)],s); } break;
      case 'albumBack': V.ui.album=null; V.ui.musicTab='albums'; V.refresh(); break;
      case 'radioRetry': V.ui.radioKey=''; V.ui.radioItems=null; V.refresh(); break;
      case 'clearLib': u.confirm('Bibliothek leeren?','Alle eigenen Songs und Musikvideos werden von diesem Gerät entfernt. Die Originaldateien bleiben, wo sie waren.','Leeren',function(){ if(P.cur&&P.cur.kind==='track') P.stop(); G.library.clear().then(function(){ u.toast('Bibliothek geleert'); }); }); break;
      case 'resetAll': u.confirm('Alles zurücksetzen?','Favoriten, Verlauf, YouTube-Liste und Einstellungen werden gelöscht. Deine Bibliothek bleibt.','Zurücksetzen',function(){ S.resetAll(); location.reload(); }); break;
      case 'install': install(); break;
      case 'idlePlay': (function(){
          var list;
          if(S.view==='music'){ list=G.library.songs(); S.set('shuffle',false); }
          else if(S.view==='radio'){ list=G.store.favs.filter(function(f){return f.kind==='radio';}); if(!list.length) list=V.ui.radioItems||[]; }
          else { list=G.store.favs.filter(function(f){return f.kind==='yt';}); if(!list.length) list=G.store.yt.length?G.store.yt:(V.ui.ytResults||[]); }
          if(list&&list.length) P.play(list[0],list);
        })(); break;
      case 'favExport': exportSheet('fav:'+((el&&el.dataset.kind)||'track')); break;
      case 'npMore': npMore(); break;
      case 'pip': G.pip.toggle(); break;
      case 'lang': G.setLang(G.lang==='en'?'de':'en'); V.refresh(); V.renderNP(); V.renderStage(); V.renderDock(); u.toast(G.lang==='en'?'English':'Deutsch'); break;
      case 'theme': setTheme(document.documentElement.getAttribute('data-theme')==='light'?'dark':'light'); break;
      case 'copyright': u.sheet('Copyright',
          '<p><b>G04Musik</b> · Version '+G.VERSION+'</p>'+
          '<p>© '+Math.max(2026,new Date().getFullYear())+' <b>PaulFV</b>. Alle Rechte vorbehalten.</p>'+
          '<p>App, Name, Icon und Gestaltung sind urheberrechtlich geschützt. Weitergabe, Veränderung oder Veröffentlichung nur mit Erlaubnis von PaulFV.</p>'+
          '<p style="color:var(--tx-2);font-size:13px">Eigene Songs und Musikvideos gehören ihren Urhebern. Radiosender über radio-browser.info, Videos über YouTube – es gelten deren Bedingungen.</p>'); break;
      case 'toList': if(P.cur) listPicker(P.cur); break;
      case 'plNew': nameSheet('Neue Liste','',function(n){ var l=G.lists.create(n); u.toast('Liste „'+l.name+'“ angelegt'); V.ui.listOpen=l.id; V.ui.musicTab='lists'; if(S.view!=='music') go('music'); else V.refresh(); }); break;
      case 'plImport': u.$('#pickList').click(); break;
      case 'plExportAll': G.lists.exportFile('all','json').then(function(ok){ if(ok) u.toast('Favoriten und alle Listen exportiert'); }); break;
      case 'plBack': V.ui.listOpen=null; V.refresh(); break;
      case 'plPlay': case 'plShuffle':
        var r=V.lookup('pl',0); if(r&&r.list.length){ S.set('shuffle',a==='plShuffle'); P.play(a==='plShuffle'? r.list[Math.floor(Math.random()*r.list.length)] : r.list[0], r.list); } break;
      case 'plExport': exportSheet(V.ui.listOpen); break;
      case 'plRename': var lr=G.lists.get(V.ui.listOpen); if(lr) nameSheet('Liste umbenennen',lr.name,function(n){ G.lists.rename(lr.id,n); u.toast('Umbenannt'); }); break;
      case 'plDelete': var ld=G.lists.get(V.ui.listOpen); if(ld) u.confirm('Liste löschen?','„'+ld.name+'“ wird gelöscht. Die Songs selbst bleiben in deiner Bibliothek.','Löschen',function(){ G.lists.remove(ld.id); V.ui.listOpen=null; u.toast('Liste gelöscht'); }); break;
      case 'ytClear': V.ui.ytQuery=''; V.ui.ytResults=null; V.ui.ytErr=''; V.ui.ytBusy=false; V.refresh(); break;
      case 'ytKey': ytKeySheet(); break;
    }
  }

  /* ---------- Listen: Namen eingeben, Liste wählen, exportieren ---------- */
  function nameSheet(title,val,cb){
    u.sheet(title,'<form id="nameForm" style="display:flex;flex-direction:column;gap:10px"><label class="field">'+u.ic('edit',18)+'<input id="nameIn" type="text" maxlength="60" placeholder="Name der Liste" value="'+u.esc(val)+'" autocomplete="off"></label>'+
      '<div class="btn-row" style="justify-content:flex-end"><button class="btn btn--solid" type="submit">Speichern</button></div></form>',function(b){
      u.$('#nameForm',b).addEventListener('submit',function(e){ e.preventDefault(); var n=u.$('#nameIn').value.trim(); if(!n){ u.$('#nameIn').focus(); return; } u.closeSheet(); cb(n); });
    });
  }
  function listPicker(it){
    var L=G.lists.all;
    u.sheet('Zu Liste hinzufügen',
      '<p>„'+u.esc(it.title)+'“</p><div class="pick-list">'+
      L.map(function(l){ var has=l.items.some(function(x){ return S.key(x)===S.key(it); });
        return '<button class="act" type="button" data-pl="'+u.esc(l.id)+'"'+(has?' disabled style="opacity:.5"':'')+'>'+u.ic('lists',18)+'<span>'+u.esc(l.name)+'<small>'+l.items.length+(l.items.length===1?' Eintrag':' Einträge')+(has?' · schon drin':'')+'</small></span></button>'; }).join('')+
      '</div><form id="plNewForm" class="filterbar"><label class="field field--sm">'+u.ic('plus',17)+'<input id="plNewIn" type="text" maxlength="60" placeholder="Neue Liste anlegen" autocomplete="off"></label><button class="btn btn--solid btn--icon" type="submit" aria-label="Anlegen und hinzufügen">'+u.ic('plus',18)+'</button></form>',
      function(b){
        b.addEventListener('click',function(e){ var x=e.target.closest('[data-pl]'); if(!x||x.disabled) return; u.closeSheet(); if(G.lists.add(x.dataset.pl,it)) u.toast('Zu „'+G.lists.get(x.dataset.pl).name+'“ hinzugefügt'); });
        u.$('#plNewForm',b).addEventListener('submit',function(e){ e.preventDefault(); var n=u.$('#plNewIn').value.trim(); if(!n){ u.$('#plNewIn').focus(); return; } var l=G.lists.create(n,[it]); u.closeSheet(); u.toast('Liste „'+l.name+'“ angelegt'); });
      });
  }
  function exportSheet(id){
    var PL=G.lists, l = String(id).indexOf('fav:')===0 ? PL.favList(id.slice(4)) : id===PL.FAV_ID ? PL.favList() : PL.get(id); if(!l) return;
    var opt=function(k,icon,name,desc){ return '<button class="act" type="button" data-ex="'+k+'">'+u.ic(icon,18)+'<span>'+name+'<small>'+desc+'</small></span></button>'; };
    u.sheet('„'+l.name+'“ exportieren',
      opt('json','upload','G04Musik-Datei (.json)','Zum Sichern oder für ein anderes Gerät mit G04Musik – alles bleibt erhalten')+
      opt('m3u8','lists','M3U8','Für die meisten Player (VLC, Winamp, Handy-Apps), Umlaute sicher')+
      opt('m3u','lists','M3U','Ältere Variante von M3U8 für sehr alte Player')+
      opt('xspf','lists','XSPF','Für VLC & Co. – mit Titel, Künstler, Album und Länge')+
      opt('pls','radio','PLS','Älteres Format, gut für Radiosender und Internetradio-Programme')+
      opt('csv','rows','CSV-Tabelle','Zum Öffnen in Excel oder Google Tabellen')+
      opt('txt','file','Textliste (.txt)','„Künstler – Titel“ zum Verschicken oder Ausdrucken')+
      '<p style="font-size:12.5px;color:var(--tx-2)">Sender und YouTube werden mit Adresse gespeichert, eigene Songs mit dem Dateinamen – die Musikdateien selbst sind nicht enthalten.</p>',
      function(b){ b.addEventListener('click',function(e){ var x=e.target.closest('[data-ex]'); if(!x) return; u.closeSheet(); PL.exportFile(id,x.dataset.ex).then(function(ok){ if(ok) u.toast('Als '+x.dataset.ex.toUpperCase()+' exportiert'); }); }); });
  }
  /* Position eines angezeigten Eintrags in der gespeicherten Liste */
  function rawIndex(l,it){
    for(var i=0;i<l.items.length;i++){ var x=l.items[i];
      if(S.key(x)===S.key(it) || (x.kind==='track'&&it.kind==='track'&&x.fileName&&x.fileName===it.fileName)) return i; }
    return -1;
  }
  /* Zusatzknöpfe des Players als Blatt (Handy) */
  function npMore(){
    var c=P.cur; if(!c) return;
    var fav=S.isFav(c), rep={off:'aus',all:'alle',one:'ein Titel'}[S.settings.repeat];
    u.sheet(c.title,
      '<button class="act" type="button" data-m="fav">'+u.ic(fav?'starF':'star',18)+(fav?'Aus Favoriten entfernen':'Zu Favoriten')+'</button>'+
      '<button class="act" type="button" data-m="list">'+u.ic('listAdd',18)+'Zu Liste hinzufügen</button>'+
      '<button class="act" type="button" data-m="repeat">'+u.ic(S.settings.repeat==='one'?'repeat1':'repeat',18)+'<span>Wiederholen<small>jetzt: '+rep+'</small></span></button>'+
      '<button class="act" type="button" data-m="sleep">'+u.ic('moon',18)+'<span>Einschlaf-Timer<small>'+(P.sleepAt?'noch '+P.sleepLeft()+' min':'aus')+'</small></span></button>'+
      '<button class="act act--danger" type="button" data-m="stop">'+u.ic('trash',18)+'Wiedergabe beenden</button>',
      function(b){ b.addEventListener('click',function(e){ var x=e.target.closest('[data-m]'); if(!x) return; var m=x.dataset.m; u.closeSheet();
        if(m==='pip') G.pip.toggle(); else if(m==='fav') act('fav'); else if(m==='list') act('toList'); else if(m==='repeat') act('repeat'); else if(m==='sleep') act('sleep'); else act('stop'); }); });
  }
  function ytKeySheet(){
    var cur=u.ls.get('ytKey','');
    u.sheet('YouTube-Suchschlüssel',
      '<p>Optional. Mit einem eigenen, kostenlosen Schlüssel von Google sucht die App direkt bei YouTube. Ohne Schlüssel nutzt sie freie Ersatz-Server.</p>'+
      '<p style="font-size:13px;color:var(--tx-2)">So bekommst du ihn: console.cloud.google.com → Projekt anlegen → „YouTube Data API v3“ aktivieren → Anmeldedaten → API-Schlüssel erstellen. Der Schlüssel bleibt nur auf diesem Gerät.</p>'+
      '<label class="field">'+u.ic('link',18)+'<input id="ytKeyIn" type="text" autocomplete="off" spellcheck="false" placeholder="API-Schlüssel einfügen" value="'+u.esc(cur)+'"></label>'+
      '<div class="btn-row" style="justify-content:flex-end">'+(cur?'<button class="btn btn--danger" type="button" data-k="del">Entfernen</button>':'')+'<button class="btn btn--solid" type="button" data-k="save">Speichern</button></div>',
      function(b){ b.addEventListener('click',function(e){ var x=e.target.closest('[data-k]'); if(!x) return;
        if(x.dataset.k==='save'){ var v=u.$('#ytKeyIn').value.trim(); if(v) u.ls.set('ytKey',v); else u.ls.del('ytKey'); u.toast(v?'Schlüssel gespeichert':'Kein Schlüssel'); }
        else { u.ls.del('ytKey'); u.toast('Schlüssel entfernt'); }
        u.closeSheet(); V.refresh(); }); });
  }
  function sleepSheet(){
    var opts=[15,30,45,60,90], cur=P.sleepLeft();
    u.sheet('Einschlaf-Timer',
      (cur?'<p>Noch '+cur+' Minuten.</p>':'<p>Nach Ablauf wird es leiser, dann endet die Wiedergabe.</p>')+
      '<div class="cards" style="grid-template-columns:repeat(3,minmax(0,1fr))">'+opts.map(function(m){ return '<button class="btn btn--ghost" type="button" data-min="'+m+'">'+m+' min</button>'; }).join('')+
      (cur?'<button class="btn btn--danger" type="button" data-min="0">Aus</button>':'')+'</div>',
      function(b){ b.addEventListener('click',function(e){ var x=e.target.closest('[data-min]'); if(!x) return; var m=+x.dataset.min; P.setSleep(m); S.set('sleepDefault',m||S.settings.sleepDefault); u.closeSheet(); u.toast(m?'Einschlaf-Timer: '+m+' Minuten':'Einschlaf-Timer aus'); if(S.view==='settings') V.refresh(); }); });
  }

  /* ---------- Langes Drücken: Aktionen zu einem Eintrag ---------- */
  u.onLongPress(document,'[data-l][data-i]',function(el){
    var r=V.lookup(el.dataset.l,el.dataset.i); if(!r||!r.item) return;
    var it=r.item, fav=S.isFav(it), h='';
    h+='<button class="act" type="button" data-x="play">'+u.ic('play',18)+'Abspielen</button>';
    if(P.cur && S.key(P.cur)!==S.key(it)) h+='<button class="act" type="button" data-x="nextUp">'+u.ic('queue',18)+'Als Nächstes spielen</button>';
    h+='<button class="act" type="button" data-x="fav">'+u.ic(fav?'starF':'star',18)+(fav?'Aus Favoriten entfernen':'Zu Favoriten')+'</button>';
    h+='<button class="act" type="button" data-x="toList">'+u.ic('listAdd',18)+'Zu Liste hinzufügen</button>';
    var inList = el.dataset.l==='pl' && V.ui.listOpen && V.ui.listOpen!==G.lists.FAV_ID;
    if(inList){
      h+='<div class="btn-row"><button class="btn btn--ghost btn--sm" type="button" data-x="up">'+u.ic('up',16)+'Nach oben</button><button class="btn btn--ghost btn--sm" type="button" data-x="down">'+u.ic('down',16)+'Nach unten</button></div>';
      h+='<button class="act act--danger" type="button" data-x="unlist">'+u.ic('trash',18)+'Aus dieser Liste entfernen</button>';
    }
    if(it.kind==='yt') h+='<a class="act" href="'+(it.ytType==='list'?'https://www.youtube.com/playlist?list=':'https://www.youtube.com/watch?v=')+u.esc(it.ytId)+'" target="_blank" rel="noopener">'+u.ic('yt',18)+'Auf YouTube öffnen</a>';
    if(it.kind==='track') h+='<div class="act" style="cursor:default">'+u.ic('info',18)+'<span>'+u.esc(it.fileName||'')+'<small>'+[u.fmt(it.duration),u.bytes(it.size),(it.type||'').replace(/^(audio|video)\//,'').toUpperCase()].filter(function(x){return x&&x!=='–:––';}).join(' · ')+'</small></span></div>';
    if(it.kind==='track') h+='<button class="act act--danger" type="button" data-x="del">'+u.ic('trash',18)+'Aus der Bibliothek löschen</button>';
    if(it.kind==='yt') h+='<button class="act act--danger" type="button" data-x="delyt">'+u.ic('trash',18)+'Aus der Liste entfernen</button>';
    u.sheet(it.title,h,function(b){
      b.addEventListener('click',function(e){
        var x=e.target.closest('[data-x]'); if(!x) return; var k=x.dataset.x; u.closeSheet();
        if(k==='play') P.play(it,r.list);
        else if(k==='nextUp'){ P.queue.splice(P.index+1,0,it); u.toast('Kommt als Nächstes'); V.renderNP(); }
        else if(k==='fav') u.toast(S.toggleFav(it)?'Zu Favoriten hinzugefügt':'Aus Favoriten entfernt');
        else if(k==='toList') listPicker(it);
        else if(k==='up'||k==='down'||k==='unlist'){
          var l=G.lists.get(V.ui.listOpen), ix=l?rawIndex(l,it):-1; if(ix<0) return;
          if(k==='unlist'){ G.lists.removeAt(l.id,ix); u.toast('Aus der Liste entfernt'); }
          else G.lists.move(l.id,ix,k==='up'?-1:1);
        }
        else if(k==='del') u.confirm('Löschen?','„'+it.title+'“ wird von diesem Gerät entfernt.','Löschen',function(){ if(P.cur&&P.cur.id===it.id) P.stop(); G.library.remove(it.id).then(function(){ u.toast('Gelöscht'); }); });
        else if(k==='delyt'){ if(P.cur&&P.cur.id===it.id) P.stop(); S.removeYT(it.id); u.toast('Entfernt'); }
      });
    });
  });

  /* ---------- Eingaben ---------- */
  var musicSearch=u.debounce(function(v){ V.ui.musicQuery=v; V.refresh(); },180);
  var radioSearch=u.debounce(function(v){ V.ui.radioQuery=v; V.ui.radioItems=null; V.refresh(); },450);
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t.id==='musicSearch') musicSearch(t.value);
    else if(t.id==='radioSearch') radioSearch(t.value);
    else if(t.id==='volRange') P.setVolume(t.value/100);
  });
  document.addEventListener('change',function(e){
    if(e.target.id==='radioCountry'){ S.radioCountry=e.target.value; S.save('radioCountry'); V.ui.radioItems=null; V.refresh(); }
  });
  /* ---------- Feedback (wie G04Fit, über formsubmit.co) ---------- */
  var FEEDBACK_ZIEL='https://formsubmit.co/ajax/fodorpaul@web.de';
  function sendFeedback(form){
    var status=u.$('#fbStatus'), btn=u.$('#fbSend');
    function say(t,k){ status.textContent=t; status.className='fb__status'+(k?' fb__status--'+k:''); }
    if(form.elements._honey.value) return;
    var text=form.elements.message.value.trim(), email=form.elements._replyto.value.trim();
    if(!text){ say('Bitte schreibe zuerst eine Nachricht.','err'); form.elements.message.focus(); return; }
    if(email&&!form.elements._replyto.checkValidity()){ say('Bitte gib eine gültige E-Mail-Adresse an.','err'); return; }
    if(navigator.onLine===false){ say('Keine Internetverbindung. Bitte versuche es später noch einmal.','err'); return; }
    btn.disabled=true; say('Wird gesendet …');
    fetch(FEEDBACK_ZIEL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({message:text,_replyto:email,_subject:'G04Musik — Feedback',_template:'table',App:'G04Musik '+G.VERSION,Sprache:G.lang,Geraet:navigator.userAgent})
    }).then(function(res){
      return res.json().catch(function(){ return null; }).then(function(data){
        var refused=!data||data.success===false||data.success==='false';
        if(!res.ok||refused) throw new Error('status '+res.status);
      });
    }).then(function(){ say('Danke! Deine Nachricht ist unterwegs.','ok'); form.reset(); })
      .catch(function(){ say('Senden hat nicht geklappt. Bitte versuche es noch einmal oder schreibe an fodorpaul@web.de.','err'); })
      .then(function(){ btn.disabled=false; });
  }
  document.addEventListener('submit',function(e){
    if(e.target.id==='fbForm'){ e.preventDefault(); sendFeedback(e.target); return; }
    if(e.target.id!=='ytForm') return;
    e.preventDefault();
    var inp=u.$('#ytInput'), val=inp.value.trim(), p=G.yt.parse(val);
    if(!val) return;
    /* Nur echte Links (mit / oder .) merken, alles andere ist ein Suchbegriff */
    if(!p || !/[\/.]/.test(val)){ ytSearch(val); inp.blur(); return; }
    var tmp=G.yt.toItem(p);
    if(S.yt.some(function(y){ return y.id===tmp.id; })){ u.toast('Ist schon in deiner Liste'); inp.value=''; return; }
    S.addYT(tmp); inp.value=''; u.toast('Hinzugefügt');
    G.yt.meta(p).then(function(m){
      if(!m.title) return;
      var full=G.yt.toItem(p,m);
      S.yt.forEach(function(y,i){ if(y.id===full.id){ S.yt[i]=Object.assign(y,{title:full.title,sub:full.sub,art:full.art}); } });
      S.save('yt'); S.emit('yt');
    });
  });
  function ytSearch(q){
    var ui=V.ui; ui.ytQuery=q; ui.ytBusy=true; ui.ytErr=''; ui.ytResults=null; V.refresh();
    G.yt.search(q).then(function(list){ if(ui.ytQuery!==q) return; ui.ytBusy=false; ui.ytResults=list; V.refresh(); })
      .catch(function(){ if(ui.ytQuery!==q) return; ui.ytBusy=false; ui.ytErr='Die freien Suchserver antworten gerade nicht. Du kannst direkt auf YouTube suchen und den Link hier einfügen – oder in den Einstellungen einen eigenen Suchschlüssel hinterlegen.'; V.refresh(); });
  }
  u.$('#pickList').addEventListener('change',function(e){
    var f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f) return;
    var fr=new FileReader();
    fr.onload=function(){
      try{
        var r=G.lists.importText(String(fr.result),f.name);
        var msg=[]; if(r.lists) msg.push(r.lists+(r.lists===1?' Liste':' Listen')); if(r.favs) msg.push(r.favs+' Favoriten');
        u.toast((msg.length?msg.join(' und ')+' importiert':'Nichts Neues gefunden')+(r.missing?' · '+r.missing+' Songs fehlen auf diesem Gerät':''));
        V.ui.listOpen=null; V.ui.musicTab='lists'; if(S.view!=='music') go('music'); else V.refresh();
      }catch(err){ u.toast(err.message||'Die Datei ließ sich nicht lesen.',true); }
    };
    fr.onerror=function(){ u.toast('Die Datei ließ sich nicht lesen.',true); };
    fr.readAsText(f);
  });
  ['pickFiles','pickFolder'].forEach(function(id){
    u.$('#'+id).addEventListener('change',function(e){
      var files=e.target.files; if(!files||!files.length) return;
      var wasEmpty=!G.library.tracks.length;
      G.library.importFiles(files).then(function(n){
        e.target.value='';
        if(n&&wasEmpty&&S.view==='music'){ V.ui.musicTab=G.library.songs().length?'songs':'videos'; V.refresh(); }
      });
    });
  });

  /* ---------- Spulen ---------- */
  var seekBar=null;
  function seekFrac(e){ var r=seekBar.getBoundingClientRect(); return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); }
  document.addEventListener('pointerdown',function(e){
    var b=e.target.closest('.js-seek'); if(!b||b.classList.contains('is-live')) return;
    seekBar=b; V.seeking=true; b.setPointerCapture&&b.setPointerCapture(e.pointerId);
    b.querySelector('.js-bar').style.width=seekFrac(e)*100+'%';
  });
  document.addEventListener('pointermove',function(e){ if(seekBar) seekBar.querySelector('.js-bar').style.width=seekFrac(e)*100+'%'; });
  document.addEventListener('pointerup',function(e){ if(!seekBar) return; P.seekTo(seekFrac(e)); seekBar=null; setTimeout(function(){ V.seeking=false; },150); });
  document.addEventListener('keydown',function(e){
    var b=e.target.closest&&e.target.closest('.js-seek');
    if(b&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){ e.preventDefault(); var d=P.duration(); if(d) P.seekTo(Math.max(0,Math.min(1,(P.time()+(e.key==='ArrowRight'?10:-10))/d))); }
  });

  /* ---------- Bühne: Vollbild, Bild-in-Bild, Wiederholen ---------- */
  u.$('#stageFull').addEventListener('click',function(){
    var st=u.$('#stage'), m=u.$('#media');
    if(document.fullscreenElement||document.webkitFullscreenElement){ (document.exitFullscreen||document.webkitExitFullscreen).call(document); return; }
    if(st.requestFullscreen) st.requestFullscreen().catch(function(){});
    else if(st.webkitRequestFullscreen) st.webkitRequestFullscreen();
    else if(m.webkitEnterFullscreen&&!m.hidden) m.webkitEnterFullscreen(); /* iPhone */
  });
  u.$('#stagePip').addEventListener('click',function(){ G.pip.toggle(); });
  u.$('#stageRetry').addEventListener('click',function(){ P.toggle(); });
  /* Tippen auf das Abspielfenster: Pause / weiter */
  u.$('#stage').addEventListener('click',function(e){
    var st=u.$('#stage'); if(e.target.closest('button,a,iframe')) return;
    if(!P.cur||P.error||P.cur.kind==='yt') return;
    if(st.classList.contains('has-video')){ st.classList.add('show-tools'); clearTimeout(st._t); st._t=setTimeout(function(){ st.classList.remove('show-tools'); },3000); }
    var wasPlaying=P.playing;
    P.toggle();
    if(!wasPlaying){ st.classList.remove('flash-play'); void st.offsetWidth; st.classList.add('flash-play'); }
  });
  u.$('#liveChip').addEventListener('click',function(){ act('toStage'); });
  u.$('#sideNow').addEventListener('click',function(){ if(P.cur) act('toStage'); });

  /* Aufklappbare Gruppen merken, ob sie offen sind */
  document.addEventListener('toggle',function(e){ var t=e.target; if(!t||!t.matches) return; if(t.id==='instFold') u.ls.set('instOpen',t.open); else if(t.dataset&&t.dataset.fold) u.ls.set('fold.'+t.dataset.fold,t.open); },true);

  /* ---------- Blatt ---------- */
  u.$('#sheetClose').addEventListener('click',u.closeSheet);
  u.$('#scrim').addEventListener('click',u.closeSheet);

  /* ---------- Tastatur (Desktop) ---------- */
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!u.$('#sheet').hidden){ u.closeSheet(); return; }
    var tag=(e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||e.target.isContentEditable||e.ctrlKey||e.metaKey||e.altKey) return;
    if(e.key===' '&&!e.target.closest('button')){ e.preventDefault(); P.toggle(); }
    else if(e.key==='n'||e.key==='N') P.next();
    else if(e.key==='p'||e.key==='P') P.prev();
    else if(e.key==='f'||e.key==='F') u.$('#stageFull').click();
    else if(e.key==='m'||e.key==='M'){ P.setVolume(S.settings.volume>0?0:0.9); V.renderNP(); }
  });

  /* ---------- Installieren ---------- */
  /* Der Browser meldet, wenn direktes Installieren geht (Chrome, Edge, Android) */
  var deferred=null;
  window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); deferred=e; if(S.view==='settings') V.refresh(); });
  window.addEventListener('appinstalled',function(){ deferred=null; u.toast('G04Musik ist installiert'); if(S.view==='settings') V.refresh(); });
  G.app={ canInstall:function(){ return !!deferred; }, install:install };
  function install(){
    if(deferred){ deferred.prompt(); deferred.userChoice.then(function(c){ deferred=null; if(c&&c.outcome==='accepted') u.toast('Wird installiert …'); if(S.view==='settings') V.refresh(); }); return; }
    var ios=P.IOS, android=/Android/i.test(navigator.userAgent);
    u.sheet('Als App installieren', ios
      ? '<ol class="inst-steps"><li>Diese Seite in <b>Safari</b> öffnen.</li><li>Unten auf <b>Teilen</b> '+u.ic('upload',16)+' tippen.</li><li><b>„Zum Home-Bildschirm“</b> wählen und <b>Hinzufügen</b>.</li></ol>'
      : android
      ? '<ol class="inst-steps"><li>Diese Seite in <b>Chrome</b> öffnen.</li><li>Oben rechts das Menü <b>⋮</b> öffnen.</li><li><b>„App installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b> wählen.</li></ol>'
      : '<ol class="inst-steps"><li>Diese Seite in <b>Chrome</b> oder <b>Edge</b> öffnen.</li><li>Rechts in der Adressleiste auf das Symbol <b>Installieren</b> klicken (oder Menü → „App installieren“).</li><li>G04Musik startet danach wie ein eigenes Programm.</li></ol>');
  }

  /* ---------- Fenstergröße: Navigation passt Beschriftung an ---------- */
  var wasPhone=window.innerWidth<768;
  window.addEventListener('resize',u.debounce(function(){
    var ph=window.innerWidth<768; V.renderNav();
    if(ph!==wasPhone){ wasPhone=ph; V.refresh(); updateDock(); }
  },150));

  /* ---------- Offline ---------- */
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){ r.update().catch(function(){}); }).catch(function(){}); });
  }

  /* ---------- Höhe der Kopfzeile: darunter klebt das Abspielfenster ---------- */
  function setTopH(){ document.documentElement.style.setProperty('--topbar-h', u.$('.topbar').offsetHeight+'px'); }
  window.addEventListener('resize',u.debounce(setTopH,100)); setTopH();

  /* ---------- Kein Zoom (iOS ignoriert user-scalable=no) ---------- */
  ['gesturestart','gesturechange','gestureend'].forEach(function(n){ document.addEventListener(n,function(e){ e.preventDefault(); },{passive:false}); });
  document.addEventListener('touchmove',function(e){ if(e.touches&&e.touches.length>1) e.preventDefault(); },{passive:false});
  /* Doppeltippen-Zoom verhindert touch-action:manipulation (theme.css) – schnelles Tippen auf Knöpfe bleibt möglich */

  /* ---------- Hell / Dunkel ---------- */
  function setTheme(t){
    var light=t==='light';
    if(light) document.documentElement.setAttribute('data-theme','light'); else document.documentElement.removeAttribute('data-theme');
    u.ls.set('theme',light?'light':'dark');
    var m=document.querySelector('meta[name=theme-color]'); if(m) m.setAttribute('content',light?'#F7F2F4':'#07050A');
    V.renderTopBtns(); if(S.view==='settings') V.refresh();
  }
  if(document.documentElement.getAttribute('data-theme')==='light'){ var tm=document.querySelector('meta[name=theme-color]'); if(tm) tm.setAttribute('content','#F7F2F4'); }

  /* ---------- Los ---------- */
  var start=location.hash.slice(1)||S.view;
  go(start,true);
  setTimeout(V.revealActive,50);
  V.renderStage(); V.renderNP(); V.renderDock();
  G.library.load();
})();
