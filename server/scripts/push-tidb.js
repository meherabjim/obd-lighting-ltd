/**
 * Push the whole catalogue into TiDB Cloud in one command.
 *
 *     npm run db:push            (from the project folder)
 *
 * It reads the connection from server/.env — nothing is typed on the command
 * line, so no password ends up in your shell history. It then creates the
 * tables, loads the 10 categories, 36 products, their specifications and the
 * site settings, and finally makes sure your admin login exists.
 *
 * IT REPLACES EVERYTHING. schema.sql drops the tables and seed.sql empties
 * them, so anything added through the admin panel since the last push — new
 * products, uploaded photos, enquiries — is wiped. That is why it refuses to
 * run against a database that already has data unless you say so:
 *
 *     npm run db:push -- --replace          replace what is there
 *     npm run db:push -- --backup-first     write a .sql backup, then replace
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '../../database');

// Read server/.env directly rather than through src/config.js: that module
// refuses to load at all when NODE_ENV=production and the secrets are not
// set, and this script has no business caring about the JWT secret.
dotenv.config({ path: path.resolve(here, '../.env') });

const db = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'obd_lighting',
  ssl: process.env.DB_SSL
    ? /^(1|true|yes)$/i.test(process.env.DB_SSL)
    : /tidbcloud\.com$/i.test(process.env.DB_HOST || ''),
};

const c = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,
};

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const sqlFile = (f) => readFileSync(path.join(dbDir, f), 'utf8');

const { host, port, user, password, database, ssl } = db;

if (!host || !user) {
  console.error(c.r('\n  server/.env has no DB_HOST / DB_USER.'));
  console.error('  Copy them from TiDB Cloud -> your cluster -> Connect.\n');
  process.exit(1);
}

console.log(`\n${c.b('  Pushing the catalogue to the database')}`);
console.log(c.d(`  ${user}@${host}:${port}/${database}  ${ssl ? '(TLS)' : '(no TLS)'}\n`));

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  multipleStatements: true,
  charset: 'utf8mb4',
  ...(ssl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
}).catch((err) => {
  console.error(c.r(`  Could not connect: ${err.message}\n`));
  if (/ETIMEDOUT|ENOTFOUND/.test(String(err.code))) {
    console.error(c.y('  Check DB_HOST and DB_PORT, and that your IP is allowed'));
    console.error('  in TiDB Cloud -> Settings -> Networking.\n');
  }
  if (/ER_ACCESS_DENIED/.test(String(err.code))) {
    console.error(c.y('  The user or password is wrong. TiDB usernames look like'));
    console.error('  "2abCd3EfGh.root" — the prefix is part of the name.\n');
  }
  process.exit(1);
});

// Belt and braces: the connection already asks for utf8mb4, but say it again
// on the session. If any layer falls back to latin1, every Bangla character
// is silently replaced with a literal "?" at insert time — and once that is
// written, the original text is gone for good.
await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

/* ---------- 1. is there anything already in there? ---------- */
let existing = 0;
try {
  await conn.query(`USE \`${database}\``);
  const [[row]] = await conn.query(
    'SELECT (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM enquiries) AS n');
  existing = Number(row.n);
} catch {
  existing = 0;                       // database or tables not there yet: nothing to lose
}

if (existing > 0 && !has('--replace') && !has('--backup-first')) {
  console.log(c.y(`  This database already holds ${existing} products and enquiries.`));
  console.log('  Pushing will DELETE all of it and put the starter catalogue back.\n');
  console.log(`  Keep a copy first :  ${c.b('npm run db:push -- --backup-first')}`);
  console.log(`  Replace anyway    :  ${c.b('npm run db:push -- --replace')}\n`);
  await conn.end();
  process.exit(1);
}

