var dom = HTMLElement.prototype, doms = NodeList.prototype, all = function(t,e){ (t.forEach?t:[t]).forEach(e); return t; }
dom.all = function(q){ return this.querySelectorAll(q) };
dom.new = function(t){ return (this.all(t)[0]||document.createElement(t)).cloneNode(1); };
dom.ear =doms.ear= function(e,h){ return all(this,v=>{v.addEventListener(e,h)}) };
dom.tag =doms.tag= function(c,s){ return all(this,v=>{v.classList[s?(s>0?'add':'remove'):'toggle'](c)}) };
dom.pin =doms.pin= function(t,p,m,s){ p = p||0.1; if(p.pin){ p.pin(this,t); return this }
  m = {'-1':'beforebegin','-0.1':'afterbegin','0.1':'beforeend','1':'afterend'};
  return all(this,(v,i,a)=>{all(t,e=>{ v.insertAdjacentElement(m[p]||m[0.1],e) })});
}

dom.up =doms.up= function(q,l){ if(!q){ return this.parentNode }; // deprecate in favor of .closest()
  l = []; all(this,v=>{ while(v && v !== document){
    if(v.matches && v.matches(q)){ break }
    v = v.parentNode;
  }; l.push(v);
}); return l };


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

String.prototype.cmd = function(s, line, hit){
  s = this.flat();
  line = s.split(/\r\n|\n|\r/)[0] || '';
  hit = line.match(/^(.*?)(\$|#|>|%|~%|PS>)\s*([\s\S]*)$/);
  return (hit ? hit[3] : line).trim();
};

String.prototype.tty = function(){
  if(/\x1b\[\?(?:47|1047|1049)h/.test(this)){ return 'alt' }
  if(/\x1b\[\?2026h/.test(this)){ return 'sync' }
  if(/\x1b\[\?25l/.test(this) && /\x1b\[(?:H\x1b\[J|2J)/.test(this)){ return 'full' }
  return '';
};

String.prototype.ansi = function() {
  var colors = {
    30: 'black', 31: 'red', 32: 'green', 33: 'yellow', 34: 'blue', 35: 'magenta', 36: 'cyan', 37: 'white',
    90: 'gray', 91: '#f55', 92: '#5f5', 93: '#ff5', 94: '#55f', 95: '#f5f', 96: '#5ff', 97: 'white'
  }, stack = [];
  return this.replace(/\x1B\[([0-9;]*)m/g, function(m, p1) {
    var out = '';
    p1.split(';').forEach(function(c) {
      c = parseInt(c) || 0;
      if (c === 0) {
        while (stack.length) { out += '</span>'; stack.pop(); }
      } else if (colors[c]) {
        out += '<span style="color:' + colors[c] + '">'; stack.push('</span>');
      } else if (c === 1) {
        out += '<span style="font-weight:bold">'; stack.push('</span>');
      }
    });
    return out;
  }) + (stack.join('') || '');
};

String.prototype.unansi = function() {
  var colors = {
    'black': 30, 'red': 31, 'green': 32, 'yellow': 33, 'blue': 34, 'magenta': 35, 'cyan': 36, 'white': 37,
    'gray': 90, '#f55': 91, '#5f5': 92, '#ff5': 93, '#55f': 94, '#f5f': 95, '#5ff': 96
  };
  var html = this;
  var res = html.replace(/<span style="(.*?)">/g, function(m, p1) {
    var code = '';
    if (p1.indexOf('color:') !== -1) {
      var col = p1.match(/color:\s*([^;"'\s]+)/)[1];
      if (colors[col]) code += colors[col];
    }
    if (p1.indexOf('font-weight:bold') !== -1) {
      code += (code ? ';' : '') + '1';
    }
    return code ? '\x1B[' + code + 'm' : '';
  });
  return res.replace(/<\/span>/g, '\x1B[0m');
};

ESC = {"'":'','"':'','#':'\n'};
var D = document, B = D.body;
window.job = function(i, t){
  i = frameElement;
  t = i && i.closest('task');
  return (t && t.getAttribute('job')) || '';
};

window.buzz = screen.buzz = function(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 9); } catch(e) {}
};
window.shellReply = window.shellReply || {
  clean: function(s){
    if(!s){ return s }
    return (''+s)
      .replace(/(?:^|\r?\n)WARNING: terminal is not fully functional(?:\r?\n|$)/g, '\n')
      .replace(/(?:^|\r?\n)Press RETURN to continue(?:\r?\n|$)/g, '\n')
      .replace(/(?:\r?\n)?--More--(?:\r?\n)?/g, '\n');
  },
  maybeContinue: function(s, opt, now){
    opt = opt || {};
    s = (s||'').flat();
    if(!/(Press RETURN to continue|--More--|\(END\))/.test(s)){ return false }
    now = Date.now();
    var state = opt.state || this;
    if(state.autoContinueAt && (now - state.autoContinueAt < (opt.wait || 700))){ return false }
    state.autoContinueAt = now;
    if(opt.send){ opt.send('\r') }
    return true;
  }
};
document.addEventListener('pointerdown', function(e) { return;
  var t = e.target;
  if (t.tagName === 'BUTTON' || t.closest('button') || t.tagName === 'A' || t.closest('a') || t.closest('[class$="-box"]')) {
    buzz(15);
  }
});

String.prompts = function(t){
    const rawText = '' + t;
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    
    let flatToRaw = [];
    let flatText = '';
    
    let match;
    let lastIndex = 0;
    ansiRegex.lastIndex = 0;
    
    while ((match = ansiRegex.exec(rawText)) !== null) {
        for (let i = lastIndex; i < match.index; i++) {
            flatToRaw.push(i);
            flatText += rawText[i];
        }
        lastIndex = ansiRegex.lastIndex;
    }
    for (let i = lastIndex; i < rawText.length; i++) {
        flatToRaw.push(i);
        flatText += rawText[i];
    }
    flatToRaw.push(rawText.length);
    
    let splitPoints = [];
    let currentLineStart = 0;
    
    for (let i = 0; i <= flatText.length; i++) {
        if (i === flatText.length || flatText[i] === '\n') {
            let line = flatText.substring(currentLineStart, i);
            let checkLine = line.endsWith('\r') ? line.substring(0, line.length - 1) : line;
            
            let isPrompt = false;
            
            if (!checkLine.startsWith(' ') && !checkLine.startsWith('\t')) {
                // Check if it matches a typical prompt pattern, e.g. "path $ " or "user@host:path $ "
                let matchPrompt = checkLine.match(/(.*?)[$#>%]\s/);
                if (matchPrompt) {
                    let prefix = matchPrompt[1].trim();
                    let rawStart = currentLineStart > 0 ? flatToRaw[currentLineStart - 1] + 1 : 0;
                    
                    let lookbackRaw = rawText.substring(Math.max(0, rawStart - 15), rawStart + 15);
                    
                    let validPrefix = false;
                    if (prefix.length === 0) {
                        validPrefix = lookbackRaw.includes('2004h');
                    } else if (!prefix.includes(' ')) {
                        validPrefix = true;
                    } else if (prefix.includes('@')) {
                        validPrefix = true;
                    } else if (prefix.startsWith('PS ')) {
                        validPrefix = true;
                    } else if (prefix.startsWith('(') && prefix.includes(')')) {
                        validPrefix = true;
                    } else if (prefix.startsWith('[')) {
                        validPrefix = true;
                    }
                    
                    if (validPrefix) {
                        isPrompt = true;
                    }
                }
            }
            
            if (isPrompt) {
                let rawStart = currentLineStart > 0 ? flatToRaw[currentLineStart - 1] + 1 : 0;
                splitPoints.push(rawStart);
            }
            
            currentLineStart = i + 1;
        }
    }
    
    if (splitPoints.length === 0) return [rawText];
    
    let chunks = [];
    for (let i = 0; i < splitPoints.length; i++) {
        let start = splitPoints[i];
        let end = i + 1 < splitPoints.length ? splitPoints[i+1] : rawText.length;
        chunks.push(rawText.substring(start, end));
    }
    
    return chunks;
};

String.prototype.splitPrompts = function(){
  return String.prompts(this);
};
