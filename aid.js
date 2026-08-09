;(function(){

shell.new('style').pin(0.1, shell).textContent = 'help{display:block;font-size:.85em;opacity:.85;margin:.35em 0;padding:.4em .5em;border-left:2px solid var(--pop);cursor:pointer;white-space:pre-wrap;word-break:break-word;touch-action:manipulation;filter:hue-rotate(220deg) brightness(2)}' + 'help:empty{display:none}';

shell.ear('join prompt', function(eve,r,s){
  eve.target.textContent = 'help ';
  eve.target.focus();
  (r = document.createRange()).selectNodeContents(eve.target);
  r.collapse(false);
  (s = getSelection()).removeAllRanges();
  s.addRange(r);
});

shell.ear('keyup',function(eve, $){ $ = shell.$;
  if(!eve.target.matches('prompt')){ return }
  if('help' !== $.textContent.slice(0,4).toLowerCase()){ return }
  if(shell.AI.wait){ clearTimeout(shell.AI.wait) }
  shell.AI.wait = setTimeout(async function(){try{
    var ask = $.textContent;
    var answer = await shell.AI.ask("1 sentence reply for terminal shell or code help:" + ask);
    var a = shell.AI.doc(answer), help = $.up().all('help')[0] || $.new('help').pin(1,$);
    help.textContent = a.textContent + " Tap to execute suggestion.";
    help.cmd = (a.all('code')[0]||a.all('b')[0]||'').textContent||'';
  }catch(e){}},99+(Math.random()*250));
});

shell.ear('click', function(eve, help){
  if(!(help = eve.target.up('help')[0])){ return }
  if(!help.cmd){ return }
  shell.$ = help.up().all('prompt')[0];
  kit.say(help.cmd, 'prompt');
});

var lS = localStorage;
shell.AI = {
  async txt(url, res){
    res = await fetch(url);
    return await res.text();
  },
  async ask(q){
    return this.txt((lS.aisk||"https://ch.at/")+encodeURIComponent(q));
  },
  async spell(w){
    return this.ask('TEXT ONLY NO HTML spell correct & add next predicted word to this sentence: '+w);
  },
  doc(a){
    a = new DOMParser().parseFromString(a, 'text/html');
    return (a=a.body||a).all('.a')[0]||a;
  },
  async code(q, code, path, res, data, one, msg){ console.log("ask OR", q, code, path);
      res = await fetch(lS.aipi||"https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { "Authorization": "Bearer "+await shell.AI.key(), "Content-Type": "application/json",
        //'HTTP-Referer': window.location.href, // be ranked?
        'X-Title': 'Code on Phone'
      }, body: JSON.stringify({
        model: lS.aimodel||"openrouter/free",
        messages: [{role:'system',content:"IMPORTANT: REPLY WITH ONLY CODE, NO EXPLAIN!!! You are a super genius John Carmack but of "+(path||"performance coding")+", it has 10M+ monthly users on decade+ old low end netbooks, so help me with blazing fast, low dependency, simple clean code for: ```"+code},{role: "user", content: q}],
        max_tokens: 100_000,
        temperature: 0.7,
        stream: false
      }),
    });
    data = await res.json();
    one = (((data || {}).choices || [])[0] || {});
    msg = (one.message || {}).content;
    return msg || JSON.stringify(data);
  },
  async key(){
    return key || (key = lS.aikey || (lS.aikey = await UI.prompt(`AI API key?`)));
  }
}

}());