/* ---------- 2. optional backup ---------- */
if (has('--backup-first') && existing > 0) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const out = path.resolve(dbDir, `backup-${stamp}.sql`);
  const lines = [`-- OBD Lighting backup ${new Date().toISOString()}`, 'SET FOREIGN_KEY_CHECKS=0;'];
  const [tables] = await conn.query('SHOW TABLES');

  for (const row of tables) {
    const table = Object.values(row)[0];
    const [[create]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    lines.push(`\nDROP TABLE IF EXISTS \`${table}\`;`, `${create['Create Table']};`);
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    for (const r of rows) {
      const cols = Object.keys(r).map((k) => `\`${k}\``).join(', ');
      const vals = Object.values(r).map((v) => (v == null ? 'NULL' : conn.escape(v))).join(', ');
      lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES (${vals});`);
    }
  }
  lines.push('SET FOREIGN_KEY_CHECKS=1;');
  writeFileSync(out, lines.join('\n'), 'utf8');
  console.log(c.g(`  Backup written: ${path.relative(process.cwd(), out)}`));
}

/* ---------- 3. tables and data ---------- */
// schema.sql drops every table, admins included. Keep the sign-in so a push
// never locks the owner out of their own dashboard.
let savedAdmins = [];
try {
  const [rows] = await conn.query('SELECT name, email, password_hash, role FROM admins');
  savedAdmins = rows;
} catch { /* no admins table yet */ }

/**
 * Run one of the .sql files. On failure, say what the database objected to in
 * one line instead of dumping the whole file back at you — and say what state
 * that leaves things in, because schema.sql drops the tables before it builds
 * them, so a failure half way through leaves the database empty.
 */
async function runSqlFile(name, label) {
  console.log(label);
  try {
    await conn.query(sqlFile(name));
  } catch (err) {
    console.error(`\n${c.r(`  ${name} was rejected:`)} ${err.sqlMessage || err.message}`);
    if (/FULLTEXT/i.test(err.sqlMessage || '')) {
      console.error(c.y('  TiDB indexes one column at a time for full-text search.'));
    }
    console.error(c.y(`\n  The tables are half-built right now — ${name} drops them`));
    console.error(c.y('  before creating them. Fix the line above and run the command'));
    console.error(c.y('  again; it starts from scratch, so nothing is left broken.\n'));
    if (savedAdmins.length) {
      console.error(c.y(`  Your sign-in (${savedAdmins.map((a) => a.email).join(', ')}) was read`));
      console.error(c.y('  before the drop and is in the backup file, so it is not lost.\n'));
    }
    await conn.end();
    process.exit(1);
  }
}

await runSqlFile('schema.sql', '  Creating tables…');
await conn.query(`USE \`${database}\``);
await runSqlFile('seed.sql', '  Loading categories, products and settings…');

const [[counts]] = await conn.query(
  'SELECT (SELECT COUNT(*) FROM categories) AS cats,'
  + ' (SELECT COUNT(*) FROM subcategories) AS subs,'
  + ' (SELECT COUNT(*) FROM products) AS prods,'
  + ' (SELECT COUNT(*) FROM product_specs) AS specs,'
  + ' (SELECT COUNT(*) FROM products WHERE image IS NOT NULL) AS photos,'
  + ' (SELECT COUNT(*) FROM settings) AS settings');

/* ---------- 3b. did the Bangla survive the trip? ---------- */
// The whole site has a Bangla toggle, so this is not a nicety: if the text
// went in as "?" the catalogue is broken in one of its two languages, and
// nothing in the page or the server would tell you why.
const [[bn]] = await conn.query(
  "SELECT name_bn, (SELECT setting_value FROM settings WHERE setting_key = 'tagline_bn') AS tag"
  + ' FROM categories ORDER BY sort_order LIMIT 1');
const banglaOk = /[\u0980-\u09FF]/.test(String(bn?.name_bn)) && /[\u0980-\u09FF]/.test(String(bn?.tag));

if (!banglaOk) {
  console.error(`\n${c.r('  Bangla did not survive the write.')}`);
  console.error(`  The database stored "${bn?.name_bn}" instead of Bangla text.`);
  console.error(c.y('  The connection is not speaking utf8mb4. Check that the'));
  console.error(c.y('  tables were made by database/schema.sql (which sets utf8mb4)'));
  console.error(c.y('  and that nothing else imported the seed with another tool.\n'));
  await conn.end();
  process.exit(1);
}
console.log(c.g(`  Bangla verified: ${bn.name_bn}`));

/* ---------- 4. the admin login ---------- */
if (savedAdmins.length) {
  for (const a of savedAdmins) {
    await conn.query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [a.name, a.email, a.password_hash, a.role]);
  }
  console.log(c.g(`  Kept your existing sign-in (${savedAdmins.map((a) => a.email).join(', ')}).`));
  console.log(c.d('  Forgotten the password?  npm run setup'));
} else {
  const rl = readline.createInterface({ input, output });
  console.log(`\n${c.b('  Your admin sign-in')} ${c.d('(only you use this)')}`);
  let email = '';
  while (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    email = (await rl.question('  Email    : ')).trim().toLowerCase();
  }
  let pw = '';
  while (pw.length < 10) {
    pw = (await rl.question('  Password (10+ characters) : ')).trim();
    if (pw.length < 10) console.log(c.r('  At least 10 characters, please.'));
  }
  const name = (await rl.question('  Your name [OBD Admin] : ')).trim() || 'OBD Admin';
  rl.close();
  await conn.query(
    `INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_active = 1`,
    [name, email, await bcrypt.hash(pw, 12)]);
  console.log(c.g(`  Admin account created: ${email}`));
}

await conn.end();

console.log(`\n${c.g('  Pushed.')}`);
console.log(`  ${counts.cats} categories · ${counts.subs} sub-categories · ${counts.prods} products`);
console.log(`  ${counts.specs} specification rows · ${counts.photos} with a photo · ${counts.settings} settings\n`);
console.log(c.d('  Check the API sees it:  curl <your-api-url>/api/health\n'));

if (!existsSync(path.join(here, '../.env'))) {
  console.log(c.y('  Note: server/.env was not found, so the values above came from'));
  console.log(c.y('  environment variables.\n'));
}
