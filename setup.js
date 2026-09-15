#!/usr/bin/env node
/**
 * One command to get running:   npm run setup
 *
 * Installs both halves of the app, then hands over to the database setup
 * (which runs inside the server folder, so its packages are available).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const b = (s) => `\x1b[1m${s}\x1b[0m`;
const d = (s) => `\x1b[2m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;

const run = (cmd, args, cwd) => new Promise((resolve, reject) => {
  const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: win });
  p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`"${cmd} ${args.join(' ')}" failed with code ${code}`))));
  p.on('error', reject);
});

try {
  console.log(`\n${b('  OBD Lighting — setup')}`);
  console.log(d('  Installing packages, then preparing the database.\n'));

  console.log(b('  [1/3] Installing the API packages…'));
  await run('npm', ['install', '--no-audit', '--no-fund'], path.join(root, 'server'));

  console.log(`\n${b('  [2/3] Installing the website packages…')}`);
  await run('npm', ['install', '--no-audit', '--no-fund'], path.join(root, 'client'));

  console.log(`\n${b('  [3/3] Database and admin account')}`);
  await run('npm', ['run', 'setup'], path.join(root, 'server'));
} catch (err) {
  console.error(`\n${r('  Setup stopped:')} ${err.message}`);
  console.error(d('  Fix the problem above and run  npm run setup  again.\n'));
  process.exitCode = 1;
}
