import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';

import { config } from './config.js';
import { assertDbConnection } from './lib/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { catalogue } from './routes/catalogue.js';
import { enquiries } from './routes/enquiries.js';
import { auth } from './routes/auth.js';
import { admin } from './routes/admin.js';

const app = express();

app.set('trust proxy', 1);              // correct client IPs behind a host's proxy
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uploaded product photos, served straight off disk.
app.use('/uploads', express.static(path.resolve(config.uploadDir, '..'), {
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));

app.get('/api/health', async (req, res) => {
  try {
    await assertDbConnection();
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'unreachable', error: err.message });
  }
});

app.use('/api', catalogue);              // /api/categories, /api/products, /api/settings
app.use('/api/enquiries', enquiries);
app.use('/api/auth', auth);
app.use('/api/admin', admin);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`\n  OBD Lighting API`);
  console.log(`  ----------------`);
  console.log(`  Listening   http://localhost:${config.port}`);
  console.log(`  Health      http://localhost:${config.port}/api/health`);
  console.log(`  Allowing    ${config.clientOrigin}\n`);
  assertDbConnection()
    .then(() => console.log('  MySQL connected.\n'))
    .catch((e) => console.error(`  MySQL NOT connected: ${e.message}\n  Check server/.env\n`));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

export default app;
