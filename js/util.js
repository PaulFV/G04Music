/* ============================================================
   G04Musik — Hilfen: DOM, Formate, Symbole, Meldungen, Blatt
   ============================================================ */
(function(){
  'use strict';
  var G = window.G = window.G || {};
  G.VERSION = '0.2.1';

  var u = G.u = {};
  u.$ = function(s,r){ return (r||document).querySelector(s); };
  u.$$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  u.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  u.fmt = function(s){
    if(!isFinite(s)||s<0) return '–:––';
    s=Math.floor(s); var h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
    return (h? h+':'+String(m).padStart(2,'0') : m)+':'+String(x).padStart(2,'0');
  };
  u.bytes = function(n){ if(!n) return '0 MB'; var mb=n/1048576; return mb>=1024? (mb/1024).toFixed(1).replace('.',',')+' GB' : (mb<10? mb.toFixed(1).replace('.',','):Math.round(mb))+' MB'; };
  u.hue = function(str){ var h=0; str=String(str||''); for(var i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0; return h%360; };
  u.grad = function(str){ var h=u.hue(str); return 'linear-gradient(140deg,hsl('+h+' 82% 55%),hsl('+((h+55)%360)+' 68% 28%) 70%,hsl('+((h+95)%360)+' 58% 13%))'; };
  u.initials = function(t){
    var w=String(t||'?').replace(/[^\p{L}\p{N} ]/gu,' ').split(/\s+/).filter(Boolean);
    return (w.length? w.slice(0,2).map(function(x){return x[0];}).join('') : '♪').toUpperCase();
  };
  /* Hintergrund für Cover: Bild oder Verlauf mit Initialen */
  u.artStyle = function(item){
    if(item && item.art) return 'background-image:url(&quot;'+u.esc(item.art)+'&quot;)';
    return 'background-image:'+u.grad(item&&item.title);
  };
  u.artText = function(item){ return item && item.art ? '' : u.esc(u.initials(item&&item.title)); };
  u.debounce = function(fn,ms){ var t; return function(){ var a=arguments,s=this; clearTimeout(t); t=setTimeout(function(){fn.apply(s,a);},ms); }; };
  u.uid = function(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); };

  /* ---------- localStorage, abgesichert ---------- */
  u.ls = {
    get:function(k,d){ try{ var v=localStorage.getItem('g04musik.'+k); return v==null? d : JSON.parse(v); }catch(e){ return d; } },
    set:function(k,v){ try{ localStorage.setItem('g04musik.'+k, JSON.stringify(v)); return true; }catch(e){ return false; } },
    del:function(k){ try{ localStorage.removeItem('g04musik.'+k); }catch(e){} }
  };

  /* ---------- Symbole ---------- */
  var I = {
    home:'<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
    music:'<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    video:'<rect x="3" y="5" width="13" height="14" rx="2.5"/><path d="M16 10l5-3v10l-5-3"/>',
    radio:'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="15.5" cy="14" r="2.5"/><path d="M6 12h4M6 16h4"/>',
    yt:'<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    play:'<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" stroke="none"/>',
    pause:'<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    prev:'<path d="M18 6v12l-9-6z" fill="currentColor" stroke="none"/><path d="M6 6v12"/>',
    next:'<path d="M6 6v12l9-6z" fill="currentColor" stroke="none"/><path d="M18 6v12"/>',
    shuffle:'<path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c1.6 0 2.8-1.5 3.9-3.4M14 9.7C15 8.2 15.9 7 18 7h3M18 4l3 3-3 3M18 14l3 3-3 3"/>',
    repeat:'<path d="M4 12V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 12v3a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/>',
    repeat1:'<path d="M4 12V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 12v3a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/><path d="M11.5 10.5l1.5-1v5"/>',
    star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    starF:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    vol:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    chev:'<path d="M9 6l6 6-6 6"/>',
    album:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/>',
    globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.4-3.7-8.5s1.2-5.9 3.7-8.5z"/>',
    info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h0"/>',
    disk:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 15h10"/>',
    tiles:'<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    rows:'<rect x="4" y="5" width="4" height="4" rx="1"/><rect x="4" y="15" width="4" height="4" rx="1"/><path d="M11 7h9M11 17h9"/>',
    queue:'<path d="M4 6h12M4 12h12M4 18h8"/><path d="M17 15l4 3-4 3z" fill="currentColor"/>'
  };
  u.ic = function(n,s,w){ return '<svg viewBox="0 0 24 24" width="'+(s||20)+'" height="'+(s||20)+'" fill="none" stroke="currentColor" stroke-width="'+(w||1.9)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(I[n]||'')+'</svg>'; };

  /* ---------- Meldungen ---------- */
  u.toast = function(msg,err){
    var host=u.$('#toasts'); if(!host) return;
    var t=document.createElement('div'); t.className='toast glass'+(err?' toast--err':''); t.textContent=msg;
    host.appendChild(t); while(host.children.length>3) host.firstChild.remove();
    setTimeout(function(){ t.remove(); }, err?4200:2600);
  };

  /* ---------- Blatt (Dialog) ---------- */
  var lastFocus=null;
  u.sheet = function(title,html,onMount){
    lastFocus=document.activeElement;
    u.$('#sheetTitle').textContent=title;
    u.$('#sheetBody').innerHTML=html;
    u.$('#scrim').hidden=false; u.$('#sheet').hidden=false;
    if(onMount) onMount(u.$('#sheetBody'));
    var f=u.$('#sheetBody input,#sheetBody button'); if(f) setTimeout(function(){ try{f.focus({preventScroll:true});}catch(e){} },60);
  };
  u.closeSheet = function(){
    u.$('#scrim').hidden=true; u.$('#sheet').hidden=true; u.$('#sheetBody').innerHTML='';
    if(lastFocus&&lastFocus.focus) try{ lastFocus.focus({preventScroll:true}); }catch(e){}
  };
  /* Bestätigung im Blatt (kein confirm(), das blockiert auf Handys) */
  u.confirm = function(title,text,okLabel,cb){
    u.sheet(title,'<p>'+u.esc(text)+'</p><div class="btn-row" style="justify-content:flex-end;margin-top:6px"><button class="btn btn--ghost" data-c="0" type="button">Abbrechen</button><button class="btn btn--danger" data-c="1" type="button">'+u.esc(okLabel)+'</button></div>',function(b){
      b.addEventListener('click',function(e){ var x=e.target.closest('[data-c]'); if(!x) return; u.closeSheet(); if(x.dataset.c==='1') cb(); });
    });
  };

  /* ---------- Langes Drücken (Handy) und Rechtsklick (Desktop) ---------- */
  u.onLongPress = function(root,selector,cb){
    var timer=null, fired=false, sx=0, sy=0;
    root.addEventListener('pointerdown',function(e){
      var el=e.target.closest(selector); if(!el||e.button>0) return;
      fired=false; sx=e.clientX; sy=e.clientY;
      timer=setTimeout(function(){ fired=true; if(navigator.vibrate) try{navigator.vibrate(12);}catch(x){} cb(el); },520);
    });
    root.addEventListener('pointermove',function(e){ if(timer&&(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)){ clearTimeout(timer); timer=null; } });
    ['pointerup','pointercancel','pointerleave'].forEach(function(n){ root.addEventListener(n,function(){ clearTimeout(timer); timer=null; }); });
    root.addEventListener('click',function(e){ if(fired){ e.stopPropagation(); e.preventDefault(); fired=false; } },true);
    root.addEventListener('contextmenu',function(e){ var el=e.target.closest(selector); if(!el) return; e.preventDefault(); clearTimeout(timer); cb(el); });
  };
})();
