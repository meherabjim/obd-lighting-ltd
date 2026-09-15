import { Router } from 'express';
import { query, queryOne } from '../lib/db.js';
import { asyncHandler, ApiError, readPaging } from '../lib/helpers.js';
import { config } from '../config.js';

export const catalogue = Router();

/** Turn a stored filename into a URL the browser can load. */
const imageUrl = (f) => (f ? `${config.publicUrl}/uploads/products/${f}` : null);

/** Shape a product row for the frontend. */
const shape = (row, specs = []) => ({
  id: row.id,
  slug: row.slug,
  categoryId: row.category_id,
  categoryName: row.category_name ?? null,
  categoryNameBn: row.category_name_bn ?? null,
  name: row.name,
  nameBn: row.name_bn,
  sku: row.sku,
  price: row.price,
  oldPrice: row.old_price,
  wattage: row.wattage,
  cct: row.cct,
  art: row.art,
  image: imageUrl(row.image),
  stock: row.stock,
  isFeatured: !!row.is_featured,
  isNew: !!row.is_new,
  specs: specs.map((s) => ({ key: s.spec_key, value: s.spec_value })),
});

// ---------------------------------------------------------------------
// GET /api/categories — the menu, the sidebar and the shop filters
// ---------------------------------------------------------------------
catalogue.get('/categories', asyncHandler(async (req, res) => {
  const cats = await query(
    `SELECT c.id, c.name, c.name_bn, c.blurb, c.blurb_bn, c.icon, c.sort_order,
            COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name`);

  const subs = await query(
    `SELECT category_id, name, name_bn FROM subcategories ORDER BY category_id, sort_order`);

  res.json(cats.map((c) => ({
    id: c.id,
    name: c.name,
    nameBn: c.name_bn,
    blurb: c.blurb,
    blurbBn: c.blurb_bn,
    icon: c.icon,
    productCount: Number(c.product_count),
    subs: subs.filter((s) => s.category_id === c.id)
              .map((s) => ({ name: s.name, nameBn: s.name_bn })),
  })));
}));

// ---------------------------------------------------------------------
// GET /api/products — list with filters, search, sort and paging
//   ?category=panel  ?watt=w1,w3  ?cct=6500  ?q=IP66
//   ?sort=popular|low|high|name   ?page=1&limit=24   ?featured=1
// ---------------------------------------------------------------------
const WATT_BANDS = {
  w1: 'p.wattage <= 20',
  w2: 'p.wattage > 20 AND p.wattage <= 50',
  w3: 'p.wattage > 50 AND p.wattage <= 100',
  w4: 'p.wattage > 100',
};
const SORTS = {
  popular: 'p.is_featured DESC, p.sort_order, p.id',
  low: 'p.price ASC',
  high: 'p.price DESC',
  name: 'p.name ASC',
  newest: 'p.created_at DESC',
};

catalogue.get('/products', asyncHandler(async (req, res) => {
  const where = ['p.is_active = 1'];
  const params = [];

  if (req.query.category && req.query.category !== 'all') {
    where.push('p.category_id = ?');
    params.push(req.query.category);
  }
  if (req.query.featured === '1') where.push('p.is_featured = 1');
  if (req.query.slugs) {
    // Used by the hero: fetch exactly the products the admin picked.
    const list = String(req.query.slugs).split(',')
      .map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (!list.length) return res.json({ products: [], total: 0, page: 1, limit: 0, pages: 1 });
    where.push(`p.slug IN (${list.map(() => '?').join(',')})`);
    params.push(...list);
  }
  if (req.query.cct && req.query.cct !== 'all') {
    where.push('p.cct = ?');
    params.push(Number(req.query.cct));
  }
  if (req.query.watt) {
    const clauses = String(req.query.watt).split(',')
      .map((b) => WATT_BANDS[b.trim()]).filter(Boolean);
    if (clauses.length) where.push(`(${clauses.map((c) => `(${c})`).join(' OR ')})`);
  }
  if (req.query.q) {
    // LIKE rather than MATCH: it handles Bangla and partial SKUs predictably.
    const term = `%${String(req.query.q).trim()}%`;
    where.push(`(p.name LIKE ? OR p.name_bn LIKE ? OR p.sku LIKE ?
                 OR EXISTS (SELECT 1 FROM product_specs s
                             WHERE s.product_id = p.id AND s.spec_value LIKE ?))`);
    params.push(term, term, term, term);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderSql = SORTS[req.query.sort] || SORTS.popular;
  const { page, limit, offset } = readPaging(req.query);

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);

  const rows = await query(
    `SELECT p.*, c.name AS category_name, c.name_bn AS category_name_bn
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY ${orderSql}
       LIMIT ? OFFSET ?`, [...params, limit, offset]);

  // One extra query for all the spec rows, instead of one per product.
  let specsByProduct = {};
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const specs = await query(
      `SELECT product_id, spec_key, spec_value FROM product_specs
        WHERE product_id IN (${ids.map(() => '?').join(',')})
        ORDER BY product_id, sort_order`, ids);
    specsByProduct = specs.reduce((acc, s) => {
      (acc[s.product_id] ||= []).push(s);
      return acc;
    }, {});
  }

  res.json({
    products: rows.map((r) => shape(r, specsByProduct[r.id] || [])),
    total: Number(total),
    page,
    limit,
    pages: Math.max(1, Math.ceil(Number(total) / limit)),
  });
}));

// ---------------------------------------------------------------------
// GET /api/products/:slug — one product plus a few from the same category
// ---------------------------------------------------------------------
catalogue.get('/products/:slug', asyncHandler(async (req, res) => {
  const row = await queryOne(
    `SELECT p.*, c.name AS category_name, c.name_bn AS category_name_bn
       FROM products p
       JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ? AND p.is_active = 1`, [req.params.slug]);
  if (!row) throw new ApiError(404, 'That product is no longer listed.');

  const specs = await query(
    `SELECT spec_key, spec_value FROM product_specs
      WHERE product_id = ? ORDER BY sort_order`, [row.id]);

  const related = await query(
    `SELECT p.* FROM products p
      WHERE p.category_id = ? AND p.id <> ? AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.sort_order LIMIT 4`, [row.category_id, row.id]);

  res.json({ product: shape(row, specs), related: related.map((r) => shape(r)) });
}));

// ---------------------------------------------------------------------
// GET /api/settings — phone, WhatsApp, address … editable by the admin
// ---------------------------------------------------------------------
catalogue.get('/settings', asyncHandler(async (req, res) => {
  const rows = await query('SELECT setting_key, setting_value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value])));
}));
