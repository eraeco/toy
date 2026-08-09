// VM — browser Linux via v86
// boot, snapshot, filesystem, command intercepts, serial I/O, server proxy
// AUTHOR CREDIT: @abenezermario

window.VM = {};

;(function(){
  sign.onsubmit = async ()=>{
    if('vm' !== host.value){ return cop.sign() }
    cop.ws = 0;
    VM.boot({ tip: sign,
      say: (out) => { kit.say(out, 'chat') },
      onready: () => { location.path = 'shell.html' },
      onshim: (ws) => { cop.ws = ws;
        while((cop.limbo||[]).length){ cop.ws.send(cop.limbo.shift()) }
      }
    });
  }
}());

// --- config ---

VM.cdn = "https://cdn.jsdelivr.net/gh/abenezermario/v86-alpine@main";
VM.mem = 256;
VM.emu = null;
VM.ready = false;
VM.queue = [];
VM.say = function () {};

// --- snapshot (stub — add back as external feature) ---

VM.snap = {};
VM.snap.save = function () {
  return Promise.resolve();
};
VM.snap.load = function () {
  return Promise.resolve(null);
};

// --- filesystem ---
// Generic hook: set VM.fs.hook = { dir(emu, path), put(emu, path, data) }
// to swap the 9p backend (or any other store). Callers use VM.fs only.

VM.fs = {};
VM.fs.hook = null;

VM.fs.dir = function (emu, path) {
  if (VM.fs.hook && VM.fs.hook.dir) return VM.fs.hook.dir(emu, path);
  var parts = path.split("/").filter(Boolean);
  var cur = "";
  for (var i = 0; i < parts.length; i++) {
    cur += "/" + parts[i];
    var info = emu.fs9p.SearchPath(cur);
    if (info.id === -1) {
      var par = "/" + parts.slice(0, i).join("/") || "/";
      var pi = emu.fs9p.SearchPath(par);
      if (pi.id !== -1) emu.fs9p.CreateDirectory(parts[i], pi.id);
    }
  }
};

VM.fs.put = async function (emu, path, data) {
  if (VM.fs.hook && VM.fs.hook.put) return VM.fs.hook.put(emu, path, data);
  var dir = path.slice(0, path.lastIndexOf("/"));
  if (dir) VM.fs.dir(emu, dir);
  await emu.create_file(path, data);
};

// --- serial I/O ---

VM.io = {};

VM.io.buf = "";
VM.io.boot = 0;
VM.io.nonce = "";
VM.io.tip = null;
VM.io.primed = false; // true after first prompt seen

