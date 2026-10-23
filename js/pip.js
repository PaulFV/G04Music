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
  G.pip = {
    supported: function(){
      var c = P.cur; if (!c || c.kind === 'yt') return false;
      if (c.kind === 'track' && c.isVideo) return hasPiP(P.mediaEl());
      return CAN_STREAM && hasPiP(testVid);
    },
    active: function(){ return !!(document.pictureInPictureElement || (vid && vid.webkitPresentationMode === 'picture-in-picture') || (P.mediaEl().webkitPresentationMode === 'picture-in-picture')); }
  };

  /* ---------- Bild zeichnen ---------- */
  function loadArt(c){
    if (!c.art || imgFor === c.art) return;
    imgFor = c.art; img = null;
    var im = new Image(); if (c.kind === 'radio') im.crossOrigin = 'anonymous';
    im.onload = function(){ if (imgFor === c.art) img = im; };
    im.src = c.art;
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
      if (c.kind === 'radio') { cx.fillStyle = '#fff'; cx.fillRect(x, y, s, s); cx.drawImage(img, x + 30, y + 30, s - 60, s - 60); }
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
  S.on(function(w){ if (w !== 'player') return; if (timer) draw(); else if (P.playing) prepare(); });
})();
