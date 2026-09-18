/**
 * Security headers and origin control.
 *
 * Written by hand rather than pulled from a package: this API sends JSON and
 * images and nothing else, so the whole policy is twenty lines and there is
 * no dependency to keep patched.
 */
import { config } from '../config.js';

/**
 * The browser origins allowed to call this API.
 * CLIENT_ORIGIN may hold several, comma separated:
 *   CLIENT_ORIGIN=https://obdlighting.com,https://www.obdlighting.com
 */
const allowed = new Set(
  String(config.clientOrigin)
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);

export function corsOptions() {
  return {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
    origin(origin, cb) {
      // No Origin header at all: curl, a health check, a phone's webview.
      // Those are not browser cross-site requests, so there is nothing to block.
      if (!origin) return cb(null, true);
      if (allowed.has(origin.replace(/\/+$/, ''))) return cb(null, true);
      // In development any localhost port is fine — Vite moves around.
      if (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error(`Origin ${origin} is not allowed to call this API.`));
    },
  };
}

/**
 * The API itself renders no HTML, so the content policy can be as tight as
 * it goes: nothing may be loaded, framed or embedded from here except the
 * product photographs it serves.
 */
const CSP = [
  "default-src 'none'",
  "img-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // Only meaningful once the site is on https, and harmful before that.
  if (config.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}
