const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'samples');
const util = fs.readFileSync(path.join(__dirname, '..', 'util.js'), 'utf8');
eval(util.match(/String\.prototype\.tty = function[\s\S]*?\n};/)[0]);
const all = fs.readdirSync(dir);
const files = all.filter((name) => /_(nano|top|screen|codex)_/.test(name));
const plain = all.filter((name) => /_(echo_colored|ls_color)_/.test(name));

assert(files.length, 'terminal samples exist');
files.forEach((name) => {
  const raw = fs.readFileSync(path.join(dir, name), 'utf8');
  assert(raw.tty(), name + ' is detected as a terminal takeover');
  console.log('PASS', raw.tty(), name);
});
plain.forEach((name) => {
  const raw = fs.readFileSync(path.join(dir, name), 'utf8');
  assert.strictEqual(raw.tty(), '', name + ' stays in normal output');
  console.log('PASS text', name);
});
