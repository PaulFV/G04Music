/* ============================================================
   G04Musik — Titel, Künstler, Album und Cover aus Dateien lesen
   ID3v2.2/2.3/2.4 (MP3) und MP4-Atome (M4A/MP4: ©nam, ©ART, ©alb, covr).
   Ohne Bibliothek; was nicht lesbar ist, kommt aus dem Dateinamen.
   ============================================================ */
(function(){
  'use strict';
  var G = window.G;

  function readSlice(file,start,end){
    return new Promise(function(res,rej){
      var fr=new FileReader();
      fr.onload=function(){ res(new Uint8Array(fr.result)); };
      fr.onerror=function(){ rej(fr.error); };
      fr.readAsArrayBuffer(file.slice(start,end));
    });
  }
  function syncsafe(b,o){ return (b[o]&127)<<21|(b[o+1]&127)<<14|(b[o+2]&127)<<7|(b[o+3]&127); }
  function u32(b,o){ return (b[o]<<24|b[o+1]<<16|b[o+2]<<8|b[o+3])>>>0; }

  function decode(bytes,enc){
    try{
      if(enc===0) return new TextDecoder('iso-8859-1').decode(bytes);
      if(enc===1){
        if(bytes[0]===0xFE&&bytes[1]===0xFF) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
        if(bytes[0]===0xFF&&bytes[1]===0xFE) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
        return new TextDecoder('utf-16le').decode(bytes);
      }
      if(enc===2) return new TextDecoder('utf-16be').decode(bytes);
      return new TextDecoder('utf-8').decode(bytes);
    }catch(e){ return ''; }
  }
  function clean(s){ return String(s||'').replace(/\u0000+$/,'').split('\u0000')[0].trim(); }
  /* Ende eines nullterminierten Textes (1 oder 2 Nullbytes je nach Kodierung) */
  function nullEnd(b,o,enc){
    if(enc===1||enc===2){ for(var i=o;i+1<b.length;i+=2) if(b[i]===0&&b[i+1]===0) return i; return b.length; }
    for(var j=o;j<b.length;j++) if(b[j]===0) return j; return b.length;
  }

  function parseID3(b){
    var out={};
    var ver=b[3], flags=b[5], size=syncsafe(b,6), pos=10, end=Math.min(b.length,10+size);
    if(flags&0x40){ /* erweiterter Kopf */
      var ext = ver===4 ? syncsafe(b,10) : u32(b,10)+4; pos+=ext;
    }
    var idLen = ver===2?3:4, hdr = ver===2?6:10;
    while(pos+hdr<end){
      var id=String.fromCharCode.apply(null,b.subarray(pos,pos+idLen));
      if(!/^[A-Z0-9]{3,4}$/.test(id)) break;
      var fs = ver===2 ? (b[pos+3]<<16|b[pos+4]<<8|b[pos+5]) : (ver===4 ? syncsafe(b,pos+4) : u32(b,pos+4));
      var d=b.subarray(pos+hdr,pos+hdr+fs);
      pos+=hdr+fs;
      if(!fs||!d.length) continue;
      var enc=d[0];
      if(id==='TIT2'||id==='TT2') out.title=clean(decode(d.subarray(1),enc));
      else if(id==='TPE1'||id==='TP1') out.artist=clean(decode(d.subarray(1),enc));
      else if(id==='TALB'||id==='TAL') out.album=clean(decode(d.subarray(1),enc));
      else if(id==='TPE2'||id==='TP2') out.albumArtist=clean(decode(d.subarray(1),enc));
      else if(id==='TPOS'||id==='TPA') out.disc=parseInt(clean(decode(d.subarray(1),enc)),10)||0;
      else if(id==='TRCK'||id==='TRK') out.track=parseInt(clean(decode(d.subarray(1),enc)),10)||0;
      else if(id==='TYER'||id==='TDRC'||id==='TYE') out.year=clean(decode(d.subarray(1),enc)).slice(0,4);
      else if((id==='APIC'||id==='PIC')&&!out.cover){
        var p=1, mime;
        if(id==='PIC'){ mime = (String.fromCharCode(d[1],d[2],d[3]).toUpperCase()==='PNG')?'image/png':'image/jpeg'; p=4; }
        else { var me=nullEnd(d,1,0); mime=new TextDecoder('iso-8859-1').decode(d.subarray(1,me))||'image/jpeg'; p=me+1; }
        p+=1; /* Bildart */
        var de=nullEnd(d,p,enc); p = de + ((enc===1||enc===2)?2:1);
        if(mime.indexOf('/')<0) mime='image/'+mime.toLowerCase().replace('jpg','jpeg');
        if(p<d.length) out.cover=new Blob([d.slice(p)],{type:mime});
      }
    }
    return out;
  }

  /* MP4/M4A: moov > udta > meta > ilst */
  function parseMP4(b,base){
    var out={};
    function walk(start,end,depth){
      var p=start;
      while(p+8<=end){
        var size=u32(b,p), type=String.fromCharCode(b[p+4],b[p+5],b[p+6],b[p+7]);
        if(size<8||p+size>end) break;
        var body=p+8;
        if(type==='moov'||type==='udta'||type==='ilst'||type==='trak'||type==='mdia') walk(body,p+size,depth+1);
        else if(type==='meta') walk(body+4,p+size,depth+1);
        else if(depth>0 && (type==='©nam'||type==='©ART'||type==='©alb'||type==='aART'||type==='covr'||type==='trkn')){
          /* darin ein "data"-Atom: 8 Kopf + 8 (Typ/Locale) */
          var dsz=u32(b,body), dtype=u32(b,body+8), data=b.subarray(body+16,body+dsz);
          if(type==='covr'&&!out.cover) out.cover=new Blob([data.slice()],{type:dtype===14?'image/png':'image/jpeg'});
          else if(type==='trkn') out.track=(data[2]<<8|data[3])||0;
          else {
            var s=new TextDecoder('utf-8').decode(data).trim();
            if(type==='©nam') out.title=s; else if(type==='©ART') out.artist=s; else if(type==='aART'){ out.albumArtist=s; if(!out.artist) out.artist=s; } else if(type==='©alb') out.album=s;
          }
        }
        p+=size;
      }
    }
    walk(0,b.length,0);
    return out;
  }

  /* Aus "Künstler - Titel.mp3" das Beste machen */
  function fromName(name){
    var base=String(name||'').replace(/\.[^.]+$/,'').replace(/_/g,' ').replace(/^\d{1,3}[\s.\-]+/,'').trim();
    var m=base.split(/\s+[-–—]\s+/);
    return m.length>=2 ? {artist:m[0].trim(),title:m.slice(1).join(' - ').trim()} : {title:base};
  }

  G.tags = {
    fromName:fromName,
    read:function(file){
      var name=fromName(file.name);
      return readSlice(file,0,16).then(function(h){
        /* ID3 am Anfang */
        if(h[0]===0x49&&h[1]===0x44&&h[2]===0x33){
          var size=syncsafe(h,6)+10;
          return readSlice(file,0,Math.min(file.size,size)).then(parseID3);
        }
        /* MP4: "ftyp" an Stelle 4 → moov suchen (vorne oder hinten) */
        if(String.fromCharCode(h[4],h[5],h[6],h[7])==='ftyp'){
          return findMoov(file).then(function(b){ return b? parseMP4(b):{}; });
        }
        return {};
      }).catch(function(){ return {}; }).then(function(t){
        return {
          title:t.title||name.title, artist:t.artist||name.artist||'', album:t.album||'',
          track:t.track||0, year:t.year||'', cover:t.cover||null, albumArtist:t.albumArtist||'', disc:t.disc||0
        };
      });
    }
  };

  /* moov-Atom finden, ohne die ganze Datei zu lesen */
  function findMoov(file){
    var p=0, guard=0;
    function step(){
      if(p+8>file.size||guard++>64) return Promise.resolve(null);
      return readSlice(file,p,p+16).then(function(h){
        var size=u32(h,0), type=String.fromCharCode(h[4],h[5],h[6],h[7]);
        if(size===1){ size=u32(h,8)*4294967296+u32(h,12); }
        if(size===0) size=file.size-p;
        if(type==='moov'){
          if(size>40*1048576) return null;
          return readSlice(file,p,p+size).then(function(b){ return b; });
        }
        if(size<8) return null;
        p+=size; return step();
      });
    }
    return step();
  }
})();
