/* ============================================================
   G04Musik — YouTube: Links lesen, eingebetteter Player
   Gesteuert über die postMessage-Schnittstelle des Players
   (ohne die externe IFrame-API-Datei).
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;

  function parse(input){
    var s=String(input||'').trim();
    if(/^[\w-]{11}$/.test(s)) return {ytType:'video',ytId:s};
    var url; try{ url=new URL(s.indexOf('://')<0?'https://'+s:s); }catch(e){ return null; }
    var host=url.hostname.replace(/^www\.|^m\.|^music\./,'');
    var list=url.searchParams.get('list'), v=url.searchParams.get('v');
    if(host==='youtu.be'){ v=url.pathname.slice(1).split('/')[0]; }
    else if(host==='youtube.com'||host==='youtube-nocookie.com'){
      var m=url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/); if(m) v=m[2];
    } else return null;
    if(v&&/^[\w-]{11}$/.test(v)) return {ytType:'video',ytId:v,list:list||''};
    if(list) return {ytType:'list',ytId:list};
    return null;
  }

  function toItem(p,meta){
    meta=meta||{};
    return {
      kind:'yt', id:(p.ytType==='list'?'l:':'v:')+p.ytId, ytType:p.ytType, ytId:p.ytId,
      title:meta.title||(p.ytType==='list'?'YouTube-Playlist':'YouTube-Video'),
      sub:(meta.author_name||'YouTube')+(p.ytType==='list'?' · Playlist':''),
      art:meta.thumbnail_url||(p.ytType==='video'?'https://i.ytimg.com/vi/'+p.ytId+'/hqdefault.jpg':'')
    };
  }

  /* Titel und Bild über noembed.com (erlaubt Abrufe aus dem Browser) */
  function meta(p){
    var watch = p.ytType==='list' ? 'https://www.youtube.com/playlist?list='+p.ytId : 'https://www.youtube.com/watch?v='+p.ytId;
    return fetch('https://noembed.com/embed?url='+encodeURIComponent(watch)).then(function(r){ return r.json(); })
      .then(function(j){ return j&&!j.error? j : {}; }).catch(function(){ return {}; });
  }

  /* ---------- Player ---------- */
  var frame=null, state={playing:false,time:0,duration:0,ready:false}, onState=null;
  function send(func,args){
    if(!frame||!frame.contentWindow) return;
    try{ frame.contentWindow.postMessage(JSON.stringify({event:'command',func:func,args:args||[]}),'*'); }catch(e){}
  }
  window.addEventListener('message',function(e){
    if(!frame||e.source!==frame.contentWindow) return;
    var d; try{ d=typeof e.data==='string'?JSON.parse(e.data):e.data; }catch(x){ return; }
    if(!d||!d.event) return;
    if(d.event==='onReady'){ state.ready=true; }
    var info=d.info;
    if(d.event==='onStateChange'&&typeof info==='number') info={playerState:info};
    if(d.event==='onError'){ if(onState) onState({error:info}); return; }
    if(info&&typeof info==='object'){
      if(typeof info.playerState==='number'){
        state.playing = info.playerState===1 || info.playerState===3;
        if(info.playerState===0&&onState) onState({ended:true});
      }
      if(typeof info.currentTime==='number') state.time=info.currentTime;
      if(typeof info.duration==='number'&&info.duration>0) state.duration=info.duration;
      if(info.videoData&&info.videoData.title) state.title=info.videoData.title;
      if(onState) onState(state);
    }
  });

  G.yt = {
    parse:parse, toItem:toItem, meta:meta, state:state,
    onState:function(fn){ onState=fn; },
    mount:function(host,it,volume){
      G.yt.unmount(host);
      state.playing=false; state.time=0; state.duration=0; state.ready=false; state.title='';
      var origin = /^https?:/.test(location.protocol) ? '&origin='+encodeURIComponent(location.origin) : '';
      var src = it.ytType==='list'
        ? 'https://www.youtube-nocookie.com/embed/videoseries?list='+encodeURIComponent(it.ytId)
        : 'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(it.ytId)+'?x=1';
      src += (src.indexOf('?')<0?'?':'&')+'enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1'+origin;
      frame=document.createElement('iframe');
      frame.src=src; frame.title=it.title;
      frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen=true;
      frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.addEventListener('load',function(){
        try{ frame.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'*'); }catch(e){}
        setTimeout(function(){ send('setVolume',[Math.round((volume==null?1:volume)*100)]); },800);
      });
      host.appendChild(frame);
    },
    unmount:function(host){ if(frame){ send('stopVideo'); frame.remove(); frame=null; } if(host) host.innerHTML=''; },
    play:function(){ send('playVideo'); },
    pause:function(){ send('pauseVideo'); },
    next:function(){ send('nextVideo'); },
    prev:function(){ send('previousVideo'); },
    seek:function(t){ send('seekTo',[t,true]); },
    volume:function(v){ send('setVolume',[Math.round(v*100)]); },
    active:function(){ return !!frame; }
  };
})();
