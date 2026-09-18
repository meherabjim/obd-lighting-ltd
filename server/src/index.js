import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';

import { config } from './config.js';
import { assertDbConnection, queryOne } from './lib/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { securityHeaders, corsOptions } from './middleware/security.js';
import { catalogue } from './routes/catalogue.js';
import { enquiries } from './routes/enquiries.js';
import { auth } from './routes/auth.js';
import { admin } from './routes/admin.js';

const app = express();

app.disable('x-powered-by');            // don't advertise what we run
app.set('trust proxy', 1);              // correct client IPs behind a host's proxy

app.use(securityHeaders);
app.use(cors(corsOptions()));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(cookieParser());

// A ceiling over the whole API. The login and enquiry routes have their own,
// much tighter, limits; this one only stops a script hammering the catalogue.
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
}));

// Uploaded product photos, served straight off disk.
app.use('/uploads', express.static(path.resolve(config.uploadDir, '..'), {
  maxAge: '7d',
  index: false,
  dotfiles: 'deny',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Anything that slipped into this folder is served as a download, never
    // executed or rendered as a page by the browser.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:");
  },
}));

app.get('/api/health', async (req, res) => {
  try {
    await assertDbConnection();

    // /api/health?deep=1 also proves the Bangla side of the catalogue is
    // intact. Stored over a latin1 connection, Bangla turns into literal "?"
    // and the site silently loses one of its two languages — this is the one
    // line that tells you, without opening the page.
    if (req.query.deep === '1') {
      const row = await queryOne('SELECT name_bn FROM categories ORDER BY sort_order LIMIT 1');
      const bangla = /[\u0980-\u09FF]/.test(String(row?.name_bn ?? '')) ? 'ok' : 'broken';
      return res.json({ ok: bangla === 'ok', db: 'connected', bangla });
    }

    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    // The reason a database is unreachable is not the public's business.
    if (!config.isProd) console.error('[health]', err);
    res.status(503).json({ ok: false, db: 'unreachable' });
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
    .then(() => console.log('  Database connected.\n'))
    .catch((e) => console.error(`  Database NOT connected: ${e.message}\n  Check server/.env\n`));
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

export default app;
