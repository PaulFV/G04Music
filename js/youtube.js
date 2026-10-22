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


  /* ---------- Suche ----------
     1. Mit eigenem Schlüssel (YouTube Data API v3) – am zuverlässigsten
     2. Sonst freie Ersatz-Server (Piped, Invidious) – meist erreichbar
     Gibt Einträge wie toItem zurück, zusätzlich mit Länge. */
  var PIPED=['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://api.piped.private.coffee'];
  var INV=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yewtu.be'];
  function timed(url,ms){
    var ctl=('AbortController' in window)?new AbortController():null, t=setTimeout(function(){ if(ctl) ctl.abort(); },ms||7000);
    return fetch(url,{signal:ctl?ctl.signal:undefined}).then(function(r){ clearTimeout(t); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); },function(e){ clearTimeout(t); throw e; });
  }
  function decodeHtml(s){ var t=document.createElement('textarea'); t.innerHTML=s||''; return t.value; }
  function vid(id,title,author,thumb,dur){
    var it=toItem({ytType:'video',ytId:id},{title:title,author_name:author,thumbnail_url:thumb||('https://i.ytimg.com/vi/'+id+'/mqdefault.jpg')});
    if(dur) it.duration=dur; return it;
  }
  function viaKey(q,key){
    return timed('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=24&q='+encodeURIComponent(q)+'&key='+encodeURIComponent(key),9000).then(function(j){
      return (j.items||[]).filter(function(x){ return x.id&&x.id.videoId; }).map(function(x){
        var sn=x.snippet||{}; return vid(x.id.videoId,decodeHtml(sn.title),decodeHtml(sn.channelTitle),sn.thumbnails&&sn.thumbnails.medium&&sn.thumbnails.medium.url);
      });
    });
  }
  function viaPiped(q,i){
    if(i>=PIPED.length) return Promise.reject(new Error('piped'));
    return timed(PIPED[i]+'/search?q='+encodeURIComponent(q)+'&filter=videos').then(function(j){
      var out=(j.items||[]).filter(function(x){ return x.url&&x.url.indexOf('/watch?v=')===0; }).map(function(x){
        return vid(x.url.split('v=')[1].slice(0,11),x.title,x.uploaderName,x.thumbnail,x.duration>0?x.duration:0);
      });
      if(!out.length) throw new Error('leer'); return out;
    }).catch(function(){ return viaPiped(q,i+1); });
  }
  function viaInv(q,i){
    if(i>=INV.length) return Promise.reject(new Error('invidious'));
    return timed(INV[i]+'/api/v1/search?type=video&q='+encodeURIComponent(q)).then(function(j){
      var out=(j||[]).filter(function(x){ return x.type==='video'&&x.videoId; }).map(function(x){
        return vid(x.videoId,x.title,x.author,null,x.lengthSeconds||0);
      });
      if(!out.length) throw new Error('leer'); return out;
    }).catch(function(){ return viaInv(q,i+1); });
  }
  function search(q){
    var key=G.u.ls.get('ytKey','');
    var free=function(){ return viaPiped(q,0).catch(function(){ return viaInv(q,0); }); };
    return key ? viaKey(q,key).catch(free) : free();
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
    parse:parse, toItem:toItem, meta:meta, state:state, search:search,
    resultsUrl:function(q){ return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q); },
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
