/* ============================================================
   G04Musik — Start, Navigation, Bedienung
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, S = G.store, V = G.views, P = G.player;

  u.$('#brandVer').textContent = 'v'+G.VERSION;

  /* ---------- Navigation ---------- */
  function go(view,keepScroll){
    if(!V.NAV.some(function(n){ return n.id===view; })) view='start';
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
    var el=e.target.closest('[data-go],[data-tab],[data-l],[data-act],[data-mtab],[data-album],[data-cc],[data-rtag],[data-sw]');
    if(!el) return;
    var d=el.dataset;
    if(d.go){ e.preventDefault(); go(d.go); return; }
    if(d.tab){ S.tab=d.tab; S.save('tab'); V.refresh(); return; }
    if(d.l!=null&&d.i!=null){ var r=V.lookup(d.l,d.i); if(r&&r.item) P.play(r.item,r.list); return; }
    if(d.mtab){ V.ui.musicTab=d.mtab; V.ui.album=null; u.ls.set('musicTab',d.mtab); V.refresh(); return; }
    if(d.album!=null){ V.ui.album=d.album; V.render(); window.scrollTo(0,u.$('#viewHost').offsetTop-80); return; }
    if(d.cc!=null){ S.radioCountry=d.cc; S.save('radioCountry'); V.ui.radioItems=null; V.refresh(); return; }
    if(d.rtag!=null){ V.ui.radioTag=d.rtag; V.ui.radioItems=null; V.refresh(); return; }
    if(d.sw){ S.set(d.sw,!S.settings[d.sw]); if(d.sw==='viz'&&S.settings.viz&&!P.IOS) u.toast('Der echte Visualizer startet mit dem nächsten Song.'); return; }
    if(d.act) act(d.act,el);
  });

  function act(a){
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
      case 'toStage': if(!V.hasHero()) go('start'); u.$('#hero').scrollIntoView({behavior:'smooth',block:'start'}); break;
      case 'playAll': var s=G.library.songs(); if(s.length){ S.set('shuffle',true); P.play(s[Math.floor(Math.random()*s.length)],s); } break;
      case 'albumBack': V.ui.album=null; V.ui.musicTab='albums'; V.refresh(); break;
      case 'radioRetry': V.ui.radioKey=''; V.ui.radioItems=null; V.refresh(); break;
      case 'clearLib': u.confirm('Bibliothek leeren?','Alle eigenen Songs und Musikvideos werden von diesem Gerät entfernt. Die Originaldateien bleiben, wo sie waren.','Leeren',function(){ if(P.cur&&P.cur.kind==='track') P.stop(); G.library.clear().then(function(){ u.toast('Bibliothek geleert'); }); }); break;
      case 'resetAll': u.confirm('Alles zurücksetzen?','Favoriten, Verlauf, YouTube-Liste und Einstellungen werden gelöscht. Deine Bibliothek bleibt.','Zurücksetzen',function(){ S.resetAll(); location.reload(); }); break;
      case 'install': install(); break;
    }
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
  document.addEventListener('submit',function(e){
    if(e.target.id!=='ytForm') return;
    e.preventDefault();
    var inp=u.$('#ytInput'), p=G.yt.parse(inp.value);
    if(!p){ u.toast('Das ist kein YouTube-Link. Erwartet wird z. B. youtube.com/watch?v=… oder youtu.be/…',true); return; }
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
  ['pickFiles','pickFolder'].forEach(function(id){
    u.$('#'+id).addEventListener('change',function(e){
      var files=e.target.files; if(!files||!files.length) return;
      var wasEmpty=!G.library.tracks.length;
      G.library.importFiles(files).then(function(n){
        e.target.value='';
        if(n&&wasEmpty&&S.view==='start'){ S.tab=G.library.songs().length?'songs':'videos'; S.save('tab'); V.refresh(); }
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
  u.$('#stagePip').addEventListener('click',function(){
    var m=u.$('#media');
    if(document.pictureInPictureElement) document.exitPictureInPicture().catch(function(){});
    else if(m.requestPictureInPicture) m.requestPictureInPicture().catch(function(){ u.toast('Bild-in-Bild geht gerade nicht.',true); });
  });
  u.$('#stageRetry').addEventListener('click',function(){ P.toggle(); });
  u.$('#stage').addEventListener('click',function(e){
    var st=u.$('#stage'); if(e.target.closest('button')) return;
    if(st.classList.contains('has-video')){ st.classList.add('show-tools'); clearTimeout(st._t); st._t=setTimeout(function(){ st.classList.remove('show-tools'); },3000); }
  });
  u.$('#stage').addEventListener('dblclick',function(e){ if(u.$('#stage').classList.contains('has-video')) u.$('#stageFull').click(); });
  u.$('#liveChip').addEventListener('click',function(){ act('toStage'); });
  u.$('#sideNow').addEventListener('click',function(){ if(P.cur) act('toStage'); });

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
  var deferred=null;
  window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); deferred=e; });
  function install(){
    if(deferred){ deferred.prompt(); deferred.userChoice.finally(function(){ deferred=null; }); return; }
    var ios=P.IOS;
    u.sheet('Als App installieren', ios
      ? '<p>In Safari unten auf <b>Teilen</b> tippen und dann <b>„Zum Home-Bildschirm“</b> wählen.</p>'
      : '<p>Im Browser-Menü <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b> wählen. In Chrome und Edge auf dem Rechner gibt es dafür auch ein Symbol rechts in der Adressleiste.</p>');
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

  /* ---------- Los ---------- */
  var start=location.hash.slice(1)||S.view;
  go(start,true);
  V.renderStage(); V.renderNP(); V.renderDock();
  G.library.load();
})();
