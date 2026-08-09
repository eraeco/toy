// claude — Agent SDK bridge // @abenezermario
var fs = require('fs');
var path = require('path');

function has(){
  try{ require.resolve('@anthropic-ai/claude-agent-sdk'); return 1 }catch(e){ return 0 }
}

var key = {n: 0, was: null};

function send(c, obj, add){
  var out = {}, k;
  for(k in obj){ out[k] = obj[k] }
  delete out.$;
  for(k in add){ out[k] = add[k] }
  out.type = 'claude';
  try{ c.send(JSON.stringify(out)) }catch(e){}
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
  try{ out = require('child_process').execSync('lsof -a -p ' + p.pid + ' -d cwd -F n', {timeout: 2000}).toString() }catch(e){ return '' }
  hit = out.split('\n').find(function(v){ return 'n' === v[0] });
  return hit ? hit.slice(1) : '';
}

function Claude(c, obj){
  this.c = c;
  this.obj = obj;
  this.sid = obj.session || null;
  this.q = null;
}

Claude.prototype.go = function(obj){
  var self = this;
  var txt = (obj.$ || obj.prompt || '').replace(/^claude\s*/i, '').trim();
  if(!txt){ send(self.c, obj, {$: 'Send a prompt for Claude.', done: 1}); return }
  if(self.q){ send(self.c, obj, {$: 'Claude is still working — stop it first.', done: 1}); return }
  self.obj = obj;
  var sdk = require('@anthropic-ai/claude-agent-sdk');
  var opts = {includePartialMessages: true};
  if(obj.session || self.sid){ opts.resume = obj.session || self.sid }
  opts.cwd = gooddir(shdir(self.c)) || gooddir(obj.cwd) || process.cwd();
  var q;
  (async function(){
    if(0 === key.n++){ key.was = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY }
    q = self.q = sdk.query({prompt: txt, options: opts});
    for await (var msg of q){
      if(msg.type === 'system' && msg.subtype === 'init' && msg.session_id){ self.sid = msg.session_id }
      send(self.c, self.obj, {event: msg});
    }
  })().catch(function(e){
    send(self.c, self.obj, {event: {type: 'error', text: e.message}});
  }).finally(function(){
    if(0 === --key.n && key.was){ process.env.ANTHROPIC_API_KEY = key.was; key.was = null }
    self.q = null;
    send(self.c, self.obj, {done: 1, session: self.sid});
  });
};

Claude.prototype.stop = function(){
  if(this.q && this.q.interrupt){ this.q.interrupt() }
};

Claude.prototype.kill = function(){
  if(this.q && this.q.close){ this.q.close() }
  this.q = null;
};

function bag(c){
  if(c.toyclaude){ return c.toyclaude }
  c.toyclaude = {};
  c.on('close', function(){ var k; for(k in c.toyclaude){ c.toyclaude[k].kill() } });
  return c.toyclaude;
}

module.exports = function(obj, c){
  var all = bag(c), id = obj['#'] || '1';
  if(obj.act === 'stop'){ if(all[id]){ all[id].stop() } return }
  if(!has()){ send(c, obj, {$: 'Claude Agent SDK not found on this host.\n\nInstall it where ssh.js runs:\n\nnpm install @anthropic-ai/claude-agent-sdk', done: 1}); return }
  if(!all[id]){ all[id] = new Claude(c, obj) }
  all[id].go(obj);
};
