// demo cmd: touch
demo.cmd.touch = async function(args){
  if(!args.length) return 'touch: missing file operand\n';
  var i;
  for(i = 0; i < args.length; i++){
    try{
      var abs = demo.path.abs(args[i]);
      var hit = await demo.opfs.exists(abs);
      if(hit && hit.kind === 'directory') return 'touch: ' + abs + ': Is a directory\n';
      if(hit){
        var buf = await demo.opfs.read(abs);
        await demo.opfs.write(abs, buf);
      } else {
        await demo.opfs.write(abs, '');
      }
    }catch(e){
      return 'touch: ' + (e.message || e) + '\n';
    }
  }
  return '';
};
