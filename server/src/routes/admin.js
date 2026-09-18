import { Router } from 'express';
import { query, queryOne, execute, withTransaction } from '../lib/db.js';
import { asyncHandler, ApiError, requireFields, slugify, firstNumber, readPaging } from '../lib/helpers.js';
import { requireAdmin, requireAdminRole } from '../middleware/auth.js';
import { uploadProductImage, verifyUpload, removeUpload } from '../middleware/upload.js';
import { config } from '../config.js';

export const admin = Router();
admin.use(requireAdmin);          // a valid token
admin.use(requireAdminRole);      // …belonging to an account with the admin role

const imageUrl = (f) => (f ? `${config.publicUrl}/uploads/products/${f}` : null);

/* =====================================================================
   Dashboard
   ===================================================================== */
admin.get('/stats', asyncHandler(async (req, res) => {
  const [counts] = await query(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE is_active = 1)                       AS products,
       (SELECT COUNT(*) FROM categories WHERE is_active = 1)                     AS categories,
       (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock = 0)         AS out_of_stock,
       (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock > 0 AND stock < 50) AS low_stock,
       (SELECT COUNT(*) FROM enquiries WHERE status = 'new')                     AS new_enquiries,
       (SELECT COUNT(*) FROM enquiries WHERE created_at > NOW() - INTERVAL 7 DAY) AS enquiries_week,
       (SELECT COALESCE(SUM(price * stock), 0) FROM products WHERE is_active = 1) AS stock_value,
       (SELECT COUNT(*) FROM products WHERE is_active = 1 AND (image IS NULL OR image = '')) AS no_photo,
       (SELECT COUNT(*) FROM products WHERE is_active = 1 AND (name_bn IS NULL OR name_bn = '')) AS no_bangla,
       (SELECT COUNT(*) FROM categories c WHERE c.is_active = 1
          AND NOT EXISTS (SELECT 1 FROM products p
                           WHERE p.category_id = c.id AND p.is_active = 1))      AS empty_categories`);
  res.json({
    products: Number(counts.products),
    categories: Number(counts.categories),
    outOfStock: Number(counts.out_of_stock),
    lowStock: Number(counts.low_stock),
    newEnquiries: Number(counts.new_enquiries),
    enquiriesWeek: Number(counts.enquiries_week),
    stockValue: Number(counts.stock_value),
    noPhoto: Number(counts.no_photo),
    noBangla: Number(counts.no_bangla),
    emptyCategories: Number(counts.empty_categories),
  });
}));

/* =====================================================================
   Products
   ===================================================================== */
admin.get('/products', asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.category && req.query.category !== 'all') {
    where.push('p.category_id = ?'); params.push(req.query.category);
  }
  if (req.query.q) {
    const term = `%${String(req.query.q).trim()}%`;
    where.push('(p.name LIKE ? OR p.name_bn LIKE ? OR p.sku LIKE ?)');
    params.push(term, term, term);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { page, limit, offset } = readPaging(req.query, { defaultLimit: 50 });

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const rows = await query(
    `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       ${whereSql} ORDER BY p.sort_order, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]);

  res.json({
    products: rows.map((r) => ({
      id: r.id, slug: r.slug, name: r.name, nameBn: r.name_bn, sku: r.sku,
      categoryId: r.category_id, categoryName: r.category_name,
      price: r.price, oldPrice: r.old_price, stock: r.stock,
      wattage: r.wattage, cct: r.cct, art: r.art, image: imageUrl(r.image),
      isFeatured: !!r.is_featured, isNew: !!r.is_new, isActive: !!r.is_active,
    })),
    total: Number(total), page, limit,
  });
}));

