// git.js: browser only git cmds (fetch, pull, push, reset, config). No server.
;(function(){
  var $ = (id) => document.getElementById(id);
  var tok = $('token');
  if (tok) { tok.value = localStorage.tok || ''; tok.onchange = () => { localStorage.tok = tok.value } }
  var opt = (o) => ({
    fs: o.fs, http: o.http, dir: o.dir,
    corsProxy: ($('cors-proxy') || {}).value || undefined,
    onAuth: () => ({ username: localStorage.tok || '' }),
    onAuthFailure: () => ({ cancel: true })
  });
  var who = async (o) => {
    var g = (k) => o.git.getConfig({ fs: o.fs, dir: o.dir, path: k }).catch(() => '');
    return { name: (await g('user.name')) || 'me', email: (await g('user.email')) || 'me@here' };
  };
  var more = window.more = {};
  more.fetch = async (o) => {
    var r = await o.git.fetch(Object.assign(opt(o), { singleBranch: true }));
    return { ok: true, text: 'Fetched ' + (r.fetchHead || '') };
  };
  more.pull = async (o) => {
    await o.git.pull(Object.assign(opt(o), { singleBranch: true, author: await who(o) }));
    return { ok: true, text: 'Pulled' };
  };
  more.push = async (o) => {
    var r = await o.git.push(opt(o));
    return { ok: r.ok, text: r.ok ? 'Pushed' : JSON.stringify(r.refs) };
  };
  more.reset = async (o) => { // unstage: git reset <file>
    for (var f of o.args) await o.git.resetIndex({ fs: o.fs, dir: o.dir, filepath: f });
    return { ok: true, text: 'Reset ' + o.args.join(' ') };
  };
  more.config = async (o) => {
    var a = o.args, k = a[a.length - 1], d = { fs: o.fs, dir: o.dir };
    if (a[0] === '--get') { var v = await o.git.getConfig(Object.assign(d, { path: a[1] })); return { ok: v != null, text: v == null ? '' : '' + v } }
    if (a[0] === '--unset') { await o.git.setConfig(Object.assign(d, { path: a[1], value: undefined })); return { ok: true, text: '' } }
    await o.git.setConfig(Object.assign(d, { path: a[0], value: a[1] }));
    return { ok: true, text: '' };
  };
}());
