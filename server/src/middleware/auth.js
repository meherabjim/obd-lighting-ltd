import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ApiError } from '../lib/helpers.js';

export function signToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

/** Verifies the token only — says who you are, not what you may do. */
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.obd_token;
  if (!token) return next(new ApiError(401, 'Please sign in.'));
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new ApiError(401, 'Your session has expired. Please sign in again.'));
  }
}

/**
 * Gate for every /api/admin route: a valid token is not enough, the account
 * has to carry the admin role. Hiding the button in the UI is presentation;
 * this is what actually keeps a non-admin out of the dashboard's data.
 */
export function requireAdminRole(req, res, next) {
  if (req.admin?.role !== 'admin') {
    return next(new ApiError(403, 'Only an administrator account can do that.'));
  }
  next();
}
