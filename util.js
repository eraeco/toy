var dom = HTMLElement.prototype, doms = NodeList.prototype, all = function(t,e){ (t.forEach?t:[t]).forEach(e); return t; }
dom.new = function(t){ return document.createElement(t) };
dom.all = function(q){ return this.querySelectorAll(q) };
dom.ear =doms.ear= function(e,h){ return all(this,v=>{v.addEventListener(e,h)}); return this };
dom.tag =doms.tag= function(c,s){ return all(this,v=>{v.classList[s?(s>0?'add':'remove'):'toggle'](c)}) };

String.prototype.cut = function(f, e, c){ e = e||{}, c = c||'\\';
  var q = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), L = v => ('string' == typeof v)?[v]:v,
    P = Object.entries(e).map(([k, v]) => q(k)+'[^]*?(?:'+L(v.end||v||k).map(q).join('|')+'|$)').concat(c? q(c)+'[^]' : []),
    R = new RegExp((P.length? '(?:'+P.join('|')+')|' : '') + '('+L(f).sort((a, b) => b.length - a.length).map(q).join('|')+')', 'g'), m;
  for(;m = R.exec(this);){ if(m[1]){ return [this.slice(0,m.index), m[1], this.slice(m.index+m[1].length)] } }
  return ['','',''+this];
};

String.prototype.flat = function(){
  return this.replace(/\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]+\x07)/g, '');
}

ESC = {"'":'','"':'','#':'\n'};
var D = document, B = D.body;

window.buzz = function(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch(e) {}
};
document.addEventListener('pointerdown', function(e) {
  var t = e.target;
  if (t.tagName === 'BUTTON' || t.closest('button') || t.tagName === 'A' || t.closest('a') || t.closest('[class$="-box"]')) {
    buzz(15);
  }
});