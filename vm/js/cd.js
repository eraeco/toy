// demo cmd: cd
demo.cmd.cd = async function(args){
  var path = args[0];
  if(null == path || '' === path) path = demo.home;
  try{
    var abs = demo.path.abs(path);
    var hit = await demo.opfs.exists(abs);
    if(!hit) return 'cd: ' + abs + ': No such file or directory\n';
    if('directory' !== hit.kind) return 'cd: ' + abs + ': Not a directory\n';
    demo.cwd = abs;
    try{ localStorage.setItem('demo.cwd', demo.cwd) }catch(e){}
    return '';
  }catch(e){
    return 'cd: ' + (e.message || e) + '\n';
  }
};
