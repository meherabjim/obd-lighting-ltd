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
  },

  jwtSecret: process.env.JWT_SECRET || 'insecure-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// A misconfigured secret in production is a silent security hole, so refuse to start.
if (config.isProd && config.jwtSecret.startsWith('change-me')) {
  throw new Error('Set a real JWT_SECRET in server/.env before running in production.');
}
