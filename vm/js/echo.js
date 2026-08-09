// demo cmd: echo
demo.cmd.echo = async function(args, line){
  var m = (line || '').match(/^(?:echo\s+)?([\s\S]*?)\s*(>>?)\s*(\S+)\s*$/);
  if(m){
    try{
      var text = demo.words(m[1]).join(' ');
      var dest = m[3].replace(/^['"]|['"]$/g, '');
      if('>>' === m[2]){
        var prev = '';
        try{ prev = await demo.opfs.readText(dest) }catch(e){}
        await demo.opfs.write(dest, prev + text + '\n');
      } else {
        await demo.opfs.write(dest, text + '\n');
      }
      return '';
    }catch(e){
      return 'echo: ' + (e.message || e) + '\n';
    }
  }
  return args.join(' ') + '\n';
};