admin.get('/products/:id', asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!row) throw new ApiError(404, 'Product not found.');
  const specs = await query(
    'SELECT spec_key, spec_value FROM product_specs WHERE product_id = ? ORDER BY sort_order',
    [row.id]);
  res.json({
    id: row.id, slug: row.slug, categoryId: row.category_id,
    name: row.name, nameBn: row.name_bn, sku: row.sku,
    price: row.price, oldPrice: row.old_price, stock: row.stock,
    wattage: row.wattage, cct: row.cct, art: row.art, image: imageUrl(row.image),
    isFeatured: !!row.is_featured, isNew: !!row.is_new, isActive: !!row.is_active,
    specs: specs.map((s) => ({ key: s.spec_key, value: s.spec_value })),
  });
}));

/** Read the form body the same way for create and update. */
function readProductBody(body) {
  requireFields(body, ['name', 'sku', 'categoryId', 'price']);

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) throw new ApiError(400, 'Price must be a number.');
  const oldPrice = body.oldPrice === '' || body.oldPrice == null ? null : Number(body.oldPrice);
  if (oldPrice != null && (!Number.isFinite(oldPrice) || oldPrice <= price)) {
    throw new ApiError(400, 'The old price must be higher than the current price (or left empty).');
  }

  // Specs arrive as JSON from the form; tolerate a already-parsed array too.
  let specs = body.specs ?? [];
  if (typeof specs === 'string') {
    try { specs = JSON.parse(specs); } catch { throw new ApiError(400, 'Specification rows are malformed.'); }
  }
  if (!Array.isArray(specs)) specs = [];
  specs = specs
    .map((s) => ({ key: String(s.key ?? '').trim(), value: String(s.value ?? '').trim() }))
    .filter((s) => s.key && s.value)
    .slice(0, 40);

  const specMap = Object.fromEntries(specs.map((s) => [s.key.toLowerCase(), s.value]));
  const bool = (v) => (v === true || v === 'true' || v === '1' || v === 1 ? 1 : 0);

  return {
    name: String(body.name).trim(),
    nameBn: String(body.nameBn ?? body.name).trim(),
    sku: String(body.sku).trim().toUpperCase(),
    categoryId: String(body.categoryId).trim(),
    price,
    oldPrice,
    stock: Math.max(0, Number.parseInt(body.stock, 10) || 0),
    // Prefer an explicit value; otherwise read it off the spec sheet.
    wattage: body.wattage ? Number(body.wattage) : firstNumber(specMap.wattage),
    cct: body.cct ? Number(body.cct) : firstNumber(specMap.cct),
    art: String(body.art || 'bulbA').trim(),
    isFeatured: bool(body.isFeatured),
    isNew: bool(body.isNew),
    isActive: body.isActive === undefined ? 1 : bool(body.isActive),
    specs,
  };
}

async function saveSpecs(conn, productId, specs) {
  await conn.query('DELETE FROM product_specs WHERE product_id = ?', [productId]);
  if (!specs.length) return;
  await conn.query(
    'INSERT INTO product_specs (product_id, spec_key, spec_value, sort_order) VALUES ?',
    [specs.map((s, i) => [productId, s.key, s.value, i * 10])]);
}

