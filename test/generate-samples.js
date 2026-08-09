const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const outDir = path.join(__dirname, 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Function to try to get a version string for a command
function getVersion(cmd) {
  try {
    if (cmd === 'bash') {
      return execSync('bash -c "echo $BASH_VERSION"').toString().trim().split('(')[0].replace(/[^0-9.]/g, '') || 'unknown';
    }
    const out = execSync(`${cmd} --version`).toString().trim();
    const match = out.match(/[0-9]+\.[0-9]+(\.[0-9]+)?/);
    return match ? match[0] : 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

const envPrefix = `${os.platform()}-${os.arch()}`;

const tests = [
  { name: 'ls_color', cmd: 'ls', args: ['--color=always', '-la'] },
  { name: 'git_status', cmd: 'git', args: ['status'] },
  { name: 'ping', cmd: 'ping', args: ['-c', '3', 'localhost'] },
  { name: 'npm_install', cmd: 'npm', args: ['install', '--dry-run'] },
  { name: 'echo_colored', cmd: 'bash', args: ['-c', 'echo -e "\\\\e[31mRed\\\\e[0m \\\\e[32mGreen\\\\e[0m \\\\e[34mBlue\\\\e[0m"'] },
  { name: 'nano', cmd: 'nano', args: [] },
  { name: 'top', cmd: 'top', args: [] },
  { name: 'screen', cmd: 'screen', args: [] },
  { name: 'codex', cmd: 'codex', args: [] },
  { name: 'node_repl', cmd: 'node', args: ['-i'] },
  { name: 'python_repl', cmd: 'python', args: ['-i'] }
];

async function runCommand(test) {
  return new Promise((resolve, reject) => {
    const version = getVersion(test.cmd);
    const fileName = `${envPrefix}_${test.name}_${version}.txt`;
    console.log(`Running ${test.name} (version ${version})...`);
    
    let output = '';
    let ptyProcess;
    
    try {
      ptyProcess = pty.spawn(test.cmd, test.args, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env
      });
    } catch (e) {
      console.error(`Failed to spawn ${test.name}: ${e.message}`);
      return resolve();
    }

    ptyProcess.onData((data) => {
      output += data;
    });

    let resolved = false;

    ptyProcess.onExit(({ exitCode, signal }) => {
      if (resolved) return;
      resolved = true;
      const outFile = path.join(outDir, fileName);
      fs.writeFileSync(outFile, output);
      console.log(`Saved ${test.name} output to ${outFile}`);
      resolve();
    });
    
    // For interactive apps, wait a bit, then kill to capture screen state.
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      try { ptyProcess.kill(); } catch(e) {}
      const outFile = path.join(outDir, fileName);
      fs.writeFileSync(outFile, output);
      console.log(`Timeout: Saved partial ${test.name} output to ${outFile}`);
      resolve();
    }, 2000);
  });
}

async function runAll() {
  const pick = process.argv.slice(2);
  for (const test of tests.filter((one) => !pick.length || pick.includes(one.name))) {
    await runCommand(test);
  }
  console.log(`All samples generated in: ${outDir}`);
}

runAll();
