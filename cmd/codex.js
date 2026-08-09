var cp = require('child_process');
var fs = require('fs');
var path = require('path');

function has(bin){
  var r = cp.spawnSync(bin, ['--version'], {encoding: 'utf8', timeout: 3000});
  return {ok: !r.error && r.status === 0, txt: ((r.stdout || '') + (r.stderr || '')).trim(), err: r.error};
}

function send(c, obj, txt, end){
  var out = {}, k;
  for(k in obj){ out[k] = obj[k] }
  out.type = 'codex';
  out.$ = txt || '';
  if(end){ out.done = 1 }
  c.send(JSON.stringify(out));
}

function setup(c, obj){
  var cod = has('codex');
  var npm = has('npm');
  if(cod.ok){ return 1 }
  if(!npm.ok){
    send(c, obj, 'Codex is not installed, and npm was not found on this host.\n\nInstall Node.js/npm first, then install Codex with:\n\nnpm install -g @openai/codex', 1);
    return 0;
  }
  obj.need = 'codex';
  send(c, obj, 'Codex is not installed on this host.\n\nnpm is available. Tap install to run:\n\nnpm install -g @openai/codex', 1);
  return 0;
}

function inst(c, obj){
  var npm = has('npm');
  if(!npm.ok){ send(c, obj, 'npm is not available, so Codex cannot be installed automatically.', 1); return }
  send(c, obj, 'Installing Codex with npm...\n');
  var p = cp.spawn('npm', ['install', '-g', '@openai/codex'], {stdio: ['ignore', 'pipe', 'pipe']});
  p.stdout.on('data', function(d){ send(c, obj, d.toString()) });
  p.stderr.on('data', function(d){ send(c, obj, d.toString()) });
  p.on('error', function(e){ send(c, obj, 'Install failed: ' + e.message, 1) });
  p.on('close', function(code){
    send(c, obj, code ? ('Install exited with code ' + code + '.') : 'Codex installed. Send your prompt again.', 1);
  });
}

function Codex(c, obj){
  var self = this;
  self.c = c;
  self.obj = obj;
  self.id = 1;
  self.cb = {};
  self.buf = '';
  self.tid = obj.thread || null;
  self.ok = 0;
  self.wait = null;
  self.dir = gooddir(shdir(c)) || gooddir(obj.cwd) || process.cwd();
  self.proc = cp.spawn('codex', ['app-server', '--stdio'], {
    cwd: self.dir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: env()
  });
  self.proc.stdout.on('data', function(d){ self.data(d) });
  self.proc.stderr.on('data', function(d){ self.err(d) });
  self.proc.on('error', function(e){ self.say('Codex failed to start: ' + e.message, 1) });
  self.proc.on('close', function(code){ self.proc = null; if(code && !self.done){ self.say('Codex stopped with code ' + code + '.', 1) } });
  self.call('initialize', {clientInfo: {name: 'toy', version: '1.0'}, capabilities: {}}, function(r, e){
    if(e){ self.say('Codex initialize failed: ' + fail(e), 1); return }
    self.note('initialized');
    self.ok = 1;
    if(self.wait){ self.go(self.wait) }
  });
  setTimeout(function(){
    if(!self.ok){ self.say('Codex app-server did not finish startup. Try `codex login` or `codex --version` in the shell.', 1) }
  }, 12000);
}

function env(){
  var e = {}, k;
  for(k in process.env){ e[k] = process.env[k] }
  e.NO_COLOR = '1';
  e.FORCE_COLOR = '0';
  e.CLICOLOR = '0';
  e.TERM = 'dumb';
  delete e.COLORTERM;
  return e;
}

function gooddir(dir){
  if(!dir || typeof dir !== 'string'){ return '' }
  dir = path.resolve(dir);
  try{ if(fs.statSync(dir).isDirectory()){ return dir } }catch(e){}
  return '';
}

function shdir(c, p, out, hit){ // live cwd of the connection's shared shell PTY — `cd` in the terminal moves the AI too
  p = ((c || {}).p || {})[1] || ((c || {}).p || {})['1'];
  if(!p || !p.pid){ return '' }
  try{ out = cp.execSync('lsof -a -p ' + p.pid + ' -d cwd -F n', {timeout: 2000}).toString() }catch(e){ return '' }
  hit = out.split('\n').find(function(v){ return 'n' === v[0] });
  return hit ? hit.slice(1) : '';
}

function fail(e){
  if(!e){ return 'unknown error' }
  return e.message || e.text || e.code || JSON.stringify(e);
}

Codex.prototype.say = function(txt, end){
  var obj = {}, k;
  for(k in this.obj){ obj[k] = this.obj[k] }
  obj.type = 'codex';
  obj.$ = txt || '';
  if(this.tid){ obj.thread = this.tid }
  if(end){ obj.done = 1; this.done = 1 }
  this.c.send(JSON.stringify(obj));
};

Codex.prototype.call = function(m, p, cb){
  var id = this.id++;
  if(cb){ this.cb[id] = cb }
  this.write({jsonrpc: '2.0', id: id, method: m, params: p || {}});
};

Codex.prototype.note = function(m, p){
  this.write({jsonrpc: '2.0', method: m, params: p || {}});
};

