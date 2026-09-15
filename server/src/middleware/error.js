import { ApiError } from '../lib/helpers.js';
import { config } from '../config.js';

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  // Turn the MySQL errors we can predict into readable messages.
  if (err && err.code === 'ER_DUP_ENTRY') {
    const field = /key '(.+?)'/.exec(err.sqlMessage)?.[1] || 'value';
    err = new ApiError(409, `That ${field.includes('sku') ? 'SKU' : 'value'} is already used by another item.`);
  } else if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
    err = new ApiError(409, 'Something still uses this item, so it cannot be deleted.');
  } else if (err && (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR')) {
    err = new ApiError(503, 'Cannot reach the database. Check MySQL is running and server/.env is correct.');
  }

  const status = err instanceof ApiError ? err.status : 500;
  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    error: status >= 500 && config.isProd ? 'Something went wrong on the server.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
