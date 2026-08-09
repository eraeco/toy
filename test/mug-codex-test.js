const fs = require('fs');
const vm = require('vm');
const perf = require('perf_hooks').performance;

const dir = __dirname + '/..';

function load(){
	const as = {console, performance: perf};
	vm.createContext(as);
	vm.runInContext(fs.readFileSync(dir + '/gun/mug-codex.js', 'utf8'), as);
	return as;
}

function same(a, b){
	return JSON.stringify(a) === JSON.stringify(b);
}

function fail(msg, got, want){
	console.error('\nFAIL:', msg);
	if(arguments.length > 1){ console.error('got ', JSON.stringify(got)); }
	if(arguments.length > 2){ console.error('want', JSON.stringify(want)); }
	process.exitCode = 1;
}

function ok(msg, yes, got, want){
	if(yes){ console.log('ok', msg); return }
	fail(msg, got, want);
}

function no(fn, key){
	return function(k, v){
		if(k == 'top' || k == 'back' || k == 'next' || k == 'open' || k == 'up' || k == 'shut' || k == 'nest' || k == 'mug' || k == 'map'){ return }
		return fn? fn(k, v) : v;
	}
}

const as = load();
const MUG = as.MUG;

function mug(src){
	return as.mug(src);
}

function link(src){
	const ast = mug(src);
	let last, yes = true;
	for(let n = ast; n; n = n.next){
		if(n.back !== last){ yes = false }
		if(n.form && !n.shut){ yes = false }
		if(n.open && !n.open.form){ yes = false }
		last = n;
	}
	return {ast, yes};
}

(function(){
	const ast = mug('a = 2');
	ok('space fuses into operator', same(MUG.flat(ast), ['a', ' = ', '2']), MUG.flat(ast), ['a', ' = ', '2']);
	ok('space fused num matches flat', ast.num === 3, ast.num, 3);
	ok('space fused text', MUG.text(ast.run) == 'a = 2', MUG.text(ast.run), 'a = 2');
	ok('grammar node top points to top', ast.next.top === ast, !!ast.next.top, true);
	ok('only top stores grammar', !ast.next.mug && ast.top.mug, !!ast.next.mug, false);
}());

(function(){
	const ast = mug('as = {raw: {js: as}, mug: g||mug.JS}');
	const rhs = ast.run[0].J;
	ok('object literal is nest', rhs.type == 'nest', rhs.type, 'nest');
	ok('object literal splits properties', rhs.run.length == 2, rhs.run.length, 2);
	ok('object properties are pairs', same(rhs.run.map(n => n.op), [':', ':']), rhs.run.map(n => n.op), [':', ':']);
	ok('object property left sides', same(rhs.run.map(n => MUG.text(n.L)), ['raw', 'mug']), rhs.run.map(n => MUG.text(n.L)), ['raw', 'mug']);
	ok('object second property keeps binary right side', MUG.text(rhs.run[1].J) == 'g || mug.JS', MUG.text(rhs.run[1].J), 'g || mug.JS');
}());

(function(){
	const ast = mug('var x = 1 + 2 * 3');
	ok('precedence text', MUG.text(ast.run) == 'x = 1 + 2 * 3', MUG.text(ast.run), 'x = 1 + 2 * 3');
	ok('top op assignment', ast.run[0].op == '=', ast.run[0].op, '=');
	ok('right op addition', ast.run[0].J.op == '+', ast.run[0].J.op, '+');
	ok('multiply under addition', ast.run[0].J.J.op == '*', ast.run[0].J.J.op, '*');
}());

(function(){
	const ast = mug('a = b = c');
	ok('assignment is right associative', ast.run[0].J.op == '=', ast.run[0].J.op, '=');
}());