/** Make a slug that is not already taken. */
async function uniqueSlug(base, ignoreId = null) {
  let slug = slugify(base);
  for (let n = 0; n < 50; n += 1) {
    const candidate = n === 0 ? slug : `${slug}-${n + 1}`;
    const clash = await queryOne(
      'SELECT id FROM products WHERE slug = ? AND (? IS NULL OR id <> ?)',
      [candidate, ignoreId, ignoreId]);
    if (!clash) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

admin.post('/products', uploadProductImage.single('image'), verifyUpload, asyncHandler(async (req, res) => {
  const p = readProductBody(req.body);
  const cat = await queryOne('SELECT id FROM categories WHERE id = ?', [p.categoryId]);
  if (!cat) throw new ApiError(400, 'Pick a category that exists.');

  const slug = await uniqueSlug(`${p.name}-${p.sku}`);
  const id = await withTransaction(async (conn) => {
    const [result] = await conn.query(
      `INSERT INTO products (slug, category_id, name, name_bn, sku, price, old_price,
                             wattage, cct, art, image, stock, is_featured, is_new, is_active,
                             sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, (SELECT COALESCE(MAX(s.sort_order),0)+10 FROM (SELECT sort_order FROM products) s))`,
      [slug, p.categoryId, p.name, p.nameBn, p.sku, p.price, p.oldPrice,
       p.wattage, p.cct, p.art, req.file?.filename ?? null, p.stock,
       p.isFeatured, p.isNew, p.isActive]);
    await saveSpecs(conn, result.insertId, p.specs);
    return result.insertId;
  });

  res.status(201).json({ ok: true, id, slug });
}));

admin.put('/products/:id', uploadProductImage.single('image'), verifyUpload, asyncHandler(async (req, res) => {
  const existing = await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) throw new ApiError(404, 'Product not found.');
  const p = readProductBody(req.body);

  // Keep the current photo unless a new one was uploaded or it was cleared.
  let image = existing.image;
  if (req.file) { removeUpload(existing.image); image = req.file.filename; }
  else if (req.body.removeImage === '1') { removeUpload(existing.image); image = null; }

  await withTransaction(async (conn) => {
    await conn.query(
      `UPDATE products SET category_id=?, name=?, name_bn=?, sku=?, price=?, old_price=?,
                           wattage=?, cct=?, art=?, image=?, stock=?,
                           is_featured=?, is_new=?, is_active=?
        WHERE id = ?`,
      [p.categoryId, p.name, p.nameBn, p.sku, p.price, p.oldPrice, p.wattage, p.cct,
       p.art, image, p.stock, p.isFeatured, p.isNew, p.isActive, existing.id]);
    await saveSpecs(conn, existing.id, p.specs);
  });

  res.json({ ok: true });
}));

admin.delete('/products/:id', asyncHandler(async (req, res) => {
  const existing = await queryOne('SELECT image FROM products WHERE id = ?', [req.params.id]);
  if (!existing) throw new ApiError(404, 'Product not found.');
  await execute('DELETE FROM products WHERE id = ?', [req.params.id]);
  removeUpload(existing.image);
  res.json({ ok: true });
}));

/* =====================================================================
   Categories
   ===================================================================== */
admin.get('/categories', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id ORDER BY c.sort_order, c.name`);
  const subs = await query('SELECT * FROM subcategories ORDER BY category_id, sort_order');
  res.json(rows.map((c) => ({
    id: c.id, name: c.name, nameBn: c.name_bn, blurb: c.blurb, blurbBn: c.blurb_bn,
    icon: c.icon, sortOrder: c.sort_order, isActive: !!c.is_active,
    productCount: Number(c.product_count),
    subs: subs.filter((s) => s.category_id === c.id)
              .map((s) => ({ id: s.id, name: s.name, nameBn: s.name_bn })),
  })));
}));

admin.post('/categories', asyncHandler(async (req, res) => {
  requireFields(req.body, ['id', 'name']);
  const id = slugify(req.body.id);
  if (await queryOne('SELECT id FROM categories WHERE id = ?', [id])) {
    throw new ApiError(409, 'A category with that id already exists.');
  }
  await execute(
    `INSERT INTO categories (id, name, name_bn, blurb, blurb_bn, icon, sort_order)
     VALUES (?,?,?,?,?,?, (SELECT COALESCE(MAX(s.sort_order),0)+10 FROM (SELECT sort_order FROM categories) s))`,
    [id, req.body.name.trim(), (req.body.nameBn || req.body.name).trim(),
     req.body.blurb ?? null, req.body.blurbBn ?? null, req.body.icon || 'bulbA']);
  await saveSubs(id, req.body.subs);
  res.status(201).json({ ok: true, id });
}));

admin.put('/categories/:id', asyncHandler(async (req, res) => {
  requireFields(req.body, ['name']);
  const result = await execute(
    `UPDATE categories SET name=?, name_bn=?, blurb=?, blurb_bn=?, icon=?, is_active=?
      WHERE id = ?`,
    [req.body.name.trim(), (req.body.nameBn || req.body.name).trim(),
     req.body.blurb ?? null, req.body.blurbBn ?? null, req.body.icon || 'bulbA',
     req.body.isActive === false ? 0 : 1, req.params.id]);
  if (!result.affectedRows) throw new ApiError(404, 'Category not found.');
  await saveSubs(req.params.id, req.body.subs);
  res.json({ ok: true });
}));

async function saveSubs(categoryId, subs) {
  if (!Array.isArray(subs)) return;
  await execute('DELETE FROM subcategories WHERE category_id = ?', [categoryId]);
  const clean = subs
    .map((s) => ({ name: String(s.name ?? '').trim(), nameBn: String(s.nameBn ?? s.name ?? '').trim() }))
    .filter((s) => s.name).slice(0, 30);
  if (!clean.length) return;
  await execute(
    'INSERT INTO subcategories (category_id, name, name_bn, sort_order) VALUES ?',
    [clean.map((s, i) => [categoryId, s.name, s.nameBn, i * 10])]);
}

admin.delete('/categories/:id', asyncHandler(async (req, res) => {
  const [{ n }] = await query('SELECT COUNT(*) AS n FROM products WHERE category_id = ?', [req.params.id]);
  if (Number(n) > 0) {
    throw new ApiError(409, `Move or delete the ${n} product(s) in this category first.`);
  }
  const result = await execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new ApiError(404, 'Category not found.');
  res.json({ ok: true });
}));

/* =====================================================================
   Enquiries — the site's conversions
   ===================================================================== */
admin.get('/enquiries', asyncHandler(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status && req.query.status !== 'all') {
    where.push('e.status = ?'); params.push(req.query.status);
  }
  if (req.query.source && req.query.source !== 'all') {
    where.push('e.source = ?'); params.push(req.query.source);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { page, limit, offset } = readPaging(req.query, { defaultLimit: 50 });

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM enquiries e ${whereSql}`, params);
  const rows = await query(
    `SELECT e.*, p.name AS product_name, p.sku AS product_sku, c.name AS category_name
       FROM enquiries e
       LEFT JOIN products p   ON p.id = e.product_id
       LEFT JOIN categories c ON c.id = e.category_id
       ${whereSql} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);

  res.json({
    enquiries: rows.map((r) => ({
      id: r.id, source: r.source, name: r.name, company: r.company,
      phone: r.phone, email: r.email, message: r.message,
      productName: r.product_name, productSku: r.product_sku,
      categoryName: r.category_name, page: r.page, lang: r.lang,
      status: r.status, adminNote: r.admin_note, createdAt: r.created_at,
    })),
    total: Number(total), page, limit,
  });
}));

admin.put('/enquiries/:id', asyncHandler(async (req, res) => {
  const allowed = ['new', 'quoted', 'site_visit', 'sold', 'closed'];
  if (req.body.status && !allowed.includes(req.body.status)) {
    throw new ApiError(400, 'Unknown status.');
  }
  const result = await execute(
    'UPDATE enquiries SET status = COALESCE(?, status), admin_note = COALESCE(?, admin_note) WHERE id = ?',
    [req.body.status ?? null, req.body.adminNote ?? null, req.params.id]);
  if (!result.affectedRows) throw new ApiError(404, 'Enquiry not found.');
  res.json({ ok: true });
}));

admin.delete('/enquiries/:id', asyncHandler(async (req, res) => {
  await execute('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

/* =====================================================================
   Settings
   ===================================================================== */
admin.get('/settings', asyncHandler(async (req, res) => {
  const rows = await query('SELECT setting_key, setting_value FROM settings ORDER BY setting_key');
  res.json(Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value])));
}));

admin.put('/settings', asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body || {})
    .filter(([key]) => /^[a-z][a-z0-9_]{1,59}$/.test(key));
  if (!entries.length) throw new ApiError(400, 'Nothing to save.');
  await withTransaction(async (conn) => {
    for (const [key, value] of entries) {
      await conn.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value == null ? null : String(value).slice(0, 4000)]);
    }
  });
  res.json({ ok: true });
}));
