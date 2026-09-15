/**
 * Prepares the database and your admin login.
 *
 * Run from the project root with `npm run setup`, or on its own:
 *     cd server && npm run setup
 *
 * Safe to run again — it never duplicates anything, and running it a second
 * time with the same email simply resets that password.
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..');
const dbDir = path.resolve(serverDir, '../database');
const envPath = path.join(serverDir, '.env');

const c = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
};

const rl = readline.createInterface({ input, output });
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

try {
  /* ---------- 1. connection details, saved to .env ---------- */
  if (!existsSync(envPath)) {
    writeFileSync(envPath, readFileSync(path.join(serverDir, '.env.example'), 'utf8'));
  }
  let env = readFileSync(envPath, 'utf8');
  const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [, ''])[1].trim();
  const set = (k, v) => {
    env = env.match(new RegExp(`^${k}=`, 'm'))
      ? env.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`)
      : `${env}\n${k}=${v}`;
  };

  console.log(`\n${c.b('  MySQL connection')}`);
  console.log(c.d('  Press Enter to keep the value shown in brackets.'));

  const ask = async (label, key, fallback) => {
    const now = get(key) || fallback;
    const answer = (await rl.question(`  ${label.padEnd(11)}[${now}] : `)).trim();
    return answer || now;
  };

  const host = await ask('Host', 'DB_HOST', '127.0.0.1');
  const port = await ask('Port', 'DB_PORT', '3306');
  const user = await ask('User', 'DB_USER', 'root');
  const passAnswer = (await rl.question('  Password   (blank if none) : ')).trim();
  const password = passAnswer || get('DB_PASSWORD');
  const database = await ask('Database', 'DB_NAME', 'obd_lighting');

  set('DB_HOST', host); set('DB_PORT', port); set('DB_USER', user);
  set('DB_PASSWORD', password); set('DB_NAME', database);
  if (!get('JWT_SECRET') || get('JWT_SECRET').startsWith('change-me')) {
    set('JWT_SECRET', randomBytes(48).toString('base64url'));
    console.log(c.d('  Generated a random JWT_SECRET for you.'));
  }
  writeFileSync(envPath, env);

  /* ---------- 2. tables ---------- */
  console.log(`\n${c.b('  Creating the database and tables…')}`);
  const conn = await mysql.createConnection({
    host, port: Number(port), user, password, multipleStatements: true,
  });

  const sql = (f) => readFileSync(path.join(dbDir, f), 'utf8');
  await conn.query(sql('schema.sql'));
  await conn.query(`USE \`${database}\`;`);
  await conn.query(sql('seed.sql'));

  // Count what actually landed, so this line can never drift from the seed file.
  const [[counts]] = await conn.query(
    'SELECT (SELECT COUNT(*) FROM categories) AS cats,'
    + ' (SELECT COUNT(*) FROM products) AS prods,'
    + ' (SELECT COUNT(*) FROM products WHERE image IS NOT NULL) AS photos',
  );
  console.log(c.g(`  Done — ${counts.cats} categories, ${counts.prods} starter products`
    + ` (${counts.photos} with your own photos) and the site settings are loaded.`));

  /* ---------- 3. admin sign-in ---------- */
  console.log(`\n${c.b('  Your admin sign-in')}`);
  console.log(c.d('  Only you use this. Customers never sign in.'));

  let email = '';
  while (!isEmail(email)) {
    email = (await rl.question('  Email     : ')).trim().toLowerCase();
    if (!isEmail(email)) console.log(c.r('  That email does not look right.'));
  }
  let pw = '';
  while (pw.length < 8) {
    pw = (await rl.question('  Password  (8+ characters) : ')).trim();
    if (pw.length < 8) console.log(c.r('  Please use at least 8 characters.'));
  }
  const name = (await rl.question('  Your name [OBD Admin] : ')).trim() || 'OBD Admin';

  await conn.query(
    `INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), is_active = 1`,
    [name, email, await bcrypt.hash(pw, 10)]);
  await conn.end();

  console.log(`\n${c.g('  All set.')}\n`);
  console.log(`  Start everything:  ${c.b('npm run dev')}   ${c.d('(from the project folder)')}\n`);
  console.log(`    Website      ${c.b('http://localhost:5173')}`);
  console.log(`    Admin panel  ${c.b('http://localhost:5173/admin')}  ${c.d(`(${email})`)}\n`);
} catch (err) {
  console.error(`\n${c.r('  Setup stopped:')} ${err.message}\n`);
  if (/ECONNREFUSED|ER_ACCESS_DENIED|ETIMEDOUT|ENOTFOUND/.test(String(err.code) + err.message)) {
    console.error(c.y('  MySQL did not accept the connection.'));
    console.error('   • Is MySQL running?  XAMPP / Laragon: press Start next to MySQL.');
    console.error('   • Are the user and password right?  (XAMPP default: user "root", no password)');
    console.error('\n  Fix that, then run the command again.\n');
  }
  process.exitCode = 1;
} finally {
  rl.close();
  process.exit();
}
