const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'work', 'vite.log');
const out = fs.openSync(logPath, 'a');

const child = spawn(process.execPath, [
  path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  '--host',
  '127.0.0.1',
], {
  cwd: root,
  detached: true,
  stdio: ['ignore', out, out],
  windowsHide: true,
});

child.unref();
fs.appendFileSync(logPath, `\nStarted Vite child PID ${child.pid}\n`);
