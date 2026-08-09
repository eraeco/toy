// demo cmd: rm
demo.cmd.rm = async function(args){
  var f = demo.flag(args);
  if(!f.rest.length) return 'rm: missing operand\n';
  var deep = f.flags.indexOf('r') >= 0 || f.flags.indexOf('R') >= 0, i;
  for(i = 0; i < f.rest.length; i++){
    try{
      await demo.opfs.rm(f.rest[i], deep);
    }catch(e){
      return (e.message || e) + '\n';
    }
  }
  return '';
};
