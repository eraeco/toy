// pip // AUTHOR CREDIT: @abenezermario

VM.cmd.routes.push({
  match: /^pip\s+install\s+/,
  run: function (s, emu) {
    return VM.pkg.pip.run(s, emu);
  },
});

VM.pkg.pip = {};

VM.pkg.pip.run = function (cmd, emu) {
  var m = cmd.match(/^pip\s+install\s+(.+)/);
  if (!m) return false;
  VM.pkg.pip.exec(m[1].trim().split(/\s+/), emu);
  return true;
};

VM.pkg.pip.exec = async function (names, emu) {
  VM.say("pip install " + names.join(" ") + "\n");
  for (var i = 0; i < names.length; i++) {
    var name = names[i].replace(/^--.*/, "");
    if (!name) continue;
    try {
      var res = await fetch("https://pypi.org/pypi/" + name + "/json");
      if (!res.ok) {
        VM.say("ERR: package '" + name + "' not found\n");
        continue;
      }
      var meta = await res.json();
      var ver = meta.info.version;
      // find pure-python wheel or sdist
      var urls = (meta.urls || []).filter(
        (u) =>
          u.packagetype === "bdist_wheel" && u.filename.includes("none-any"),
      );
      if (!urls.length)
        urls = (meta.urls || []).filter((u) => u.packagetype === "sdist");
      if (!urls.length) {
        VM.say("ERR: no compatible dist for " + name + "\n");
        continue;
      }
      VM.say("+ " + name + "@" + ver + " (pure-python only)\n");
      // TODO: download and extract wheel/sdist into /usr/lib/python3/
      VM.say("note: pip install via browser is experimental\n");
    } catch (e) {
      VM.say("ERR " + e.message + "\n");
    }
  }
  emu.serial0_send("\n");
};