VM.io.listen = function (emu, say) {
  VM.io.buf = "";

  emu.add_listener("serial0-output-byte", (byte) => {
    var c = String.fromCharCode(byte);
    VM.io.buf += c;

    // boot log (before ready)
    if (VM.io.boot < 3 && VM.io.tip) {
      var lines = VM.io.buf.replace(/\x1b\[[^m]*m/g, "").split("\n");
      var last = lines[lines.length - 1] || lines[lines.length - 2] || "";
      if (last.trim()) VM.io.tip.textContent = last.trim().slice(0, 80);
    }

    // boot state machine
    if (VM.io.boot === 0 && VM.io.buf.includes("login:")) {
      VM.io.boot = 1;
      emu.serial0_send("root\n");
      VM.io.buf = "";
      return;
    }
    if (VM.io.boot === 1 && VM.io.buf.includes("~#")) {
      VM.io.boot = 2;
      emu.serial0_send("export PS1='$ '\n");
      VM.io.buf = "";
      return;
    }
    if (VM.io.boot === 2 && /\n\$ /.test(VM.io.buf)) {
      VM.io.done(emu, true);
      return;
    }

    // nonce detection (faster ready signal)
    if (VM.io.nonce && VM.io.buf.includes(VM.io.nonce)) {
      VM.io.done(emu);
      return;
    }

    // serial proxy response capture
    if (VM.io.buf.includes("===H")) {
      var m = VM.io.buf.match(/===H(\w+)===\r?\n([\s\S]*?)===E\1===/);
      if (m && VM.srv.pending[m[1]]) {
        var body = m[2].replace(/\r\n/g, "\n").trim();
        VM.srv.pending[m[1]](body);
        delete VM.srv.pending[m[1]];
        VM.io.buf = "";
        return;
      }
    }

    // debounced output to chat — wait for prompt before flushing
    if (window.vmSerial) clearTimeout(window.vmSerial);
    window.vmSerial = setTimeout(() => {
      if (!VM.ready) return;
      // don't flush while waiting for proxy response
      if (VM.io.buf.includes("===H") && Object.keys(VM.srv.pending).length)
        return;
      var out = VM.io.buf.replace(/\x1b\[6n/g, "");
      if (!out) {
        VM.io.buf = "";
        return;
      }
      var clean = out.replace(/\x1b\[[^m]*m/g, "");
      // hold output until we see a prompt ($ at end of line)
      if (!VM.io.primed && !/\$\s*$/.test(clean)) return;
      VM.io.primed = true;
      say(out);
      VM.srv.scan(out);
      VM.io.buf = "";
    }, 50);
  });

  // download progress
  var dl = {};
  emu.add_listener("download-progress", (e) => {
    if (!e.file_name || dl[e.file_name]) return;
    dl[e.file_name] = 1;
    if (VM.io.tip)
      VM.io.tip.textContent = "Loading " + e.file_name.split("/").pop();
  });
  emu.add_listener("download-error", (e) => {
    if (VM.io.tip)
      VM.io.tip.textContent = "Error: " + (e.file_name || e.message || e);
  });
};

VM.io.done = function (emu, fresh) {
  if (VM.io.tip) {
    VM.io.tip.textContent = "";
    VM.io.tip.style.display = "none";
  }
  VM.io.boot = 3;
  VM.io.buf = "";
  VM.ready = true;
  // flush queued commands (chat.html may have loaded before VM was ready)
  var flush = () => {
    if (kit.views && kit.views.size > 0) {
      while (VM.queue.length > 0) emu.serial0_send(VM.queue.shift());
    } else {
      requestAnimationFrame(flush);
    }
  };
  flush();
};

// --- shim (WebSocket replacement) ---

VM.shim = function (emu) {
  return {
    send: function (cmd) {
      if (cmd && !cmd.endsWith("\n") && !cmd.endsWith("\r")) cmd += "\n";
      var trimmed = (cmd || "").replace(/[\r\n]+$/, "").trim();
      if (VM.ready && VM.cmd.route(trimmed, emu)) return;
      if (!VM.ready) {
        VM.queue.push(cmd);
      } else {
        emu.serial0_send(cmd);
      }
    },
  };
};

// --- boot ---

VM.boot = function (opt) {
  opt = opt || {};
  var cdn = opt.cdn || VM.cdn;
  var mem = opt.mem || VM.mem;
  VM.say = opt.say || VM.say;
  VM.onready = opt.onready;
  VM.io.tip = opt.tip || null;

  if (VM.io.tip) {
    VM.io.tip.style.display = "block";
    VM.io.tip.textContent = "Loading VM...";
  }

  // pre-warm: start loading snapshot immediately
  var snapPromise = VM.snap.load();

  var s = document.createElement("script");
  s.src = cdn + "/build/libv86.js";
  s.onload = () => {
    snapPromise.then((state) => {
      if (VM.io.tip)
        VM.io.tip.textContent = state ? "Restoring..." : "Downloading...";

      var cfg = {
        wasm_path: cdn + "/build/v86.wasm",
        memory_size: mem * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        bios: { url: cdn + "/bios/seabios.bin" },
        vga_bios: { url: cdn + "/bios/vgabios.bin" },
        filesystem: {
          baseurl: cdn + "/images/alpine-rootfs-flat",
          basefs: cdn + "/images/alpine-fs.json",
        },
        bzimage_initrd_from_filesystem: true,
        cmdline:
          "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable mitigations=off random.trust_cpu=on console=ttyS0",
        net_device: { type: "virtio", relay_url: "fetch" },
        autostart: true,
        disable_keyboard: true,
        disable_mouse: true,
      };
      if (state) {
        cfg.initial_state = { buffer: state };
      }

      var emu = (VM.emu = window.emulator = new V86(cfg));

      // snapshot restore: skip boot detection
      if (state) {
        VM.io.boot = 3;
        emu.add_listener("emulator-ready", () => {
          VM.io.done(emu);
        });
      } else {
      }

      VM.io.listen(emu, VM.say);

      // create shim for app.html
      var ws = VM.shim(emu);
      // wait for vm/*.js plugs (git/npm/…) then open shell
      Promise.resolve(VM.mods).then(function(){
        if (opt.onshim) opt.onshim(ws);
        if (VM.onready) VM.onready();
      });
    });
  };
  document.head.appendChild(s);
};

VM.pkg = {};

// --- command intercepts ---

VM.cmd = {};

VM.cmd.routes = [];

VM.cmd.route = function (cmd, emu) {
  for (var i = 0; i < VM.cmd.routes.length; i++) {
    if (VM.cmd.routes[i].match.test(cmd)) {
      VM.cmd.routes[i].run(cmd, emu);
      return true;
    }
  }
  return false;
};

// --- plugs: load other vm/*.js (not boot, not demo) ---
// app.html only needs boot.js (+ demo.js for the demo host).
// Browsers cannot glob; we try a dir listing, else fall back to known names.

VM.base = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '') || 'vm/';
// skip these entry files when scanning
VM.skip = { boot: 1, demo: 1 };
// fallback if dir listing is unavailable (file://, no autoindex, etc.)
VM.plug = ['git', 'npm', 'pip', 'apk', 'srv'];
VM.got = {};

// inject one plug script once; missing file is ok
VM.load = function(name){
  name = (name || '').replace(/\.js$/i, '');
  if(!name || VM.skip[name] || VM.got[name]) return VM.got[name] || Promise.resolve(0);
  if(!/^[a-z][a-z0-9]*$/i.test(name)) return Promise.resolve(0);
  return (VM.got[name] = new Promise(function(yes){
    var s = document.createElement('script');
    s.src = VM.base + name + '.js';
    s.setAttribute('data-vm', name);
    s.onload = function(){ yes(1) };
    s.onerror = function(){ yes(0) };
    document.head.appendChild(s);
  }));
};

// discover *.js next to boot via HTML dir listing, else VM.plug
VM.scan = async function(){
  try{
    var r = await fetch(VM.base);
    if(!r.ok) throw Error('no dir');
    var t = await r.text();
    var seen = {}, out = [], m, re = /(?:href|src)=["']([^"']+\.js)["']/gi;
    while((m = re.exec(t))){
      var n = m[1].split('/').pop().replace(/\.js$/i, '');
      if(!n || VM.skip[n] || seen[n]) continue;
      if(!/^[a-z][a-z0-9]*$/i.test(n)) continue;
      seen[n] = 1;
      out.push(n);
    }
    if(out.length) return out;
  }catch(e){}
  return VM.plug.slice();
};

// start loading plugs as soon as boot core is defined
VM.mods = VM.scan().then(function(all){
  return Promise.all(all.map(function(n){ return VM.load(n) }));
});