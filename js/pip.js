/* ============================================================
   G04Musik — Mini-Fenster (Bild-in-Bild) über anderen Apps
   - Musikvideos: das Video selbst geht ins Mini-Fenster
   - Eigene Songs und Radio: ein kleines Bild mit Cover, Titel und
     Fortschritt wird gezeichnet und als Video ins Mini-Fenster gegeben
   - YouTube: geht nicht (eingebetteter Player erlaubt es nicht)
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u, P = G.player, S = G.store;

  var cv = document.createElement('canvas'); cv.width = 480; cv.height = 480;
  var cx = cv.getContext('2d');
  var vid = null, timer = null, img = null, imgFor = '';

  function hasPiP(v){ return !!(document.pictureInPictureEnabled || (v && v.webkitSupportsPresentationMode && v.webkitSupportsPresentationMode('picture-in-picture'))); }
  var testVid = document.createElement('video');
  var CAN_STREAM = !!cv.captureStream;
  var POPUP = !!window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches && !P.IOS && !/Android/i.test(navigator.userAgent);
  var mini = null;
  function isVid(c){ return c && c.kind === 'track' && c.isVideo; }
  G.pip = {
    supported: function(){
      var c = P.cur; if (!c || c.kind === 'yt') return false;
      if (isVid(c)) return hasPiP(P.mediaEl());
      return POPUP || (CAN_STREAM && hasPiP(testVid));
    },
    active: function(){ return !!(mini || document.pictureInPictureElement || (vid && vid.webkitPresentationMode === 'picture-in-picture') || (P.mediaEl().webkitPresentationMode === 'picture-in-picture')); }
  };

  /* ---------- Eigenes Mini-Fenster am Rechner: wie der Player unten, nur kleiner ---------- */
  var MINI_VARS = ['--acc', '--acc-rgb', '--bg-1', '--tx-0', '--tx-2', '--btn-1', '--btn-2', '--on-acc', '--glass-br'];
  /* Alles ist in rem gemessen; die Schriftgröße der Seite folgt dem Fenster (Inhalt ≈ 33 × 8,2 rem),
     so wachsen und schrumpfen Cover, Tasten, Schrift und Balken gemeinsam. */
  var MINI_CSS = 'html{font-size:clamp(7px,min(2.94vw,13vh),48px)}html,body{margin:0;height:100%;overflow:hidden}body{display:flex;align-items:center;justify-content:stretch;padding:0;text-align:left;background:var(--bg-1,#141519);color:var(--tx-0,#f5f5f7);font:1rem system-ui,sans-serif;-webkit-user-select:none;user-select:none}'
    + '.mp{display:grid;grid-template-columns:5rem minmax(0,1fr);align-items:center;gap:.5rem 1rem;width:100%;min-width:0;box-sizing:border-box;padding:.9rem 1.05rem}'
    + '.mp>*{min-width:0}'
    + '.cov{grid-row:1/3;width:5rem;height:5rem;border-radius:.8rem;background:#2a1f2e center/cover no-repeat}'
    + '.meta{display:flex;align-items:baseline;gap:.6rem;overflow:hidden}.meta b{flex:0 1 auto;min-width:0;font-size:1.1rem;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta span{flex:1 1 0;min-width:0;color:var(--tx-2,#a8a0a6);font-size:.96rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '.meta .min{flex:none;align-self:center;width:1.9rem;height:1.9rem;padding:0;border:0;border-radius:50%;background:none;color:var(--tx-2,#a8a0a6);display:grid;place-items:center;cursor:pointer}.meta .min:hover{background:rgba(255,255,255,.1);color:var(--tx-0,#f5f5f7)}.meta .min svg{width:1.15rem;height:1.15rem}'
    + '.row2{display:flex;align-items:center;gap:.8rem}'
    + '.ctl{display:flex;align-items:center;gap:.15rem}.ctl button{width:2.6rem;height:2.6rem;padding:0;border:0;border-radius:50%;background:none;color:var(--tx-0,#f5f5f7);display:grid;place-items:center;cursor:pointer}.ctl button:hover{background:rgba(255,255,255,.1)}.ctl button.on{color:var(--acc,#ff4c66)}'
    + '.ctl svg{width:1.55rem;height:1.55rem}.ctl .pl svg{width:1.85rem;height:1.85rem}'
    + '.ctl .pl{width:3.4rem;height:3.4rem;margin:0 .3rem;background:linear-gradient(180deg,var(--btn-1,#ff4c66),var(--btn-2,#e0243f));color:var(--on-acc,#fff);box-shadow:0 0 1.4rem rgba(var(--acc-rgb,255,76,102),.45)}.ctl .pl:hover{filter:brightness(1.12);background:linear-gradient(180deg,var(--btn-1,#ff4c66),var(--btn-2,#e0243f))}'
    + '.seek{flex:1;display:flex;align-items:center;gap:.5rem;color:var(--tx-2,#a8a0a6);font-variant-numeric:tabular-nums;font-size:.92rem}.bar{flex:1;height:1.2rem;position:relative;cursor:pointer}'
    + '.bar::before{content:"";position:absolute;left:0;right:0;top:.45rem;height:.3rem;border-radius:.3rem;background:rgba(255,255,255,.14)}.bar i{position:absolute;left:0;top:.45rem;height:.3rem;border-radius:.3rem;background:var(--acc,#ff4c66)}.bar.live{cursor:default}.bar.live i{width:100%!important}'
    + '.compact .meta,.compact .row2{display:none}.compact .mp{grid-template-columns:100%;gap:0;padding:0;height:100%}.compact .cov{grid-row:auto;width:100%;height:100%;border-radius:0}';
  /* Nach 15 s ohne Maus schrumpft das Fenster auf das Cover; Maus drauf: wieder voll */
  var MINI_IDLE = 15000, MINI_SMALL = 96;
  function autoCompact(w, d){
    var root = d.documentElement, full = null, idle = 0;
    function compact(){
      if (w.closed || full) return;
      full = { w: w.innerWidth, h: w.innerHeight }; root.classList.add('compact');
      try { w.resizeBy(MINI_SMALL - w.innerWidth, MINI_SMALL - w.innerHeight); } catch (e) {}
    }
    function expand(){
      if (!full) return;
      var f = full; full = null; root.classList.remove('compact');
      try { w.resizeBy(f.w - w.innerWidth, f.h - w.innerHeight); } catch (e) {}
    }
    function arm(){ w.clearTimeout(idle); idle = w.setTimeout(compact, MINI_IDLE); }
    d.addEventListener('g04min', compact);
    root.addEventListener('mouseenter', function(){ w.clearTimeout(idle); expand(); });
    root.addEventListener('mouseleave', arm);
    arm();
  }
  G.pip.autoCompact = autoCompact;
  G.pip.buildMini = function(doc){
    var cs = getComputedStyle(document.documentElement);
    MINI_VARS.forEach(function(n){ var v = cs.getPropertyValue(n).trim(); if (v) doc.documentElement.style.setProperty(n, v); });
    var st = doc.createElement('style'); st.textContent = MINI_CSS; doc.head.appendChild(st);
    doc.title = 'G04Musik';
    var btn = function(a, cls, label){ return '<button type="button" class="' + cls + '" data-a="' + a + '" aria-label="' + label + '"></button>'; };
    var shrink = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
    doc.body.innerHTML = '<div class="mp"><div class="cov"></div><div class="meta"><b></b><span></span><button type="button" class="min" data-a="min" aria-label="Verkleinern" title="Verkleinern">' + shrink + '</button></div>'
      + '<div class="row2"><div class="ctl">' + btn('shuffle', 'sh', 'Zufall') + btn('prev', 'pv', 'Zurück') + btn('toggle', 'pl', 'Abspielen') + btn('next', 'nx', 'Weiter') + btn('repeat', 'rp', 'Wiederholen') + '</div>'
      + '<div class="seek"><span class="t">0:00</span><div class="bar"><i></i></div><span class="d">0:00</span></div></div></div>';
    var q = function(s){ return doc.querySelector(s); }, shownKey = null, iconKey = null;
    function update(){
      var c = P.cur; if (!c) return;
      var sh = G.views.shown(c), key = S.key(c) + '|' + sh.title + '|' + sh.art + '|' + sh.sub;
      if (key !== shownKey) {
        shownKey = key;
        var art = sh.art || c.art || new URL('assets/music-art/music-' + u.musicNo(c) + '.jpg', location.href).href;
        q('.cov').style.backgroundImage = 'url("' + art + '")';
        q('.meta b').textContent = sh.title; q('.meta span').textContent = sh.sub || c.artist || '';
      }
      var st = S.settings, ik = [P.playing, st.shuffle, st.repeat].join('|');
      if (ik !== iconKey) {
        iconKey = ik;
        q('.sh').innerHTML = u.ic('shuffle', 20); q('.sh').classList.toggle('on', !!st.shuffle);
        q('.pv').innerHTML = u.ic('prev', 20); q('.nx').innerHTML = u.ic('next', 20);
        q('.rp').innerHTML = u.ic(st.repeat === 'one' ? 'repeat1' : 'repeat', 20); q('.rp').classList.toggle('on', st.repeat !== 'off');
        var pl = q('.pl'); pl.innerHTML = u.ic(P.playing ? 'pause' : 'play', 24); pl.setAttribute('aria-label', P.playing ? 'Pause' : 'Abspielen');
      }
      var live = P.isLive(), d = P.duration(), t = P.time();
      q('.bar').classList.toggle('live', !!live);
      q('.bar i').style.width = live ? '100%' : (d ? Math.min(100, t / d * 100) : 0) + '%';
      q('.t').textContent = live ? 'LIVE' : u.fmt(t); q('.d').textContent = live ? '' : u.fmt(d);
    }
    doc.addEventListener('click', function(e){
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'prev') P.prev(); else if (a === 'next') P.next(); else if (a === 'toggle') P.toggle();
      else if (a === 'shuffle') S.set('shuffle', !S.settings.shuffle);
      else if (a === 'repeat') S.set('repeat', { off: 'all', all: 'one', one: 'off' }[S.settings.repeat]);
      else if (a === 'min') doc.dispatchEvent(new Event('g04min'));
      update();
    });
    q('.bar').addEventListener('click', function(e){ if (P.isLive()) return; var r = this.getBoundingClientRect(); P.seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); update(); });
    update();
    return update;
  };
  /* Popup aus der Hauptseite: Ton und Steuerung bleiben dort, das Fenster zeigt und bedient nur */
  function openMini(){
    var w = window.open('mini.html', 'g04mini', 'popup=yes,width=480,height=170');
    if (!w) throw new Error('blocked');
    var m = mini = { win: w, update: function(){}, tick: 0 }, tries = 0;
    function gone(){ clearInterval(m.tick); if (mini === m) { mini = null; S.emit('player'); } }
    (function init(){
      if (w.closed) return gone();
      var d; try { d = w.document; } catch (e) { return gone(); }
      if (!/mini\.html/.test(d.URL) || d.readyState !== 'complete' || !d.body) { if (tries++ < 80) setTimeout(init, 50); else gone(); return; }
      m.update = G.pip.buildMini(d);
      /* Browser öffnen Popups oft anders als angefordert: Höhe auf das Seitenverhältnis des Inhalts bringen */
      try {
        var dw = Math.max(0, 420 - w.innerWidth), dh = Math.round((w.innerWidth + dw) * 0.226) - w.innerHeight;
        if (dw || Math.abs(dh) > 3) w.resizeBy(dw, dh);
      } catch (e) {}
      autoCompact(w, d);
      m.tick = setInterval(function(){ if (w.closed) gone(); else m.update(); }, 500);
      w.addEventListener('pagehide', gone);
    })();
  }
  window.addEventListener('pagehide', function(){ if (mini) try { mini.win.close(); } catch (e) {} });

  /* ---------- Bild zeichnen ---------- */
  function loadArt(c){
    var src = c.art || new URL('assets/music-art/music-' + u.musicNo(c) + '.jpg', location.href).href;
    if (imgFor === src) return;
    imgFor = src; img = null;
    var im = new Image(); if (c.art && c.kind === 'radio') im.crossOrigin = 'anonymous';
    im.onload = function(){ if (imgFor === src) img = im; };
    im.src = src;
  }
  function round(x, y, w, h, r){ cx.beginPath(); cx.moveTo(x+r, y); cx.arcTo(x+w, y, x+w, y+h, r); cx.arcTo(x+w, y+h, x, y+h, r); cx.arcTo(x, y+h, x, y, r); cx.arcTo(x, y, x+w, y, r); cx.closePath(); }
  function fit(text, max){ var t = String(text || ''); while (t.length > 1 && cx.measureText(t).width > max) t = t.slice(0, -2) + '…'; return t; }
  function draw(){
    var c = P.cur; if (!c) return;
    loadArt(c);
    var W = cv.width, H = cv.height;
    var g = cx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2C0A14'); g.addColorStop(1, '#07050A');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    /* Cover */
    var s = 300, x = (W - s) / 2, y = 34;
    cx.save(); round(x, y, s, s, 26); cx.clip();
    if (img) {
      if (c.kind === 'radio' && c.art) { cx.fillStyle = '#fff'; cx.fillRect(x, y, s, s); cx.drawImage(img, x + 30, y + 30, s - 60, s - 60); }
      else cx.drawImage(img, x, y, s, s);
    } else {
      var h = u.hue(c.title), gg = cx.createLinearGradient(x, y, x + s, y + s);
      gg.addColorStop(0, 'hsl(' + h + ' 82% 55%)'); gg.addColorStop(1, 'hsl(' + ((h + 55) % 360) + ' 68% 24%)');
      cx.fillStyle = gg; cx.fillRect(x, y, s, s);
      cx.fillStyle = 'rgba(255,255,255,.92)'; cx.font = '800 110px system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(u.initials(c.title), W / 2, y + s / 2 + 6);
    }
    cx.restore();
    /* Text */
    cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
    cx.fillStyle = '#fff'; cx.font = '700 30px system-ui,sans-serif'; cx.fillText(fit(c.title, W - 40), W / 2, 380);
    cx.fillStyle = '#B3A4AB'; cx.font = '22px system-ui,sans-serif'; cx.fillText(fit(c.sub || '', W - 40), W / 2, 412);
    /* Fortschritt oder LIVE */
    if (P.isLive()) {
      cx.fillStyle = '#FF4D6D'; round(W / 2 - 46, 432, 92, 30, 15); cx.fill();
      cx.fillStyle = '#fff'; cx.font = '700 18px system-ui,sans-serif'; cx.fillText('LIVE', W / 2, 453);
    } else {
      var d = P.duration(), t = P.time();
      cx.fillStyle = 'rgba(255,255,255,.15)'; round(40, 444, W - 80, 8, 4); cx.fill();
      cx.fillStyle = '#FF3B4E'; round(40, 444, Math.max(8, (W - 80) * (d ? Math.min(1, t / d) : 0)), 8, 4); cx.fill();
    }
    if (!P.playing) { /* Pause-Zeichen */
      cx.fillStyle = 'rgba(0,0,0,.45)'; round(W / 2 - 40, y + s / 2 - 40, 80, 80, 40); cx.fill();
      cx.fillStyle = '#fff'; cx.fillRect(W / 2 - 15, y + s / 2 - 20, 10, 40); cx.fillRect(W / 2 + 5, y + s / 2 - 20, 10, 40);
    }
  }

  function ensureVid(){
    if (vid) return vid;
    vid = document.createElement('video');
    vid.muted = true; vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
    vid.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:.01;pointer-events:none;z-index:-1';  /* iPhone: muss im Bild sein */
    document.body.appendChild(vid);
    /* Play/Pause im Mini-Fenster steuert die echte Wiedergabe */
    vid.addEventListener('pause', function(){ if (G.pip.active() && P.playing) P.toggle(); else if (!G.pip.active()) setTimeout(function(){ vid.play().catch(function(){}); }, 0); });
    vid.addEventListener('play', function(){ if (G.pip.active() && !P.playing && P.cur) P.toggle(); });
    vid.addEventListener('leavepictureinpicture', stopLoop);
    vid.addEventListener('webkitpresentationmodechanged', function(){ if (vid.webkitPresentationMode !== 'picture-in-picture') stopLoop(); });
    return vid;
  }
  function stopLoop(){ clearInterval(timer); timer = null; }

  /* ---------- Öffnen / schließen ---------- */
  /* Mini-Fenster für Musik vorbereiten, sobald etwas läuft – dann kann es beim
     Tippen sofort aufgehen (Browser erlauben es nur direkt nach dem Tippen) */
  function prepare(){
    var c = P.cur;
    if (!c || c.kind === 'yt' || (c.kind === 'track' && c.isVideo) || !CAN_STREAM) return null;
    var v = ensureVid();
    try { if (!v.srcObject) v.srcObject = cv.captureStream(4); } catch (e) { return null; }
    draw();
    if (v.paused) v.play().catch(function(){});
    return v;
  }
  function fail(){ stopLoop(); u.toast('Das Mini-Fenster ließ sich hier nicht öffnen. Titel und Steuerung findest du auf dem Sperrbildschirm und im Kontrollzentrum.', true); }
  G.pip.toggle = function(){
    var c = P.cur;
    if (!c) return;
    try {
      if (mini) { mini.win.close(); return; }
      if (POPUP && c.kind !== 'yt' && !isVid(c)) { openMini(); return; }
      if (G.pip.active()) {
        if (document.exitPictureInPicture && document.pictureInPictureElement) { document.exitPictureInPicture().catch(function(){}); return; }
        var e = vid && vid.webkitPresentationMode === 'picture-in-picture' ? vid : P.mediaEl();
        if (e.webkitSetPresentationMode) e.webkitSetPresentationMode('inline');
        return;
      }
      if (c.kind === 'yt') { u.toast('YouTube erlaubt kein Mini-Fenster außerhalb der App.', true); return; }
      var target = (c.kind === 'track' && c.isVideo) ? P.mediaEl() : prepare();
      if (!target) { u.toast('Dein Browser kann für Musik kein Mini-Fenster zeigen. Titel und Steuerung findest du auf dem Sperrbildschirm.', true); return; }
      if (target === vid) { draw(); stopLoop(); timer = setInterval(draw, 500); }
      /* sofort und ohne Umweg aufrufen, sonst blockiert der Browser */
      if (target.requestPictureInPicture) {
        target.requestPictureInPicture().then(function(){ u.toast('Mini-Fenster offen – wechsle jetzt in eine andere App'); }).catch(fail);
      } else if (target.webkitSupportsPresentationMode && target.webkitSupportsPresentationMode('picture-in-picture')) {
        target.webkitSetPresentationMode('picture-in-picture');
      } else fail();
    } catch (err) { fail(); }
  };


  /* Beim Wechsel in eine andere App von selbst öffnen (Chrome/Android, wo erlaubt) */
  if ('mediaSession' in navigator) {
    try { navigator.mediaSession.setActionHandler('enterpictureinpicture', function(){ if (P.playing && G.pip.supported() && !G.pip.active()) G.pip.toggle(); }); } catch (e) {}
  }
  var mv = P.mediaEl(); try { mv.autoPictureInPicture = true; mv.setAttribute('autopictureinpicture', ''); } catch (e) {}

  /* Neuer Titel während das Mini-Fenster offen ist: Bild aktualisieren */
  S.on(function(w){ if (w !== 'player' && w !== 'meta') return; if (mini) { mini.update(); return; } if (w !== 'player') return; if (timer) draw(); else if (P.playing && !POPUP) prepare(); });
})();
