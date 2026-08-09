// AUTHOR CREDIT: @abenezermario

VM.srv = {};
VM.srv.ports = {};
VM.srv.pending = {};

VM.srv.patterns = [
  /listening on (?:port )?(\d+)/i,
  /server (?:running|started) (?:on|at) .*?:(\d+)/i,
  /http:\/\/(?:localhost|0\.0\.0\.0|127\.0\.0\.1):(\d+)/i,
];

VM.srv.scan = function (out) {
  for (var i = 0; i < VM.srv.patterns.length; i++) {
    var m = out.match(VM.srv.patterns[i]);
    if (m && m[1]) {
      var port = m[1];
      if (VM.srv.ports[port]) return;
      VM.srv.ports[port] = { at: Date.now() };
      kit.say({ name: "port:" + port, prompt: "open " + port }, "belt");
      kit.say("Server on port " + port, "help");
    }
  }
};

VM.srv.fetch = function (port, path) {
  if (!VM.emu || !VM.ready) return Promise.resolve("VM not ready");
  var id = Math.random().toString(36).slice(2, 8);
  var cmd =
    "echo ===H" +
    id +
    "=== && nc -w 2 127.0.0.1 " +
    port +
    "; echo; echo ===E" +
    id +
    "===\n";
  VM.emu.serial0_send(cmd);
  return new Promise((ok) => {
    VM.srv.pending[id] = ok;
    setTimeout(() => {
      if (VM.srv.pending[id]) {
        delete VM.srv.pending[id];
        ok("timeout: no response from port " + port);
      }
    }, 10000);
  });
};

// bridge: open.html requests → VM serial proxy
kit.ear('fetch',(eve)=>{
  var d = eve.detail||eve.data;
  if(!d || !d.port) return;
  VM.srv.fetch(d.port, d.path).then((html) => {
    kit.say(html, 'open');
  });
});