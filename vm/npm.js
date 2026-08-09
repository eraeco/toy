// npm // AUTHOR CREDIT: @abenezermario

VM.cmd.routes.push({
  match: /^npm\s+install\s+/,
  run: function (s, emu) {
    return VM.pkg.npm.run(s, emu);
  }
});

VM.pkg.npm = {};
VM.pkg.npm.got = {};

// skip paths jsdelivr blocks or that are useless in a browser shell
VM.pkg.npm.skip = function (f) {
  if (!f || /[\x00-\x1f\x7f]/.test(f)) return 1;
  if (
    /\.(jar|war|exe|dll|so|dylib|node|o|a|lib|class|bat|cmd|ps1|apk|aab|zip|gz|tgz|7z|rar|woff2?|ttf|eot|ico|png|jpe?g|gif|webp|mp[34]|wav|ogg|wasm|map)$/i.test(
      f,
    )
  )
    return 1;
  if (/\/(android|ios|gradle|\.gradle|Pods|react-native\/android|react-native\/ios)\//i.test(f))
    return 1;
  if (/gradlew(\.bat)?$/i.test(f)) return 1;
  return 0;
};

VM.pkg.npm.run = function (cmd, emu) {
  var m = cmd.match(/^npm\s+install\s+(.+)/);
  if (!m) return false;
  VM.pkg.npm.exec(m[1].trim().split(/\s+/), emu);
  return true;
};

VM.pkg.npm.exec = async function (names, emu) {
  VM.pkg.npm.got = {};
  var base = "/root",
    t = Date.now();
  // complete leftover prompt: "~ $ " + this line (VM.shim does not re-echo the typed cmd)
  VM.say("npm install " + names.join(" ") + "\n");
  for (var i = 0; i < names.length; i++) {
    var raw = names[i].replace(/^--.*/, "");
    if (!raw) continue;
    var at = raw.lastIndexOf("@");
    // scoped @org/pkg: only split version when @ is after the name
    var name, ver;
    if (raw.charAt(0) === "@") {
      var cut = raw.indexOf("@", 1);
      if (cut > 0) {
        name = raw.slice(0, cut);
        ver = raw.slice(cut + 1) || "latest";
      } else {
        name = raw;
        ver = "latest";
      }
    } else {
      name = at > 0 ? raw.slice(0, at) : raw;
      ver = at > 0 ? raw.slice(at + 1) : "latest";
    }
    try {
      await VM.pkg.npm.one(name, ver, emu, 0, base);
    } catch (e) {
      VM.say("ERR " + e.message + "\n");
    }
  }
  var n = Object.keys(VM.pkg.npm.got).length;
  VM.say(
    "added " +
      n +
      " packages in " +
      ((Date.now() - t) / 1000).toFixed(1) +
      "s\n",
  );
  // re-prompt only (same as git) — not "echo done" which muddies the npm unit
  emu.serial0_send("\n");
};

VM.pkg.npm.one = async function (name, ver, emu, depth, base) {
  if (VM.pkg.npm.got[name]) return;
  VM.pkg.npm.got[name] = 1;
  var pad = "  ".repeat(depth || 0);
  var meta;

  try {
    var res = await fetch("https://registry.npmjs.org/" + name + "/latest");
    if (!res.ok) res = await fetch("https://registry.npmjs.org/" + name);
    if (!res.ok) return;
    meta = await res.json();
    ver = meta.version || (meta["dist-tags"] || {}).latest;
    if (!ver) return;
  } catch (e) {
    return;
  }

  VM.say(pad + "+ " + name + "@" + ver + "\n");

  var tree = await fetch(
    "https://data.jsdelivr.com/v1/packages/npm/" + name + "@" + ver,
  );
  if (!tree.ok) return;
  var files = [];
  var flat = (arr, pre) => {
    (arr || []).forEach((f) => {
      var p = pre + "/" + f.name;
      if (f.type === "directory") flat(f.files, p);
      else if (!VM.pkg.npm.skip(p)) files.push(p);
    });
  };
  flat((await tree.json()).files, "");

  var dest = base + "/node_modules/" + name;
  VM.fs.dir(emu, dest);

  for (var j = 0; j < files.length; j += 12) {
    var batch = files.slice(j, j + 12);
    await Promise.all(
      batch.map(async (f) => {
        try {
          var r = await fetch(
            "https://cdn.jsdelivr.net/npm/" + name + "@" + ver + f,
          );
          if (!r.ok) return;
          await VM.fs.put(emu, dest + f, new Uint8Array(await r.arrayBuffer()));
        } catch (e) {}
      }),
    );
  }

  var deps = Object.keys(meta.dependencies || {});
  for (var k = 0; k < deps.length; k++) {
    await VM.pkg.npm.one(deps[k], "latest", emu, (depth || 0) + 1, base);
  }
};