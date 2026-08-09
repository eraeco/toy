// demo cmd: ls
demo.cmd.ls = async function(args){
  var f = demo.flag(args);
  var path = f.rest[0] || '.';
  try{
    var hit = await demo.opfs.exists(path);
    if(!hit) return demo.path.abs(path) + ': No such file or directory\n';
    if(hit.kind === 'file') return demo.path.base(demo.path.abs(path)) + '\n';
    var list = await demo.opfs.list(path);
    if(!list.length) return '';
    if(f.flags.indexOf('l') >= 0){
      return list.map(function(n){
        return (n.kind === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--') + '  demo  ' + n.name;
      }).join('\n') + '\n';
    }
    return list.map(function(n){
      return n.kind === 'directory' ? ('\x1b[01;34m' + n.name + '\x1b[0m') : n.name;
    }).join('\t') + '\n';
  }catch(e){
    return (e.message || e) + '\n';
  }
};
