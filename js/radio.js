/* ============================================================
   G04Musik — Radio über die freie Radio-Browser-Schnittstelle
   https://www.radio-browser.info  (kein Konto, kein Schlüssel)
   ============================================================ */
(function(){
  'use strict';
  var G = window.G, u = G.u;

  var SERVERS = ['de1.api.radio-browser.info','de2.api.radio-browser.info','fi1.api.radio-browser.info','nl1.api.radio-browser.info','at1.api.radio-browser.info'];
  var server = u.ls.get('radioServer', SERVERS[0]);
  var secure = location.protocol === 'https:';

  function get(path){
    var order=[server].concat(SERVERS.filter(function(s){ return s!==server; }));
    var i=0;
    function attempt(){
      if(i>=order.length) return Promise.reject(new Error('Kein Radio-Server erreichbar'));
      var host=order[i++], ctl=('AbortController' in window)? new AbortController():null;
      var t=setTimeout(function(){ if(ctl) ctl.abort(); },8000);
      return fetch('https://'+host+path,{signal:ctl?ctl.signal:undefined}).then(function(r){
        clearTimeout(t); if(!r.ok) throw new Error('HTTP '+r.status);
        if(host!==server){ server=host; u.ls.set('radioServer',host); }
        return r.json();
      }).catch(function(e){ clearTimeout(t); return attempt(); });
    }
    return attempt();
  }

  function toItem(st){
    var tags=(st.tags||'').split(',').map(function(x){return x.trim();}).filter(Boolean);
    var fav=st.favicon||'';
    if(secure && fav.indexOf('http://')===0) fav=''; /* gemischte Inhalte vermeiden */
    return {
      kind:'radio', id:st.stationuuid, title:(st.name||'Sender').trim(),
      sub:[tags.slice(0,2).join(', '), st.country||st.countrycode].filter(Boolean).join(' · '),
      art:fav, url:st.url_resolved||st.url, hls:!!st.hls, tags:tags.slice(0,4).join(', '),
      country:st.countrycode||'', codec:st.codec||'', bitrate:st.bitrate||0
    };
  }
  function query(params){
    var p=Object.assign({hidebroken:'true',order:'clickcount',reverse:'true',limit:'60'},params);
    if(secure) p.is_https='true';
    Object.keys(p).forEach(function(k){ if(p[k]===''||p[k]==null) delete p[k]; });
    var qs=Object.keys(p).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(p[k]); }).join('&');
    return get('/json/stations/search?'+qs).then(function(list){
      var seen={};
      return (list||[]).map(toItem).filter(function(it){
        var k=it.title.toLowerCase(); if(seen[k]||!it.url) return false; seen[k]=1; return true;
      });
    });
  }

  G.radio = {
    COUNTRIES:[['DE','Deutschland'],['AT','Österreich'],['CH','Schweiz'],['','Weltweit']],
    GENRES:[['','Beliebt'],['pop','Pop'],['rock','Rock'],['news','Nachrichten'],['electronic','Electronic'],['chillout','Chill'],['jazz','Jazz'],['classical','Klassik'],['schlager','Schlager'],['hiphop','Hip-Hop'],['80s','80er'],['90s','90er']],
    top:function(cc,tag){ return query({countrycode:cc||'',tag:tag||'',tagExact:tag?'true':''}); },
    search:function(name,cc){ return query({name:name,countrycode:cc||'',order:'votes'}); },
    /* Aufruf zählen (bittet die Schnittstelle so) – Fehler egal */
    click:function(it){ get('/json/url/'+encodeURIComponent(it.id)).catch(function(){}); }
  };
})();
