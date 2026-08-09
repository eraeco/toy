// demo cmd: mkdir
demo.cmd.mkdir = async function(args){
  var f = demo.flag(args);
  if(!f.rest.length) return 'mkdir: missing operand\n';
  var deep = f.flags.indexOf('p') >= 0, i, abs, hit;
  for(i = 0; i < f.rest.length; i++){
    try{
      abs = demo.path.abs(f.rest[i]);
      hit = await demo.opfs.exists(abs);
      if(hit){
        if(deep && hit.kind === 'directory') continue;
        return 'mkdir: ' + abs + ': File exists\n';
      }
      if(deep){
        await demo.opfs.mkdirp(abs);
      } else {
        var par = demo.path.up(abs);
        var pHit = await demo.opfs.exists(par);
        if(!pHit || pHit.kind !== 'directory') return par + ': No such file or directory\n';
        await demo.opfs.mkdirp(abs);
      }
    }catch(e){
      return (e.message || e) + '\n';
    }
  }
  return '';
};
