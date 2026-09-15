#!/usr/bin/env node
/**
 * Runs the API and the website together:   npm run dev
 * Ctrl-C stops both.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';

const label = (name, color) => (line) =>
  line.toString().split('\n').filter(Boolean)
    .forEach((l) => console.log(`\x1b[${color}m${name}\x1b[0m  ${l}`));

function start(name, color, dir, args) {
  const p = spawn('npm', args, { cwd: path.join(root, dir), shell: win });
  p.stdout.on('data', label(name, color));
  p.stderr.on('data', label(name, color));
  return p;
}

console.log('\n  Starting the API and the website…\n');
const api = start('api ', '36', 'server', ['run', 'dev']);
const web = start('web ', '32', 'client', ['run', 'dev']);

const stop = () => { api.kill(); web.kill(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
api.on('close', stop);
web.on('close', stop);
