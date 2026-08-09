// apk // AUTHOR CREDIT: @abenezermario

VM.cmd.routes.push({
  match: /^apk\s+add\s+/,
  run: function (s, emu) {
    return VM.pkg.apk.run(s, emu);
  },
});

VM.pkg.apk = {};

VM.pkg.apk.run = function (cmd, emu) {
  VM.say("apk add: not yet wired to a CORS mirror\n");
  VM.say("to add packages, rebuild the VM image\n");
  emu.serial0_send("\n");
  return true;
};