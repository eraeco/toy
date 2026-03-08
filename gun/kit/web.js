;(function(){
var W = window, D = document, SW = screen.width, SH = screen.height, ON = 'addEventListener', HI = 'createElement', ID = 'getElementById', U, DEV = ('file://'===location.origin);
;(function(){ if(screen.width > screen.height){ return } // phone only debug
  var add = function(){ if(console.view){ return } (console.view = document[HI]('textarea')).style="position:fixed; z-index:99999; inset:0; width:100%; height:4em; padding: 0; background:rgba(100%,100%,100%,0.8); color:black; transition: 0.5s all; white-space: pre-wrap; overflow-wrap: break-word; word-break: break-all;"; console.view.readOnly = 1; setTimeout(function(){D.body.appendChild(console.view);},99); console.view.onclick = function(eve){ console.view.style.height = ('4em'==console.view.style.height)?'50vh':'4em' ; console.view.select(); D.execCommand('copy'); navigator.clipboard.writeText(console.view.value) } }
  console.log = console.warn = console.error = function(...args){ if(console.off){ return } add(); console.view.value += JSON.stringify(args).slice(1,-1); console.view.scrollTop = console.view.scrollHeight; }
  window.onerror = window.onunhandledrejection = console.log;
}());
var tmp = D[HI]('meta'); tmp.name = 'viewport'; tmp.content = 'width=device-width, initial-scale=1, interactive-widget=resizes-content'; D.head.appendChild(tmp);
//(tmp=D[HI]('link')).rel="stylesheet"; tmp.href=((D.currentScript||'').src||'').replace('.js','.css'); D.head.appendChild(tmp); // auto-add CSS?
tmp = D.head.parentNode.style; if(W.parent === W) { tmp['overscroll-behavior-y'] = 'contain'; tmp['background-color'] = 'var(--fill)'; } else { tmp['overflow-y'] = 'auto'; tmp['overscroll-behavior-y'] = 'auto'; } 
function LOAD(src, h, s){ (s = D[HI]('script')).onload = h; s.src = src; D.head.appendChild(s) };
function MAP(scroll, screen){ return (scroll / screen)>>0 }; // scroll, screen
kit = function(){};
// dip, dive, into, eat, lid, tin, key, face
kit.ear = function(h,e,v){ (v=v||W)[ON](e=(h.call?(h.where=e):(e.where=h,(h=e).where))||'',h); h.off = function(){ v.removeEventListener(e,h) }; W===v&&kit.up(e,'ear'); return h; };
kit.say = function(d,e,v,s){ (v=v||W).dispatchEvent(new CustomEvent(e=e||'',{detail:d,bubbles:true})); !s&&(W===v)&&kit.up(d,e) };
kit.up = function up(data,type,tmp){
  if(W === W.parent){ return }
  if(U === data){ return } // TODO: BUG? maybe allow?
  if('message' == type){ return }
  //console.log(location.pathname.split('/').slice(-1)[0], "SENDING UP", type, data);
  W.parent.postMessage({detail:data,type:type,wrap:1},DEV?'*':location.origin);
}
W[ON]('message',function(eve,data,i,tmp){
  if(W === eve.source){ return }
  if(eve.origin !== (DEV?'null':location.origin)){//.replace('file://','')||'null')){
    eve.preventDefault();
    eve.stopImmediatePropagation();
    eve.stopPropagation();
    return;
  }
  if(U === (data = eve.data||eve.detail)){ return } // TODO: BUG? maybe allow?
  if(!(i = kit.views.get(eve.source))){ // no iframe view? then message coming down to us from above.
    //console.log(location.pathname.split('/').slice(-1)[0], "GOT FROM ABOVE:", eve);
    kit.say(data.data||data.detail,data.type,0,1);
    return;
  }
  if('ear'==data.type){ kit.ear(data.detail||data.data,function hear(eve){ if(!(i||'').contentWindow){hear.off(); return } if(kit._echo && kit._echo.i === i && kit._echo.t === eve.type){ return } i.contentWindow.postMessage({data:eve.detail||eve.data,type:eve.type,wrap:-1}, DEV?'*':location.origin) }); return; }
  kit._echo = {i:i,t:data.type}; kit.say(data.data||data.detail,data.type,i); kit._echo = null;
});
kit.views = new Map;
(kit.size = function(b,d,h,w,last){
  b = D.body; d = D.documentElement;
  h = Math.max(
    ((b||'').scrollHeight)||0, ((d||'').scrollHeight)||0,
    ((b||'').offsetHeight)||0, ((d||'').offsetHeight)||0,
    ((b||'').clientHeight)||0, ((d||'').clientHeight)||0
  );
  w = Math.max(
    ((b||'').scrollWidth)||0, ((d||'').scrollWidth)||0,
    ((b||'').offsetWidth)||0, ((d||'').offsetWidth)||0,
    ((b||'').clientWidth)||0, ((d||'').clientWidth)||0
  );
  if((b||'').children && b.children.length){
    last = b.children[b.children.length - 1];
    h = Math.max(h, kit.watch.low(last), kit.watch.low(b));
    w = Math.max(w, kit.watch.wide(last), kit.watch.wide(b));
  }
  return {height: Math.ceil(h), width: Math.ceil(w)};
});
kit.watch = {};
kit.watch.resize = function(){
  if(kit.watch.wait){ return }
  kit.watch.wait = W.requestAnimationFrame(function(){
    kit.watch.wait = 0;
    kit.up(kit.size(),'style');
  });
};
(kit.watch.observer = new MutationObserver(function(eve,b,low){eve.forEach(function(changes){changes.addedNodes.forEach(function(node){ //console.log("observed change on", node);
  node.dispatchEvent(new CustomEvent('join '+node.nodeName.toLowerCase(), {bubbles:true}));
  node.dispatchEvent(new CustomEvent('join', {bubbles:true}));
  //low = kit.watch.low(node, low); 
})});
  //console.log(location.pathname.split('/').slice(-1)[0], "LOWEST", low, kit.watch.low(D.body), D.body.scrollHeight);
  kit.watch.resize();
})).observe(D.documentElement||D,{childList:true,subtree:true,characterData:true});

kit.watch.low = function(v,l,f){ f='getBoundingClientRect'; return Math.max(((v[f]?v[f]():'').bottom||0) + (W.pageYOffset || D.documentElement.scrollTop),l||0) }
kit.watch.wide = function(v,l,f){ f='getBoundingClientRect'; return Math.max(((v[f]?v[f]():'').right||0) + (W.pageXOffset || D.documentElement.scrollLeft),l||0) }
kit.frame = {};
kit.frame.visible = function(i, r, s){
  if(!i || !i.isConnected){ return 0 }
  r = i.getBoundingClientRect();
  if(!r || r.width < 2 || r.height < 2){ return 0 }
  s = W.getComputedStyle(i);
  if(!s || s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0'){ return 0 }
  return 1;
};
kit.frame.active = function(vw, vh, best, bestZ, bestI, r, s, z){
  var hash = (location.hash || '').replace(/^#/, ''), byHash;
  if(hash && (byHash = D.getElementById(hash)) && byHash.tagName === 'IFRAME' && kit.frame.visible(byHash)){ return byHash }
  best = D.querySelector('iframe.main.page') || D.querySelector('iframe.main') || D.querySelector('iframe.page');
  if(best && kit.frame.visible(best)){ return best }
  vw = W.innerWidth || D.documentElement.clientWidth || 0;
  vh = W.innerHeight || D.documentElement.clientHeight || 0;
  D.querySelectorAll('iframe').forEach(function(i, idx){
    var area, visW, visH;
    if(!kit.frame.visible(i)){ return }
    r = i.getBoundingClientRect();
    visW = Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left));
    visH = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
    area = visW * visH;
    if(area <= 0){ return }
    s = W.getComputedStyle(i);
    z = parseInt(s.zIndex, 10);
    z = isNaN(z) ? 0 : z;
    if(!best || z > bestZ || (z === bestZ && area > bestI) || (z === bestZ && area === bestI && idx > (best && best.__kitIdx || -1))){
      best = i;
      bestZ = z;
      bestI = area;
      best.__kitIdx = idx;
    }
  });
  return best || null;
};
kit.frame.isMain = function(i){
  return !!(i && i === kit.frame.active());
};
kit.frame.setMainScroll = function(i,d,b){
  try{
    d = i && i.contentDocument; if(!d){ return }
    i._kitSubLocked = 0;
    b = d.body || d.documentElement;
    d.documentElement.style.overflow = '';
    d.documentElement.style.overscrollBehavior = '';
    if(b){
      b.style.overflow = '';
      b.style.overscrollBehavior = '';
      b.style.touchAction = '';
    }
    i.style.overscrollBehavior = '';
    i.style.touchAction = '';
  }catch(e){}
};
kit.frame.setSubScroll = function(i,d,b){
  try{
    d = i && i.contentDocument; if(!d){ return }
    i._kitSubLocked = 1;
    b = d.body || d.documentElement;
    d.documentElement.style.overflow = 'hidden';
    d.documentElement.style.overscrollBehavior = '';
    if(b){
      b.style.overflow = 'hidden';
      b.style.overscrollBehavior = '';
      b.style.touchAction = '';
    }
    i.style.overscrollBehavior = '';
    i.style.touchAction = '';
  }catch(e){}
};
kit.frame.refresh = function(){
  D.querySelectorAll('iframe').forEach(function(i){
    if(kit.frame.isMain(i)){ kit.frame.setMainScroll(i) }
    else { kit.frame.setSubScroll(i) }
  });
};
kit.frame.lockScroll = function(i,d,b,w,y){
  if(!i){ return }
  function apply(){
    try{
      d = i.contentDocument; w = i.contentWindow;
      if(!d || !w){ return }
      if(kit.frame.isMain(i)){ kit.frame.setMainScroll(i) }
      else { kit.frame.setSubScroll(i) }
    }catch(e){}
  }
  apply();
  i.addEventListener('load', apply);
};
kit.ear('join iframe',kit.add=function(eve){
  //console.log(location.pathname.split('/').slice(-1)[0], "JOIN");
  kit.views.set(eve.target.contentWindow, eve.target);
  kit.frame.lockScroll(eve.target);
  kit.frame.refresh();
});
W[ON]('hashchange', kit.frame.refresh);
W[ON]('load', kit.watch.resize);
W[ON]('resize', kit.watch.resize);
W[ON]('pageshow', kit.watch.resize);
W[ON]('transitionend', kit.watch.resize, true);
W[ON]('animationend', kit.watch.resize, true);
if((D.fonts||'').ready){ D.fonts.ready.then(kit.watch.resize) }
kit.ear('style',function(eve,i){
  if(!eve.target || !eve.target.style){ return }
  //console.log(location.pathname.split('/').slice(-1)[0], "resize:", eve.target, eve.detail);
  var h = (eve.detail||'').height; if(h) eve.target.style.height = isNaN(h) ? h : h+'px';
  var w = (eve.detail||'').width; if(w) eve.target.style.width = isNaN(w) ? w : w+'px';
},document);
kit.http = {createServer: function(h){
  h.listen = function(port,ip,cb){cb&&cb()};
  return kit.server = h;
},serve: function(req, res){ if(W.parent !== W){ return }
  kit.fs.createReadStream(req.url).pipe(res);
},req:function(path,body){ return this._last={url:path,
  method:body?'POST':'GET',body:body,
  headers:{},rawHeaders:[],rawTrailers:[],
  socket:tmp={},client:tmp,connection:tmp,
  resume: function(){},
  pause: function(){},
  isPaused: function(){}
}},res:function(end){ return {_req:this._last,
  end: end||kit.http.end,
  getHeader: function(){},
  setHeader: function(name, value){},
  writeHead: function(statusCode,headers){},
  write: function(data){},
  pipe: function(){}
}},end:function(data,id,i){
  id = this._req.url.replace(location.__dirname,'').replace('file://','')/*.replace('.html','')*/.split('#')[0];
  //console.log("http.end", id, data, 'URL:', this._req.url);
  //(i = ((data||'').src? data : (D[ID](id) || D[HI]('iframe')))).id || (i.id = id);
  (i = D[ID](id) || D[HI]('iframe')).id || (i.id = id);
  D.querySelectorAll('.main').forEach(function(e){ e.classList.remove('main') });
  i.className = 'main page'; i.src||(i===D.body)||(i.srcdoc = data, D.body.appendChild(i)); location.hash = i.id; // TODO: BUG? Prevent double hash change
  kit.frame && kit.frame.refresh && kit.frame.refresh();
}};
W[ON]('submit', function(eve, act){ eve.preventDefault();
  act = (eve.target.action||'').replace(location.__dirname+'/','').split('#')[0];
  //console.log(location.pathname.split('/').slice(-1)[0], 'submit', act);
  (kit.server||kit.http.serve)(
    kit.http.req(act,Object.fromEntries(new FormData(eve.target))),
    kit.http.res()
  );
});
location.__dirname = location.href.split('/').slice(0,-1).join('/');
Object.defineProperty(location, 'path', {
  get(){ return kit.path },
  set(path){ if(!path){ return }
    path = path.replace(location.__dirname,'');
    if('.' == path[0]){ path = path.slice(1) }
    if('/' == path[0]){  path = path.slice(1) }
    //console.log(location.pathname.split('/').slice(-1)[0], 'path=', path, kit.path);
    if(kit.path === (kit.path = path)){ return }
    (kit.server||kit.http.serve)(kit.http.req(path),kit.http.res());
  }
});
kit.querystring = {
  parse: function(qs){ return Object.fromEntries((new URLSearchParams(qs)).entries()) }
}
kit.fs = {files:{},
  createReadStream(url){ url = (url||'').replace(location.__dirname+'/','').split('#')[0];
    //console.log("fs.cRS:", url);
    var data = this.files[url], end = 0, tmp;
    return {_:{},
      on(eve,cb){ this._[eve] = cb; 'open'==eve&&setTimeout(cb, 0); return this }, // fake immediate open
      pipe(dest){ var rs = this, i;
        if(end){ return dest } end = 1;
        function load(){ (data = i).onload = 0;;
          if(!data){ return (tmp=rs._.error)&&tmp({code:'ENOENT'}) }
          (tmp=rs._.data)&&tmp(data);
          (tmp=rs._.end)&&tmp();
          dest.end(data);
        };
        if(i = D[ID](url)){ setTimeout(load,0) }
        else {
          (i = D[HI]('iframe')).onload = load
          i.id = (i.src = url)/*.replace('.html','')*/; D.body.appendChild(i);
        }
        //setTimeout(i.onload,0);
        return dest;
      }
    };
  }, readFileSync: function(path){

  }, readFile: function(path,opt,cb){

  }, writeFileSync: function(path,data){

  }, writeFile: function(path,data,opt,cb){

  }, createWriteStream: function(path,opt){

  }, readdir: function(path,cb){

  }
};
W[ON]('DOMContentLoaded',function(m){
  //m = D[HI]('main'); while(D.body.firstChild){ m.appendChild(D.body.firstChild) } D.body.appendChild(m);
  m=D.body;m.className = 'main page'; m.id = (kit.path = location.href.replace(location.__dirname+'/','').split('#')[0])/*.replace('.html','')*/;
  //console.log(location.pathname.split('/').slice(-1)[0], "kit hash add!");
  (function(){ function change(eve){ eve = eve||''; eve = eve.detail||eve.data||eve;
    var hash = (eve.newURL||'').split('#')[1]||'';
    if('.' == hash[0]){ location.hash = hash.slice(1); return; }
    if('/' == hash[0]){ location.hash = hash.slice(1); return; }
    //console.log(location.pathname.split('/').slice(-1)[0], "kit hashchange", hash, 'eve:', eve);
    if(!eve && !hash){ return }
    location.path = hash;
    eve && kit.up({newURL: eve.newURL, oldURL: eve.oldURL},'hashchange');
  }; W[ON]('hashchange',change) }());
  kit.up('','load');
  kit.frame && kit.frame.refresh && kit.frame.refresh();
  return;
  //if(location.hash){ kit.say('','hashchange') }
});
}());
