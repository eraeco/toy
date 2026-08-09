// --- git clone --- // AUTHOR CREDIT: @abenezermario

VM.cmd.routes.push({
  match: /^git\s+clone\s+/,
  run: function (s, emu) {
    return VM.git.run(s, emu);
  }
});

VM.git = {};
VM.git.token = localStorage.gitToken || "";

VM.git.hosts = {
  "github.com": {
    tree: (o, r, b) =>
      "https://api.github.com/repos/" +
      o +
      "/" +
      r +
      "/git/trees/" +
      b +
      "?recursive=1",
    raw: (o, r, b, f) =>
      "https://raw.githubusercontent.com/" + o + "/" + r + "/" + b + "/" + f,
    auth: (h) =>
      VM.git.token ? { Authorization: "token " + VM.git.token } : {},
  },
  "gitlab.com": {
    tree: (o, r, b) =>
      "https://gitlab.com/api/v4/projects/" +
      encodeURIComponent(o + "/" + r) +
      "/repository/tree?ref=" +
      b +
      "&recursive=true&per_page=100",
    raw: (o, r, b, f) =>
      "https://gitlab.com/" + o + "/" + r + "/-/raw/" + b + "/" + f,
    auth: (h) => (VM.git.token ? { "PRIVATE-TOKEN": VM.git.token } : {}),
    parse: function (data) {
      return (data || []).map((f) => ({
        path: f.path,
        type: f.type === "tree" ? "tree" : "blob",
      }));
    },
  },
};

VM.git.run = function (cmd, emu) {
  var m = cmd.match(
    /^git\s+clone\s+(?:-b\s+(\S+)\s+)?(?:https?:\/\/)?(\w+\.\w+)\/([^\/\s]+)\/([^\s]+?)(?:\s+(\S+))?\s*$/,
  );
  if (!m) return false;
  var host = m[2],
    owner = m[3],
    repo = m[4].replace(/\.git$/, ""),
    branch = m[1] || "",
    dest = m[5] || "";
  var h = VM.git.hosts[host];
  if (!h) {
    VM.say("fatal: unsupported host '" + host + "'\n");
    emu.serial0_send("\n");
    return true;
  }
  VM.git.clone(emu, h, owner, repo, branch, dest);
  return true;
};

VM.git.clone = async function (emu, host, owner, repo, branch, dest) {
  dest = dest || "/root/" + repo;
  if (dest.charAt(0) !== "/") dest = "/root/" + dest;

  VM.say("Cloning into '" + dest.split("/").pop() + "'...\n");

  try {
    var branches = branch ? [branch, "main", "master"] : ["main", "master"];
    var tree, used;
    for (var i = 0; i < branches.length; i++) {
      var url = host.tree(owner, repo, branches[i]);
      var res = await fetch(url, { headers: host.auth() });
      if (res.ok) {
        var data = await res.json();
        tree = host.parse ? host.parse(data) : data.tree || [];
        used = branches[i];
        break;
      }
      if (res.status === 403) throw Error("API rate limit exceeded");
    }
    if (!tree) throw Error("repository '" + owner + "/" + repo + "' not found");

    var files = tree.filter((f) => f.type === "blob");
    var dirs = tree.filter((f) => f.type === "tree");
    var total = files.length;

    VM.say("remote: " + tree.length + " objects\n");

    VM.fs.dir(emu, dest);
    dirs.forEach((d) => VM.fs.dir(emu, dest + "/" + d.path));

    var done = 0;
    for (var j = 0; j < files.length; j += 8) {
      var batch = files.slice(j, j + 8);
      await Promise.all(
        batch.map(async (f) => {
          var url = host.raw(owner, repo, used, f.path);
          var r = await fetch(url, { headers: host.auth() });
          if (!r.ok) {
            VM.say("skip " + f.path + "\n");
            return;
          }
          await VM.fs.put(
            emu,
            dest + "/" + f.path,
            new Uint8Array(await r.arrayBuffer()),
          );
          done++;
          if (done % 25 === 0 || done === total)
            VM.say(
              "\r" +
                Math.round((done / total) * 100) +
                "% (" +
                done +
                "/" +
                total +
                ")",
            );
        }),
      );
    }
    VM.say("\ndone.\n");
    emu.serial0_send("ls " + dest + "\n");
  } catch (e) {
    VM.say("fatal: " + e.message + "\n");
    emu.serial0_send("\n");
  }
};
