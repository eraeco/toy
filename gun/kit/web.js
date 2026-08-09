;(function(){
var W = window, D = document, SW = screen.width, SH = screen.height, ON = 'addEventListener', HI = 'createElement', ID = 'getElementById', U, DEV = ('file://'===location.origin);
;(function(){ if(screen.width > screen.height){ return } // phone only debug
  var add = function(){ if(console.view){ return } (console.view = document[HI]('textarea')).style="position:fixed; z-index:99999; inset:0; width:100%; height:4em; padding: 0; background:rgba(100%,100%,100%,0.8); color:black; transition: 0.5s all; white-space: pre-wrap; overflow-wrap: break-word; word-break: break-all;"; console.view.readOnly = 1; setTimeout(function(){D.body.appendChild(console.view);},99); console.view.onclick = function(eve){ console.view.style.height = ('4em'==console.view.style.height)?'50vh':'4em' ; console.view.select(); D.execCommand('copy'); navigator.clipboard.writeText(console.view.value) } }
  console.log = console.warn = console.error = function(...args){ if(console.off){ return } add(); console.view.value += JSON.stringify(args).slice(1,-1); console.view.scrollTop = console.view.scrollHeight; }
  window.onerror = window.onunhandledrejection = console.log;
}());
var tmp = D[HI]('meta'); tmp.name = 'viewport'; tmp.content = 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content'; D.head.appendChild(tmp);
//(tmp=D[HI]('link')).rel="stylesheet"; tmp.href=((D.currentScript||'').src||'').replace('.js','.css'); D.head.appendChild(tmp); // auto-add CSS?
tmp = D.head.parentNode.style; if(W.parent === W) { tmp['overscroll-behavior-y'] = 'contain'; tmp['background-color'] = 'var(--fill)'; } else { tmp['overflow-y'] = 'auto'; tmp['overscroll-behavior-y'] = 'auto'; }
function LOAD(src, h, s){ (s = D[HI]('script')).onload = h; s.src = src; D.head.appendChild(s) };
function MAP(scroll, screen){ return (scroll / screen)>>0 }; // scroll, screen
kit = function(){};
kit.ears = kit.ears || {};
kit.q = kit.q || {};
kit.ios = /iP(ad|hone|od)/.test(navigator.userAgent) || navigator.platform == 'MacIntel' && navigator.maxTouchPoints > 1; // belts scroll natively on every platform — the iOS-only belt.js physics fork is retired
// dip, dive, into, eat, lid, tin, key, face
//kit.ear = function(h,e,v){ (v=v||W)[ON](e=(h.call?(h.where=e):(e.where=h,(h=e).where))||'',h); h.off = function(){ v.removeEventListener(e,h) }; W===v&&kit.up(e,'ear'); return h; };
//kit.say = function(d,e,v,s){ (v=v||W).dispatchEvent(new CustomEvent(e=e||'',{detail:d,bubbles:true})); !s&&(W===v)&&kit.up(d,e) };
kit.ear = function(h,e,v){
  (v=v||W)[ON](e=(h.call?(h.where=e):(e.where=h,(h=e).where))||'',h);
  v.tagName === 'IFRAME' && v.contentWindow && kit.views.set(v.contentWindow, v);
  kit.ears[e] = 1;
  h.off = function(){ v.removeEventListener(e,h) };  W===v&&kit.up(e,'ear'); 
  if(kit.q[e]){
    var q = kit.q[e]; kit.q[e] = null;
    q.forEach(function(m){ kit.say(m.d, e, v, m.s) });
  }
  return h; 
};
kit.say = function(d,e,v,s){ 
  e=e||''; v=v||W;
  v.tagName === 'IFRAME' && v.contentWindow && kit.views.set(v.contentWindow, v);
  if(v === W && !kit.ears[e]){
    var qi = {d:d, s:s};
    (kit.q[e] = kit.q[e] || []).push(qi);
    setTimeout(function(){
      if(kit.q[e]){
        var x = kit.q[e].indexOf(qi);
        if(x > -1){ kit.q[e].splice(x, 1) }
      }
    }, 9999);
  }
  var ev = new CustomEvent(e,{detail:d,bubbles:true,cancelable:true});
  v.dispatchEvent(ev); 
  (!s && W===v || s === 1 && !ev.cancelBubble) && kit.up(d,e); 
  if(v.tagName === 'IFRAME'){
    if(kit._echo && kit._echo.i === v && kit._echo.t === e){ return }
    var send = function() {
      if(send.off) send.off();
      if(v.contentWindow) v.contentWindow.postMessage({data:d, type:e, wrap:-1}, DEV?'*':location.origin);
    };
    if(v.readyState){ send() } else { kit.ear('ready', send, v) }
  }
};
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
    try { i = eve.source.frameElement; } catch(e) {}
    if(i && i.ownerDocument !== D) i = null;
    if(i){
      kit.views.set(eve.source, i);
      kit.frame.lockScroll(i);
      kit.frame.refresh();
    } else {
      //console.log(location.pathname.split('/').slice(-1)[0], "GOT FROM ABOVE:", eve);
      kit.say(data.data||data.detail,data.type,0,data.wrap||-1);
      return;
    }
  }
  //if('ear'==data.type){ kit.ear(data.detail||data.data,function hear(eve){ if(!(i||'').contentWindow){hear.off(); return } if(kit._echo && kit._echo.i === i && kit._echo.t === eve.type){ return } i.contentWindow.postMessage({data:eve.detail||eve.data,type:eve.type,wrap:-1}, DEV?'*':location.origin) }); return; }

  i.readyState = 1;

  if('ear'==data.type){ kit.ear(data.detail||data.data,function hear(eve){ if(!(i||'').contentWindow){hear.off(); return } if(kit._echo && kit._echo.i === i && kit._echo.t === eve.type){ return } if(((eve.target||'').tagName) === 'IFRAME'){ return } i.contentWindow.postMessage({data:eve.detail||eve.data,type:eve.type,wrap:-1}, DEV?'*':location.origin) }); return; }
  kit._echo = {i:i,t:data.type}; kit.say(data.data||data.detail,data.type,i,data.wrap||1); kit._echo = null;
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
kit.watch.join = function(node, all, i){
  if(!node || !node.nodeName){ return }
  node.dispatchEvent(new CustomEvent('join '+node.nodeName.toLowerCase(), {bubbles:true}));
  node.dispatchEvent(new CustomEvent('join', {bubbles:true}));
  all = node.querySelectorAll && node.querySelectorAll('*');
  if(!all){ return }
  for(i = 0; i < all.length; i += 1){ kit.watch.join(all[i]) }
};
(kit.watch.observer = new MutationObserver(function(eve,b,low){eve.forEach(function(changes){changes.addedNodes.forEach(function(node){ //console.log("observed change on", node);
  kit.watch.join(node);
  //low = kit.watch.low(node, low); 
})});
  //console.log(location.pathname.split('/').slice(-1)[0], "LOWEST", low, kit.watch.low(D.body), D.body.scrollHeight);
  if(kit.vars && kit.vars.sync){ kit.vars.sync() }
  kit.watch.resize();
})).observe(D.documentElement||D,{childList:true,subtree:true,characterData:true,attributes:true});

kit.watch.low = function(v,l,f){ f='getBoundingClientRect'; return Math.max(((v[f]?v[f]():'').bottom||0) + (W.pageYOffset || D.documentElement.scrollTop),l||0) }
kit.watch.wide = function(v,l,f){ f='getBoundingClientRect'; return Math.max(((v[f]?v[f]():'').right||0) + (W.pageXOffset || D.documentElement.scrollLeft),l||0) }
kit.vars = {};
kit.vars.fix = function(val, all, seen){
  return String(val || '').replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, function(_, key, alt){
    if((seen = seen || {})[key]){ return alt || '' }
    seen[key] = 1;
    return kit.vars.fix(all[key] || alt || '', all, seen);
  }).trim();
};
kit.vars.take = function(css, out, i, key, val){
  if(!css){ return out }
  for(i = 0; i < css.length; i += 1){
    key = css[i];
    if(key.slice(0, 2) !== '--'){ continue }
    val = css.getPropertyValue(key);
    if(val){ out[key] = val }
  }
  return out;
};
kit.vars.rule = function(el, out, rules, i, rule, css){
  if(!rules){ return out }
  for(i = 0; i < rules.length; i += 1){
    rule = rules[i];
    if(rule.conditionText && W.matchMedia && !W.matchMedia(rule.conditionText).matches){ continue }
    if(rule.cssRules){ kit.vars.rule(el, out, rule.cssRules); continue }
    css = rule.style;
    if(!css || !rule.selectorText){ continue }
    try{ if(!el.matches(rule.selectorText)){ continue } }catch(e){ continue }
    kit.vars.take(css, out);
  }
  return out;
};
kit.vars.get = function(el, out, css, i, key, val){
  out = {};
  for(i = 0; i < D.styleSheets.length; i += 1){
    try{ kit.vars.rule(el, out, D.styleSheets[i].cssRules) }catch(e){}
  }
  kit.vars.take(el.style, out);
  css = W.getComputedStyle(el);
  kit.vars.take(css, out);
  return out;
};
kit.vars.all = function(out, key){
  out = kit.vars.get(D.documentElement);
  if(D.body){
    var bod = kit.vars.get(D.body);
    for(key in bod){ out[key] = bod[key] }
  }
  for(key in out){ out[key] = kit.vars.fix(out[key], out) }
  return out;
};
kit.vars.pull = function(src, dst, was, key, val, now){
  src = src && src.style; if(!src){ return }
  dst = dst || D.documentElement; if(!dst){ return }
  was = dst._kitVar || (dst._kitVar = {});
  for(var i = 0; i < src.length; i += 1){
    key = src[i];
    if(key.slice(0, 2) !== '--'){ continue }
    val = src.getPropertyValue(key);
    now = dst.style.getPropertyValue(key);
    if(was[key] && now && now !== was[key]){ continue }
    dst.style.setProperty(key, val);
    was[key] = val;
  }
};
kit.vars.put = function(i, d, el, css, all, was, key, val, now){
  try{
    if(!i){ return }
    all = kit.vars.all();
    for(key in all){ i.style.setProperty(key, all[key]) }
    d = i.contentDocument; if(!d){ return }
    el = d.documentElement; if(!el){ return }
    if(i._kitDoc !== d){ i._kitDoc = d; i._kitVar = {} }
    css = i.contentWindow && i.contentWindow.getComputedStyle(el);
    was = i._kitVar || (i._kitVar = {});
    for(key in all){
      val = all[key];
      now = css ? css.getPropertyValue(key) : el.style.getPropertyValue(key);
      if(was[key] && now && now !== was[key]){ continue }
      el.style.setProperty(key, val);
      was[key] = val;
    }
  }catch(e){}
};
kit.vars.push = function(){
  D.querySelectorAll('iframe').forEach(kit.vars.put);
};
kit.vars.sync = function(){
  if(kit.vars.wait){ return }
  kit.vars.wait = W.requestAnimationFrame(function(){
    kit.vars.wait = 0;
    kit.vars.push();
  });
};
if(W.parent !== W){
  try{
    if(W.parent.kit && W.parent.kit.vars && W.frameElement){ W.parent.kit.vars.put(W.frameElement) }
    kit.vars.pull(W.frameElement);
  }catch(e){}
}
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
  kit.views.set(eve.target.contentWindow, eve.target);
  kit.vars.put(eve.target);
  eve.target.addEventListener('load', function(){ kit.vars.put(eve.target) });
  kit.frame.lockScroll(eve.target);
  kit.frame.refresh();
});
W[ON]('hashchange', kit.frame.refresh);
W[ON]('load', kit.watch.resize);
W[ON]('load', kit.vars.push);
W[ON]('resize', kit.watch.resize);
W[ON]('resize', kit.vars.sync);
W[ON]('pageshow', kit.watch.resize);
W[ON]('pageshow', kit.vars.push);
W[ON]('transitionend', kit.watch.resize, true);
W[ON]('animationend', kit.watch.resize, true);
W[ON]('transitionend', kit.vars.push, true);
W[ON]('animationend', kit.vars.push, true);
if((D.fonts||'').ready){ D.fonts.ready.then(kit.watch.resize) }
kit.ear('style',function(eve,i){
  if(!eve.target || !eve.target.style){ return }
  //console.log(location.pathname.split('/').slice(-1)[0], "resize:", eve.target, eve.detail);
  var h = (eve.detail||'').height; if(h) eve.target.style.height = isNaN(h) ? h : h+'px';
  // Allow width to remain responsive (e.g. 100%) rather than locking it to fixed pixels
  // var w = (eve.detail||'').width; if(w) eve.target.style.width = isNaN(w) ? w : w+'px';
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
  kit.frame && kit.frame.refresh && kit.frame.refresh();
  return;
  //if(location.hash){ kit.say('','hashchange') }
});
var p = HTMLIFrameElement.prototype, _ifL;
while(p && !(_ifL = Object.getOwnPropertyDescriptor(p, 'onload'))) p = Object.getPrototypeOf(p);
_ifL = _ifL || {};
Object.defineProperty(HTMLIFrameElement.prototype, 'onload', {
  set: function(fn) {
    var i = this;
    if(i.contentWindow) kit.views.set(i.contentWindow, i);
    if (!fn) return _ifL.set ? _ifL.set.call(i, fn) : (i.onloaded = fn);
    var w = function(e) {
      if(i.readyState) return fn.call(i, e);
      var r = function(){ if(r.d) return; r.d = 1; fn.call(i, e) };
      kit.ear('ready', function(){ i.readyState = 1; r() }, i);
      setTimeout(r, 99);
    };
    _ifL.set ? _ifL.set.call(i, w) : i.addEventListener('load', w);
  }
});
kit.up('','ready');
}());
