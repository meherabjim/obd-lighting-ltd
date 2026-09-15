import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { execute, queryOne } from '../lib/db.js';
import { asyncHandler, ApiError, requireFields, isEmail } from '../lib/helpers.js';

export const enquiries = Router();

// The public can post here, so cap it. Generous enough for real people,
// tight enough that a script cannot fill the table overnight.
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages from this connection. Please try again shortly.' },
});

/**
 * POST /api/enquiries
 * Two things land here:
 *  - source 'form'     : the project enquiry form, with contact details
 *  - source 'whatsapp' : someone tapped a WhatsApp button. We record what
 *    they were looking at so the admin sees demand even before the chat
 *    arrives. No personal data — we don't have any at that point.
 */
enquiries.post('/', limiter, asyncHandler(async (req, res) => {
  const source = ['whatsapp', 'phone', 'form'].includes(req.body.source) ? req.body.source : 'form';

  if (source === 'form') {
    requireFields(req.body, ['name', 'phone', 'message']);
    if (req.body.email && !isEmail(req.body.email)) {
      throw new ApiError(400, 'That email address does not look right.');
    }
    if (String(req.body.phone).replace(/\D/g, '').length < 10) {
      throw new ApiError(400, 'Please enter a full mobile number.');
    }
  }

  let productId = null;
  if (req.body.productSlug) {
    const p = await queryOne('SELECT id FROM products WHERE slug = ?', [req.body.productSlug]);
    productId = p ? p.id : null;
  }

  const trim = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

  const result = await execute(
    `INSERT INTO enquiries (source, name, company, phone, email, product_id,
                            category_id, message, page, lang)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [source, trim(req.body.name, 120), trim(req.body.company, 160),
     trim(req.body.phone, 40), trim(req.body.email, 160), productId,
     trim(req.body.categoryId, 40), trim(req.body.message, 4000),
     trim(req.body.page, 120), req.body.lang === 'bn' ? 'bn' : 'en']);

  res.status(201).json({ ok: true, id: result.insertId });
}));
