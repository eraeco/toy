// demo cmd: cat
demo.cmd.cat = async function(args){
  if(!args.length) return 'cat: missing file operand\n';
  var out = '', i;
  for(i = 0; i < args.length; i++){
    try{
      var hit = await demo.opfs.exists(args[i]);
      if(!hit) return 'cat: ' + demo.path.abs(args[i]) + ': No such file or directory\n';
      if(hit.kind === 'directory') return 'cat: ' + demo.path.abs(args[i]) + ': Is a directory\n';
      var text = await demo.opfs.readText(args[i]);
      out += text;
      if(text && '\n' !== text.slice(-1)) out += '\n';
    }catch(e){
      return 'cat: ' + (e.message || e) + '\n';
    }
  }
  return out;
};
