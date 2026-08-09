// demo cmd: cp
demo.cmd.cp = async function(args){
  var f = demo.flag(args);
  if(f.rest.length < 2) return 'cp: missing file operand\n';
  var deep = f.flags.indexOf('r') >= 0 || f.flags.indexOf('R') >= 0;
  var dst = f.rest[f.rest.length - 1], i;
  for(i = 0; i < f.rest.length - 1; i++){
    try{
      await demo.opfs.cp(f.rest[i], dst, deep);
    }catch(e){
      return (e.message || e) + '\n';
    }
  }
  return '';
};
