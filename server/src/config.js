import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:4000').replace(/\/+$/, ''),

  uploadDir: path.resolve(__dirname, '../uploads/products'),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'obd_lighting',
    // TiDB Cloud (and any managed MySQL) needs TLS; XAMPP at home does not.
    ssl: process.env.DB_SSL
      ? /^(1|true|yes)$/i.test(process.env.DB_SSL)
      : /tidbcloud\.com$/i.test(process.env.DB_HOST || ''),
  },

  jwtSecret: process.env.JWT_SECRET || 'insecure-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// A misconfigured secret in production is a silent security hole: anyone who
// guesses it can mint themselves an admin token. Refuse to start instead.
if (config.isProd) {
  const weak = config.jwtSecret.startsWith('change-me')
    || config.jwtSecret === 'insecure-development-secret'
    || config.jwtSecret.length < 32;
  if (weak) {
    throw new Error(
      'JWT_SECRET must be a random string of at least 32 characters in production.\n'
      + 'Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  }
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error('Set CLIENT_ORIGIN to your site address before running in production.');
  }
}
