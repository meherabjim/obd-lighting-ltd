import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import NoPhoto from '../components/NoPhoto.jsx';
import Spinner, { EmptyState, ErrorNote } from '../components/Spinner.jsx';
import { bdt } from '../i18n/index.jsx';
import { IconPlus, IconTrash, IconArrow } from '../components/Icons.jsx';

/**
 * Home page slider.
 *
 * The slider is a short, ordered list of product slugs stored in one
 * settings row (`hero_products`). Keeping it there rather than in a column
 * on `products` means the order is explicit and the whole thing can be
 * rewritten in a single save — add, remove and move all go through
 * `commit()` below.
 */
const MAX = 5;

export default function Slider() {
  const [slugs, setSlugs] = useState([]);
  const [all, setAll] = useState([]);
  const [pick, setPick] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.adminSettings(), api.adminProducts({ limit: 500 })])
      .then(([s, r]) => {
        setSlugs(String(s.hero_products || '').split(',').map((x) => x.trim()).filter(Boolean));
        setAll(r.products);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /** Write the whole list back, and put the old one back if the save fails. */
  const commit = async (next) => {
    const before = slugs;
    setSlugs(next);
    setSaving(true);
    setSaved(false);
    try {
      await api.updateSettings({ hero_products: next.join(',') });
      setSaved(true);
      setError(null);
    } catch (err) {
      setSlugs(before);
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const bySlug = (s) => all.find((p) => p.slug === s);
  const chosen = slugs.map(bySlug).filter(Boolean);
  const available = all.filter((p) => !slugs.includes(p.slug) && p.isActive);

  const add = () => { if (pick && slugs.length < MAX) { commit([...slugs, pick]); setPick(''); } };
  const remove = (s) => commit(slugs.filter((x) => x !== s));
  const move = (i, by) => {
    const j = i + by;
    if (j < 0 || j >= slugs.length) return;
    const next = [...slugs];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="admin-head">
        <h1>Home page slider <span className="count-badge">{chosen.length} / {MAX}</span></h1>
        <Link className="btn btn-ghost btn-sm" to="/">View site</Link>
      </div>

      <p className="hint">
        These are the big slides at the top of the home page. Each one shows that
        product's own photograph, its name in English and Bangla, its price and a
        WhatsApp button. Put the product you most want to sell at the top.
      </p>

      <ErrorNote error={error} onRetry={load} />

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Add a slide</h3>
            <p className="hint no-mb">
              {slugs.length >= MAX
                ? `The slider is full. Remove one below to add another.`
                : `${MAX - slugs.length} slot${MAX - slugs.length === 1 ? '' : 's'} left.`}
            </p>
          </div>
          <span className="sm">{saving ? 'Saving…' : saved ? 'Saved' : ''}</span>
        </div>
        <div className="new-cat-row">
          <select className="sel" value={pick} disabled={slugs.length >= MAX}
                  onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a product…</option>
            {available.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} — {p.sku}{p.image ? '' : '  (no photo yet)'}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary btn-sm"
                  disabled={!pick || slugs.length >= MAX} onClick={add}>
            <IconPlus /> Add to slider
          </button>
        </div>
      </div>

      {chosen.length === 0 ? (
        <EmptyState
          title="No slides chosen"
          hint="Until you add one, the slider falls back to whatever is ticked as a best seller. Add a product above to take control of it."
          action={<Link className="btn btn-ghost" to="/admin/products">Go to products</Link>}
        />
      ) : (
        <div className="slide-list">
          {chosen.map((p, i) => (
            <div className="slide-row" key={p.slug}>
              <span className="slide-no mono">{i + 1}</span>
              <span className="slide-thumb">
                {p.image ? <img src={p.image} alt="" /> : <NoPhoto name={p.name} size={54} label={false} />}
              </span>
              <div className="slide-meta">
                <div className="pname">{p.name}</div>
                <div className="psub">{p.nameBn || <em>no Bangla name yet</em>}</div>
                {!p.image && (
                  <div className="psub warn">
                    No photo — this slide shows a lettered tile.{' '}
                    <Link to={`/admin/products/${p.id}`}>Add one</Link>
                  </div>
                )}
              </div>
              <span className="mono sm">{bdt(p.price)}</span>
              <div className="row-actions">
                <button type="button" className="icon-only" disabled={i === 0}
                        onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                <button type="button" className="icon-only" disabled={i === chosen.length - 1}
                        onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                <Link className="icon-only" to={`/admin/products/${p.id}`} aria-label="Edit product">
                  <IconArrow />
                </Link>
                <button type="button" className="icon-only danger" onClick={() => remove(p.slug)}
                        aria-label="Remove from the slider">
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {slugs.length > chosen.length && (
        <p className="hint">
          {slugs.length - chosen.length} slide(s) point at a product that has since been
          deleted or hidden. They are skipped on the site;{' '}
          <button type="button" className="linkish" onClick={() => commit(chosen.map((p) => p.slug))}>
            clean them up
          </button>.
        </p>
      )}
    </>
  );
}
