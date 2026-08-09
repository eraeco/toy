// gemini — ACP bridge // @abenezermario
var cp = require('child_process');

function has(){
  var r = cp.spawnSync('gemini', ['--version'], {encoding: 'utf8', timeout: 3000});
  return !r.error && r.status === 0;
}

function send(c, obj, add){
  var out = {}, k;
  for(k in obj){ out[k] = obj[k] }
  delete out.$;
  for(k in add){ out[k] = add[k] }
  out.type = 'gemini';
  try{ c.send(JSON.stringify(out)) }catch(e){}
}

function shdir(c, p, out, hit){ // live cwd of the connection's shared shell PTY — `cd` in the terminal moves the AI too
  p = ((c || {}).p || {})[1] || ((c || {}).p || {})['1'];
  if(!p || !p.pid){ return '' }
  try{ out = cp.execSync('lsof -a -p ' + p.pid + ' -d cwd -F n', {timeout: 2000}).toString() }catch(e){ return '' }
  hit = out.split('\n').find(function(v){ return 'n' === v[0] });
  return hit ? hit.slice(1) : '';
}

function Gemini(c, obj){
  var self = this;
  self.c = c;
  self.obj = obj;
  self.id = 1;
  self.cb = {};
  self.sid = null; // must load via session/load — seeding from the request skips it and breaks --resume
  self.buf = '';
  self.ready = 0;
  self.pending = null;
  self.busy = 0;
  self.proc = cp.spawn('gemini', ['--acp'], {stdio: ['pipe', 'pipe', 'pipe']});
  self.proc.on('error', function(e){ send(self.c, self.obj, {$: 'Gemini failed to start: ' + e.message, done: 1}) });
  self.proc.stdout.on('data', function(d){ self.data(d) });
  self.proc.on('close', function(){ self.proc = null;
    if(self.busy){ self.busy = 0; send(self.c, self.obj, {$: 'Gemini stopped.', done: 1}) }
  });
  self.rpc('initialize', {protocolVersion: 1, clientInfo: {name: 'toy', version: '1.0'}, capabilities: {}}, function(){
    self.rpc('authenticate', {methodId: 'oauth-personal'}, function(){
      self.ready = 1;
      if(self.pending){ self.go(self.pending) }
    });
  });
}

Gemini.prototype.rpc = function(m, p, cb){
  var id = this.id++;
  if(cb){ this.cb[id] = cb }
  this.write({jsonrpc: '2.0', id: id, method: m, params: p || {}});
};

Gemini.prototype.respond = function(id, r){
  this.write({jsonrpc: '2.0', id: id, result: r || {}});
};

Gemini.prototype.write = function(msg){
  if(this.proc && this.proc.stdin.writable){ this.proc.stdin.write(JSON.stringify(msg) + '\n') }
};

Gemini.prototype.data = function(d){
  var self = this, a;
  self.buf += d.toString();
  a = self.buf.split('\n');
  self.buf = a.pop();
  a.forEach(function(l){
    if(!l.trim()){ return }
    try{ self.msg(JSON.parse(l)) }catch(e){}
  });
};

Gemini.prototype.msg = function(m){
  if(m.id && !m.method){
    if(this.cb[m.id]){ this.cb[m.id](m.result, m.error); delete this.cb[m.id] }
    return;
  }
  if(m.id && m.method){
    if(m.method === 'session/request_permission'){
      var opts = ((m.params || {}).permissions || [{}])[0].options || [];
      var allow = opts.find(function(o){ return o.kind === 'allow_always' }) || opts.find(function(o){ return o.kind === 'allow_once' }) || opts[0];
      this.respond(m.id, {outcome: {outcome: 'selected', optionId: (allow || {}).optionId || ''}});
    } else {
      this.respond(m.id, {});
    }
    return;
  }
  if(m.method === 'session/update'){
    send(this.c, this.obj, {event: (m.params || {}).update || {}});
  }
};

Gemini.prototype.go = function(obj){
  var self = this;
  var txt = (obj.$ || obj.prompt || '').replace(/^gemini\s*/i, '').trim();
  if(!txt){ send(self.c, obj, {$: 'Send a prompt for Gemini.', done: 1}); return }
  if(self.busy){ send(self.c, obj, {$: 'Gemini is still working — stop it first.', done: 1}); return }
  if(!self.ready){ self.pending = obj; return }
  self.pending = null;
  self.obj = obj;
  self.busy = 1;
  var sid = obj.session || null;
  if(sid && sid !== self.sid){
    self.rpc('session/load', {sessionId: sid}, function(){
      self.sid = sid;
      self.prompt(txt);
    });
    return;
  }
  if(self.sid){ self.prompt(txt); return }
  self.rpc('session/new', {cwd: shdir(self.c) || obj.cwd || process.cwd(), mcpServers: []}, function(r){
    self.sid = (r || {}).sessionId || null;
    send(self.c, self.obj, {event: {sessionUpdate: 'session-init', sessionId: self.sid}});
    self.rpc('session/set_mode', {sessionId: self.sid, modeId: 'yolo'}, function(){
      self.prompt(txt);
    });
  });
};

Gemini.prototype.prompt = function(txt){
  var self = this;
  self.rpc('session/prompt', {sessionId: self.sid, prompt: [{type: 'text', text: txt}]}, function(){
    self.busy = 0;
    send(self.c, self.obj, {done: 1, session: self.sid});
  });
};

Gemini.prototype.cancel = function(){
  if(this.sid){ this.write({jsonrpc: '2.0', method: 'session/cancel', params: {sessionId: this.sid}}) }
};

Gemini.prototype.kill = function(){
  if(this.proc){ this.proc.kill(); this.proc = null }
};

function bag(c){
  if(c.toygemini){ return c.toygemini }
  c.toygemini = {};
  c.on('close', function(){ var k; for(k in c.toygemini){ c.toygemini[k].kill() } });
  return c.toygemini;
}

module.exports = function(obj, c){
  var all = bag(c), id = obj['#'] || '1';
  if(obj.act === 'stop'){ if(all[id]){ all[id].cancel() } return }
  if(!has()){ send(c, obj, {$: 'Gemini CLI not found on this host.\n\nInstall with:\n\nnpm install -g @google/gemini-cli', done: 1}); return }
  if(!all[id]){ all[id] = new Gemini(c, obj) }
  all[id].go(obj);
};
