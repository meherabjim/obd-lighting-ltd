import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCatalogue } from '../context/CatalogueContext.jsx';
import NoPhoto from '../components/NoPhoto.jsx';
import Spinner, { EmptyState, ErrorNote } from '../components/Spinner.jsx';
import { bdt } from '../i18n/index.jsx';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '../components/Icons.jsx';

const HERO_MAX = 5;

export default function Products() {
  const { categories, reload } = useCatalogue();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The hero slider is just a list of product slugs kept in settings, so
  // picking one here needs no database change and no restart.
  const [hero, setHero] = useState([]);
  const [heroSaving, setHeroSaving] = useState(false);

  useEffect(() => {
    api.adminSettings()
      .then((s) => setHero(String(s.hero_products || '').split(',').map((x) => x.trim()).filter(Boolean)))
      .catch(() => { /* the toggles simply start empty */ });
  }, []);

  const toggleHero = async (slug) => {
    const next = hero.includes(slug)
      ? hero.filter((s) => s !== slug)
      : [...hero, slug].slice(-HERO_MAX);
    setHero(next);
    setHeroSaving(true);
    try {
      await api.updateSettings({ hero_products: next.join(',') });
    } catch (err) {
      setHero(hero);          // put it back if the save failed
      setError(err);
    } finally {
      setHeroSaving(false);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    api.adminProducts({ category, q, limit: 200 })
      .then((r) => { setRows(r.products); setTotal(r.total); setError(null); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [category, q]);

  useEffect(() => {
    const id = setTimeout(load, q ? 300 : 0);   // debounce typing
    return () => clearTimeout(id);
  }, [load, q]);

  const remove = async (row) => {
    if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(row.id);
      reload();
      load();
    } catch (err) { setError(err); }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Products <span className="count-badge">{total}</span></h1>
        <Link className="btn btn-primary" to="/admin/products/new"><IconPlus /> Add product</Link>
      </div>

      <div className="hero-bar">
        <div>
          <strong>Home page slider</strong>
          <span className="hint no-mb">
            {' '}Tick the star on up to {HERO_MAX} products — they become the big slides at the
            top of the home page, with their own photo and price.
          </span>
        </div>
        <span className="count-badge">
          {heroSaving ? 'Saving…' : `${hero.length} / ${HERO_MAX} chosen`}
        </span>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <IconSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or model…" />
        </div>
        <select className="sel" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <ErrorNote error={error} onRetry={load} />

      {loading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState
          title={q || category !== 'all' ? 'No products match that' : 'No products yet'}
          hint={q || category !== 'all'
            ? 'Try a different search or category.'
            : 'Add your first product and it appears on the site straight away.'}
          action={<Link className="btn btn-primary" to="/admin/products/new"><IconPlus /> Add product</Link>}
        />
      ) : (
        <div className="tbl-wrap">
          <table className="data">
            <thead>
              <tr>
                <th></th><th>Product</th><th>Model</th><th>Category</th>
                <th className="num">Price</th><th>Stock</th><th>Status</th>
                <th title="Show in the home page slider">Slider</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const cls = p.stock === 0 ? 'out' : p.stock < 50 ? 'low' : '';
                return (
                  <tr key={p.id}>
                    <td className="cell-art">
                      {p.image ? <img src={p.image} alt="" /> : <NoPhoto name={p.name} size={34} label={false} />}
                    </td>
                    <td>
                      <div className="pname">{p.name}</div>
                      <div className="psub">{p.nameBn}</div>
                    </td>
                    <td className="mono sm">{p.sku}</td>
                    <td className="sm">{p.categoryName}</td>
                    <td className="num">{bdt(p.price)}</td>
                    <td>
                      <span className={`stock-bar ${cls}`}>
                        <i style={{ width: `${p.stock === 0 ? 0 : Math.max(6, Math.min(100, p.stock / 5))}%` }} />
                      </span>
                      <span className="mono sm">{p.stock}</span>
                    </td>
                    <td>
                      {!p.isActive ? <span className="pill">Hidden</span>
                        : p.stock === 0 ? <span className="pill pill-crit">Out</span>
                        : p.stock < 50 ? <span className="pill pill-warn">Low</span>
                        : <span className="pill pill-ok">Live</span>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="hero-star"
                        aria-pressed={hero.includes(p.slug)}
                        title={hero.includes(p.slug)
                          ? 'Remove from the home page slider'
                          : hero.length >= HERO_MAX
                            ? `Slider is full — this replaces the oldest of the ${HERO_MAX}`
                            : 'Show in the home page slider'}
                        onClick={() => toggleHero(p.slug)}
                      >
                        {hero.includes(p.slug) ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="row-actions">
                      <Link className="icon-only" to={`/admin/products/${p.id}`} aria-label="Edit"><IconEdit /></Link>
                      <button type="button" className="icon-only danger" onClick={() => remove(p)} aria-label="Delete">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
