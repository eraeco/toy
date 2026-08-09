const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const os = require('os');

const outDir = path.join(__dirname, 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const envPrefix = `${os.platform()}-${os.arch()}`;
const fileName = `${envPrefix}_user-log.txt`;
const outFile = path.join(outDir, fileName);

console.log(`Generating interactive user log...`);

let output = '';
const ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: process.cwd(),
  env: process.env
});

ptyProcess.onData((data) => {
  output += data;
});

const commands = [
  'whoami',
  'ls --color=auto',
  'cd test',
  'ls --color=auto',
  'cd samples',
  'git status',
  'exit'
];

async function runSequence() {
  await new Promise(r => setTimeout(r, 500));
  
  for (const cmd of commands) {
    ptyProcess.write(cmd + '\r');
    await new Promise(r => setTimeout(r, 700)); 
  }
  setTimeout(() => ptyProcess.kill(), 1000);
}

runSequence();

ptyProcess.onExit(() => {
  fs.writeFileSync(outFile, output);
  console.log(`Saved user log output to ${outFile}`);
});
