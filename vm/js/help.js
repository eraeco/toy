// demo cmd: help
demo.cmd.help = async function(){
  return [
    'demo shell — OPFS + VM routes',
    '  ls cd pwd cat touch mkdir rm cp echo clear help',
    '  git clone <url>     (vm/git.js → OPFS)',
    '  npm install <pkg>   (vm/npm.js → OPFS)',
    '  pip install / apk   (stubs)',
    ''
  ].join('\n');
};
