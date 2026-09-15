import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import Spinner, { EmptyState, ErrorNote } from '../components/Spinner.jsx';
import { IconFilter, IconArrow, IconWhatsApp } from '../components/Icons.jsx';
import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCategories } from '../context/CatalogueContext.jsx';
import { useProducts } from '../lib/useProducts.js';
import { WATT_BANDS, CCT_STOPS } from '../config/site.js';
import { waLink, categoryMessage, logEnquiry } from '../lib/whatsapp.js';
import { api } from '../api/client.js';

export default function Shop() {
  const { t, tf, lang } = useLang();
  const site = useSettings();
  const categories = useCategories();
  const [params, setParams] = useSearchParams();
  const [railOpen, setRailOpen] = useState(false);

  const category = params.get('category') || 'all';
  const cct = params.get('cct') || 'all';
  const sort = params.get('sort') || 'popular';
  const q = params.get('q') || '';
  const watts = (params.get('watt') || '').split(',').filter(Boolean);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === 'all') next.delete(k); else next.set(k, v);
    });
    setParams(next, { replace: true });
    setRailOpen(false);
  };

  const toggleWatt = (id) => {
    const next = watts.includes(id) ? watts.filter((w) => w !== id) : [...watts, id];
    set({ watt: next.join(',') });
  };

  const { products, total, loading, error } = useProducts({
    category, cct, sort, q, watt: watts.join(','), limit: 60,
  });

  const activeCat = categories.find((c) => c.id === category);
  const catLabel = activeCat ? tf(activeCat, 'name') : t('the catalogue');

  return (
    <div className="wrap">
      <div className="crumb">
        <Link to="/">{t('Home')}</Link> / <span>{activeCat ? catLabel : t('All products')}</span>
        {q ? <> / <span>{t('Search')}: “{q}”</span></> : null}
      </div>

      <div className="shop">
        <aside className={`rail${railOpen ? ' open' : ''}`}>
          <div className="rail-sec">
            <h4>{t('Category')}</h4>
            <div className="rail-list">
              <button type="button" aria-current={category === 'all'} onClick={() => set({ category: 'all' })}>
                {t('All products')} <span className="n">{categories.reduce((n, c) => n + c.productCount, 0)}</span>
              </button>
              {categories.map((c) => (
                <button key={c.id} type="button" aria-current={category === c.id}
                        onClick={() => set({ category: c.id })}>
                  {tf(c, 'name')} <span className="n">{c.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rail-sec">
            <h4>{t('Wattage')}</h4>
            {WATT_BANDS.map((w) => (
              <label className="check" key={w.id}>
                <input type="checkbox" checked={watts.includes(w.id)} onChange={() => toggleWatt(w.id)} />
                {tf(w, 'name')}
              </label>
            ))}
          </div>

          <div className="rail-sec">
            <h4>{t('Colour temperature')}</h4>
            <select className="sel sel-block" value={cct} onChange={(e) => set({ cct: e.target.value })}>
              <option value="all">{t('Any')}</option>
              {CCT_STOPS.map((s) => <option key={s.k} value={s.k}>{s.k} K</option>)}
            </select>
          </div>

          <div className="rail-sec">
            <button type="button" className="btn btn-ghost btn-block btn-sm"
                    onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              {t('Clear all filters')}
            </button>
          </div>
        </aside>

        <div>
          <div className="toolbar">
            <span className="count"><b>{total}</b> {t('products in')} {catLabel}</span>
            <div className="toolbar-actions">
              <button type="button" className="icon-btn filter-toggle" onClick={() => setRailOpen((v) => !v)}>
                <IconFilter /> {t('Filters')}
              </button>
              <a className="btn btn-wa btn-sm" target="_blank" rel="noopener noreferrer"
                 href={waLink(site.whatsapp, categoryMessage(catLabel, lang, site.name))}
                 onClick={() => logEnquiry(api, { source: 'whatsapp', categoryId: activeCat?.id, lang, page: 'shop' })}>
                <IconWhatsApp /> {t('Rate list')}
              </a>
              <select className="sel" value={sort} onChange={(e) => set({ sort: e.target.value })}
                      aria-label={t('Sort')}>
                <option value="popular">{t('Best sellers first')}</option>
                <option value="low">{t('Price: low to high')}</option>
                <option value="high">{t('Price: high to low')}</option>
                <option value="name">{t('Name A–Z')}</option>
              </select>
            </div>
          </div>

          <ErrorNote error={error} />

          {loading ? <Spinner /> : products.length ? (
            <div className="p-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState
              title={t('Nothing matches those filters')}
              hint={t('Try clearing the wattage or colour-temperature filter.')}
              action={<button type="button" className="btn btn-ghost"
                              onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                        {t('Clear filters')}
                      </button>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