Codex.prototype.back = function(id, r){
  this.write({jsonrpc: '2.0', id: id, result: r || {}});
};

Codex.prototype.write = function(msg){
  if(this.proc && this.proc.stdin.writable){ this.proc.stdin.write(JSON.stringify(msg) + '\n') }
};

Codex.prototype.data = function(d){
  var a, self = this;
  self.buf += d.toString();
  a = self.buf.split('\n');
  self.buf = a.pop();
  a.forEach(function(line){
    if(!line.trim()){ return }
    try{ self.msg(JSON.parse(line)) }catch(e){}
  });
};

Codex.prototype.err = function(d){
  var txt = d.toString();
  if(/PATH aliases/.test(txt)){ return }
  if(!this.ok){ this.say(txt) }
};

Codex.prototype.msg = function(m){
  var p = m.params || {};
  if(m.id && !m.method){
    if(this.cb[m.id]){ this.cb[m.id](m.result || {}, m.error); delete this.cb[m.id] }
    else if(m.error){ this.say('Codex error: ' + fail(m.error), 1) }
    return;
  }
  if(m.id && m.method){
    this.ask(m);
    return;
  }
  this.see(m.method || '', p);
};

Codex.prototype.ask = function(m){
  if(m.method === 'item/commandExecution/requestApproval' || m.method === 'item/fileChange/requestApproval'){
    this.say('\nCodex requested elevated approval. This toy hook denied it automatically for safety.\n');
    this.back(m.id, {decision: 'decline'});
    return;
  }
  if(m.method === 'item/permissions/requestApproval'){
    this.say('\nCodex requested extra permissions. This toy hook granted no extra permissions automatically.\n');
    this.back(m.id, {permissions: {}, scope: 'turn'});
    return;
  }
  this.back(m.id, {});
};

Codex.prototype.see = function(t, p){
  var item = p.item || {};
  if(t === 'thread/started' && p.thread && p.thread.id){ this.tid = p.thread.id; this.say('Codex thread ' + this.tid + '\n') }
  if(t === 'item/agentMessage/delta'){ this.say(p.delta || '') }
  if(t === 'item/reasoning/textDelta'){ return }
  if(t === 'item/started' && item.type === 'commandExecution'){ this.say('\n$ ' + (item.command || 'command') + '\n') }
  if(t === 'item/started' && item.type === 'fileChange'){ this.say('\n[file] ' + (item.path || 'change') + '\n') }
  if(t === 'item/commandExecution/outputDelta' || t === 'item/fileChange/outputDelta'){ this.say(p.delta || '') }
  if(t === 'item/completed' && item.aggregatedOutput){ this.say(item.aggregatedOutput) }
  if(t === 'turn/completed' || t === 'turn/aborted'){ this.say('\n[' + t.replace('turn/', '') + ']\n', 1) }
  if(t === 'error'){ this.say('Codex error: ' + (p.message || p.text || JSON.stringify(p)), 1) }
};

Codex.prototype.go = function(obj){
  var self = this;
  if(!self.ok){ self.wait = obj; return }
  self.wait = null;
  self.obj = obj;
  if(obj.thread && obj.thread !== self.tid){
    self.tid = obj.thread;
    self.call('thread/resume', {threadId: self.tid, approvalPolicy: 'on-request', sandbox: 'workspace-write'}, function(r, e){
      if(e){ self.say('Codex resume failed: ' + fail(e), 1); return }
      self.turn(obj.$ || obj.prompt || '');
    });
    return;
  }
  if(self.tid){ self.turn(obj.$ || obj.prompt || ''); return }
  self.call('thread/start', {model: null, cwd: self.dir, approvalPolicy: 'on-request', sandbox: 'workspace-write'}, function(r, e){
    if(e){ self.say('Codex thread failed: ' + fail(e), 1); return }
    self.tid = r.threadId || ((r.thread || {}).id) || self.tid;
    self.turn(obj.$ || obj.prompt || '');
  });
};

Codex.prototype.turn = function(txt){
  txt = (txt || '').replace(/^codex\s*/i, '').trim();
  if(!txt){ this.say('Send a prompt for Codex.', 1); return }
  this.done = 0;
  this.call('turn/start', {threadId: this.tid, input: [{type: 'text', text: txt, text_elements: []}]});
};

Codex.prototype.stop = function(){
  if(this.tid){ this.call('turn/interrupt', {threadId: this.tid}) }
};

Codex.prototype.kill = function(){
  if(this.proc){ this.proc.kill(); this.proc = null }
};

function bag(c){
  if(c.toycodex){ return c.toycodex }
  c.toycodex = {};
  c.on('close', function(){
    var k;
    for(k in c.toycodex){ c.toycodex[k].kill() }
  });
  return c.toycodex;
}

module.exports = function(obj, c){
  var all = bag(c), id = obj['#'] || '1';
  if(obj.act === 'install'){ inst(c, obj); return }
  if(!setup(c, obj)){ return }
  if(obj.act === 'stop'){ if(all[id]){ all[id].stop() } return }
  if(!all[id]){ all[id] = new Codex(c, obj) }
  all[id].go(obj);
};
