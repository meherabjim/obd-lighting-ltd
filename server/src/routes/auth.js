import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { queryOne, execute } from '../lib/db.js';
import { asyncHandler, ApiError, requireFields } from '../lib/helpers.js';
import { signToken, requireAdmin } from '../middleware/auth.js';

export const auth = Router();

// Slow down password guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes.' },
});

/** POST /api/auth/login — email + password, returns a token. */
auth.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const admin = await queryOne(
    'SELECT * FROM admins WHERE email = ? AND is_active = 1',
    [String(req.body.email).trim().toLowerCase()]);

  // Same message and similar timing whether the email or the password is
  // wrong, so the form cannot be used to discover valid addresses.
  const hash = admin ? admin.password_hash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(String(req.body.password), hash);
  if (!admin || !ok) throw new ApiError(401, 'Email or password is incorrect.');

  await execute('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);

  res.json({
    token: signToken(admin),
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}));

/** GET /api/auth/me — lets the admin app know the token is still good. */
auth.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

/** POST /api/auth/password — change your own password. */
auth.post('/password', requireAdmin, asyncHandler(async (req, res) => {
  requireFields(req.body, ['currentPassword', 'newPassword']);
  const fresh = String(req.body.newPassword);
  if (fresh.length < 10) {
    throw new ApiError(400, 'The new password must be at least 10 characters.');
  }
  if (!/[a-z]/i.test(fresh) || !/\d/.test(fresh)) {
    throw new ApiError(400, 'The new password needs both letters and numbers.');
  }
  if (fresh === String(req.body.currentPassword)) {
    throw new ApiError(400, 'That is the password you already have.');
  }
  const admin = await queryOne('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
  const ok = await bcrypt.compare(String(req.body.currentPassword), admin.password_hash);
  if (!ok) throw new ApiError(401, 'Your current password is incorrect.');

  await execute('UPDATE admins SET password_hash = ? WHERE id = ?',
    [await bcrypt.hash(String(req.body.newPassword), 12), admin.id]);
  res.json({ ok: true });
}));
