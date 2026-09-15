/** An error that carries an HTTP status, so routes can just throw. */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap an async route so a rejected promise reaches the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Throw a 400 listing whatever the caller forgot. */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => {
    const v = body[f];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (missing.length) {
    throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`, { missing });
  }
}

/** "T8 Double Shade 2×20W" -> "t8-double-shade-2x20w" */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/×/g, 'x')
    .normalize('NFKD')
    .replace(/[^\wঀ-৿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'item';
}

/** First number in a spec string: "2,400 lm" -> 2400, "6500 K" -> 6500. */
export function firstNumber(text) {
  const m = String(text ?? '').match(/(\d[\d,]*)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

/** Bounded paging so a bad ?limit can't ask for the whole table. */
export function readPaging(q, { defaultLimit = 24, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(q.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(q.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}