(function(){
	let ast = mug('return /x+/');
	ok('regex stays escape value', ast.run[0].J.escape && ast.run[0].J.escape.start == '/', ast.run[0].J.escape && ast.run[0].J.escape.start, '/');
	ast = mug('x / y / z');
	ok('division stays binary op', ast.run[0].op == '/' && ast.run[0].L.op == '/', [ast.run[0].op, ast.run[0].L && ast.run[0].L.op], ['/', '/']);
}());

(function(){
	const ast = mug('add = async function(a,b){ return a + b }; add(1, 2)');
	ok('function sample has two top runs', ast.run.length == 2, ast.run.length, 2);
	ok('function assignment top op', ast.run[0].op == '=', ast.run[0].op, '=');
	ok('call op is function name', ast.run[1].op == 'add', ast.run[1].op, 'add');
	ok('run item has abstract up', ast.run[1].up === ast.run, !!ast.run[1].up, true);
	ok('top run has top', ast.run.top === ast, !!ast.run.top, true);
	ok('argument run has top', ast.run[1].J.top === ast, !!ast.run[1].J.top, true);
}());

(function(){
	const got = link('arr = [1,2,{a:3}]');
	ok('linked graph back/shut integrity', got.yes);
	ok('array literal keeps three items', got.ast.run[0].J.run.length == 3, got.ast.run[0].J.run.length, 3);
	ok('nested item open points to opener', got.ast.run[0].J.nest.open === got.ast.run[0].J, !!got.ast.run[0].J.nest.open, true);
}());

(function(){
	const g = {
		escape: {},
		nest: {},
		term: {' ': {sep: 1}, '=': {rank: 1, side: 'right'}}
	};
	const ast = as.mug('a = b', g);
	ok('compact term grammar works', ast.run[0].op == '=', ast.run[0].op, '=');
	ok('compact term grammar fuses space', same(MUG.flat(ast), ['a', ' = ', 'b']), MUG.flat(ast), ['a', ' = ', 'b']);
}());

(function(){
	const src = fs.readFileSync(dir + '/gun/mug-codex.js', 'utf8');
	const t = perf.now();
	const ast = mug(src);
	const ms = perf.now() - t;
	ok('parser parses itself', ast.run.length > 0, ast.run.length);
	ok('parser self parse under 100ms', ms < 100, ms, '<100');
	console.log('self parse ms', ms.toFixed(2));
}());

(function(){
	const line = 'var x = 1 + 2 * 3;\n';
	const src = line.repeat(5000);
	const t = perf.now();
	const ast = mug(src);
	const ms = perf.now() - t;
	ok('large line sample run count', ast.run.length == 5000, ast.run.length, 5000);
	ok('large line sample under 250ms', ms < 250, ms, '<250');
	console.log('large parse ms', ms.toFixed(2));
}());

(function(done){
	const html = fs.readFileSync(dir + '/toy.html', 'utf8');
	const src = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1];
	const el = () => ({
		value: 'as = {raw: {js: as}, mug: g||mug.JS}',
		cloneNode(){ return el() },
		removeAttribute(){},
		appendChild(){},
		addEventListener(){},
		querySelector(){ return null },
		closest(){ return null },
		focus(){},
		className: '',
		style: {},
		textContent: '',
		dataset: {},
		classList: {add(){}, remove(){}}
	});
	const win = {document: {getElementById: id => el(), createElement: () => el(), createTextNode: s => ({textContent: s}), querySelector: () => null, addEventListener(){}, body: el()}, console, performance: {now: () => Date.now()}, localStorage: {}, navigator: {clipboard: {}}, setTimeout};
	win.window = win;
	win.addEventListener = function(){};
	vm.createContext(win);
	vm.runInContext(fs.readFileSync(dir + '/gun/mug-codex.js', 'utf8'), win);
	vm.runInContext(src, win);
	setTimeout(() => {
		ok('toy html script smoke', true);
		if(done){ done() }
	}, 20);
}());

setTimeout(() => {
	if(process.exitCode){ process.exit(process.exitCode) }
	console.log('\nMUG tests passed');
}, 40);
