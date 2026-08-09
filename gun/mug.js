;(function(){
function mug(as, g, tmp){
	if('string' == typeof as){ as = {raw: as, mug: g||mug.JS} }
	mug.esc(as = as || {raw: text, mug: g||mug.JS});
	mug.down(as);
	mug.sep(as);
	return as;
}; MUG = mug;
mug.start = function(list, text, is){
	if(!list.__re){
		var q = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		list.__re = new RegExp(Object.keys(list).filter(k=>k!='__re').sort((a,b)=>b.length-a.length).map(q).join('|'));
	}
	var m = list.__re.exec(text);
	return m ? {start: m[0], at: m.index, end: list[m[0]].end} : 0;
};
mug.end = function(key, text, i){ i = (i||0)-1;
	while((i = text.indexOf(key.end||key.start||key, i+1))>=0){
		if(!(mug.retro(text,i) % 2)){ break }
	}; return i+1;
}
mug.retro = function(t,i,l,c){ c=0; while((l||'\\') == t[--i]){ c++ } return c }
mug.flat = function(as){ var r = [];
  while(as){
    if(as.raw != null){ r.push(as.raw) }
    as = as.next;
  }
  return r;
}
mug.esc = function(as, esc, tmp){
	if(!as){ return }
	if(esc = as.escape){
		if(!(tmp = mug.end(esc, as.raw, 1))){console.warn("`"+esc.start+"` escape has no matching ending at", as);return}
		as.next = {back: as, raw: as.raw.slice(tmp-1+(esc.end||esc.start).length), top: as.top||as};
		as.raw = as.raw.slice(0,tmp-1+(esc.end||esc.start).length);
		mug.esc(as.next);
		return as;
	};
	esc = mug.start((as.top||as).mug.escape, as.raw);
	if(!esc){ return as };
	as.next = {back: as, raw: as.raw.slice(esc.at), escape: esc, top: as.top||as};
	as.raw = as.raw.slice(0,esc.at);
	mug.esc(as.next);
	return as;
};
C = 1;
mug.down = function(as, start, end, tmp){ 
	if(!as){ return }
	if(as.escape){ as.next.up = as.up; mug.down(as.next); return }
	start = mug.start((as.top||as).mug.down, as.raw);
	if((end = tmp = (as.up||'').down) && (end = mug.end(end, as.raw)) && (!start || end <= start.at)){
		as.next = {raw: as.raw.slice(end-1, end-1+tmp.end.length), up: as.up, next: {
			raw: as.raw.slice(end-1+tmp.end.length), up: (as.up||'').up, next: as.next, top: as.top||as
		}, top: as.top||as};
		as.raw = as.raw.slice(0, end-1);
		// TODO: BUG? assure if !as.raw that next/back links correct
		as.next.back = as; as.next.next.back = as.next;
		if(!as.raw.length){ (as.back||'').next = as.next; as.next.back = as.back }
		as.up.end = as.next;
		mug.down(as.next.next);
		return;
	}
	if(!start){ (as.next||'').up = as.up; return mug.down(as.next) }
	as.next = {raw: as.raw.slice(start.at, start.at + start.start.length), down: start, up: as.up, next: {
		raw: as.raw.slice(start.at + start.start.length), next: as.next, top: as.top||as
	}, top: as.top||as};
	as.raw = as.raw.slice(0, start.at);
	// TODO: BUG? assure if !as.raw that next/back links correct
	as.next.back = as; as.next.next.back = as.next;
	if(!as.next.next.raw.length){ as.next.next = as.next.next.next; as.next.next.back = as.next; }
	if(!as.raw.length){ (as.back||'').next = as.next; as.next.back = as.back; }
	as.next.next.up = as.next;
	//console.log("START?", as.raw+'|'+as.next.raw+'|'+as.next.next.raw);
	mug.down(as.next.next);
};
mug.sep = function(as, sep, tmp){
	if(!as){ return }
	if(as.escape || as.down){ as.next && (as.next.up = as.up); return mug.sep(as.next) }
	sep = mug.start((as.top||as).mug.separate, as.raw);
	if(!sep){ 
		if(as.raw && (as.top||as).mug.key && (as.top||as).mug.key[as.raw]) as.key = (as.top||as).mug.key[as.raw];
		return mug.sep(as.next) 
	}
	
	as.next = {raw: as.raw.slice(sep.at, sep.at + sep.start.length), sep: sep, up: as.up, next: {
		raw: as.raw.slice(sep.at + sep.start.length), up: as.up, next: as.next, top: as.top||as
	}, top: as.top||as};
	as.raw = as.raw.slice(0, sep.at);
	
	as.next.back = as; as.next.next.back = as.next;
	if(!as.next.next.raw.length){ as.next.next = as.next.next.next; if(as.next.next) as.next.next.back = as.next; }
	if(!as.raw.length){
		if(as.back){ as.back.next = as.next; as.next.back = as.back; }
		if(as.up && as.up.down === as){ as.up.down = as.next; }
	} else {
		if((as.top||as).mug.key && (as.top||as).mug.key[as.raw]) as.key = (as.top||as).mug.key[as.raw];
	}
	mug.sep(as.next.next);
}
mug.all = { is: {}, not: {}, next: '. ', split: {} }

// GEMINI: developers should be able to define & describe their programming language with this format:
mug.JS = {
	escape: { "'": {}, '"': {}, '`': {}, '//': {end: '\n'}, '/*': {end: '*/'}, '/': {} },
	down: { '{': {end: '}'}, '(': {end: ')'}, '[': {end: ']'} },
	separate: {
		'\n': {},
		'\t': {},
		' ': {},
		
		'...': {},
		'>>>': {},
		'===': {},
		'!==': {},
		'**=': {},
		'==': {},
		'+=': {},
		'-=': {},
		'*=': {},
		'/=': {},
		'%=': {},
		'>=': {},
		'<=': {},
		'=>': {},
		
		'++': {},
		'--': {},
		'**': {},
		'&&': {},
		'||': {},
		'<<': {},
		'>>': {},
		'?.': {},

		';': {},
		',': {},
		':': {},
		'.': {},
		'!': {},
		'=': {},
		'>': {},
		'<': {},
		'-': {},
		'+': {},
		'*': {},
		'/': {},
		'?': {},
		'%': {},
		'^': {},
		'&': {},
		'|': {},
		'~': {}
	},
	key: {
		'import': {},
		'from': {},
		'as': {},

		'function': {},
		'return': {},
		'async': {},
		'await': {},
		'yield': {},
		'case': {},
		'break': {},
		'switch': {},
		'default': {},
		'continue': {},

		'var': {},
		'let': {},
		'const': {},

		'undefined': {},
		'null': {},

		'else': {},
		'if': {},
		'do': {},
		'for': {},
		'while': {},

		'throw': {},
		'finally': {},
		'catch': {},
		'try': {},

		'instanceof': {},
		'typeof': {},

		'constructor': {},
		'extends': {},
		'static': {},
		'super': {},
		'class': {},
		'this': {},
		'get': {},
		'set': {},
		'new': {},
		
		'delete': {},
		'in': {},
		'of': {},
		'void': {}
	}
}
// GEMINI: Bonus points (but do not do it yet) suggest how we can support Python style indentation based down nesting.
/* 
Suggestion for Python-style indentation:
To support indentation-based down nesting (like Python), we can treat the leading whitespace on newlines as "virtual brackets".
1. Instead of explicit '{' and '}' characters in `down`, we define a custom pass or use a RegExp separator like `\n[ \t]*` to measure indentation level.
2. When the indentation level increases compared to the current block, we push a virtual "START_BLOCK" node (acting like '{') into the stream and set it as `down`.
3. When the indentation level decreases, we push one or more virtual "END_BLOCK" nodes (acting like '}') into the stream to close out the `up` blocks until the current block's indentation matches.
4. This can be integrated either as an early normalization pass that injects virtual brackets, or dynamically within `mug.down` by keeping a stack of indentation widths and tracking `\n[ \t]*` sequences.
*/


var Text = {prototype:{}}; Text.prototype.cut = function(f, e, c){ e = e||{}, c = c||'\\';
  var q = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), L = v => ('string' == typeof v)?[v]:v,
  	P = Object.entries(e).map(([k, v]) => q(k)+'[^]*?(?:'+L(v.end||v||k).map(q).join('|')+'|$)').concat(c? q(c)+'[^]' : []),
  	R = new RegExp((P.length? '(?:'+P.join('|')+')|' : '') + '('+L(f).sort((a, b) => b.length - a.length).map(q).join('|')+')', 'g'), m;
  for(;m = R.exec(this);){ if(m[1]){ return [this.slice(0,m.index), m[1], this.slice(m.index+m[1].length)] } }
  return ['','',''+this];
};

}());