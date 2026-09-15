import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { bdt } from '../i18n/index.jsx';
import { IconArrow, IconPlus } from '../components/Icons.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.adminStats().then(setStats).catch(setError);
  }, []);

  if (error) return <ErrorNote error={error} />;
  if (!stats) return <Spinner />;

  const tiles = [
    { label: 'Products live', value: stats.products, note: `${stats.categories} categories`, to: '/admin/products' },
    { label: 'New enquiries', value: stats.newEnquiries, note: `${stats.enquiriesWeek} in the last 7 days`, to: '/admin/enquiries', warn: stats.newEnquiries > 0 },
    { label: 'Out of stock', value: stats.outOfStock, note: `${stats.lowStock} more running low`, to: '/admin/products', warn: stats.outOfStock > 0 },
    { label: 'Stock value', value: bdt(Math.round(stats.stockValue)), note: 'at retail price' },
  ];

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard</h1>
        <Link className="btn btn-primary" to="/admin/products/new"><IconPlus /> Add product</Link>
      </div>

      <div className="kpis">
        {tiles.map((t) => (
          <div className="kpi" key={t.label}>
            <div className="l">{t.label}</div>
            <div className="v" style={t.warn ? { color: 'var(--warn)' } : undefined}>{t.value}</div>
            <div className="d">{t.note}</div>
            {t.to ? <Link className="kpi-link" to={t.to}>Open <IconArrow /></Link> : null}
          </div>
        ))}
      </div>

      {/* One short list of things that are actually worth fixing today.
          Nothing is shown when there is nothing to do. */}
      {(() => {
        const jobs = [
          stats.noPhoto > 0 && {
            k: 'photo',
            text: `${stats.noPhoto} product${stats.noPhoto === 1 ? '' : 's'} have no photograph — they show a plain lettered tile on the site.`,
            to: '/admin/products', cta: 'Add photos',
          },
          stats.emptyCategories > 0 && {
            k: 'cat',
            text: `${stats.emptyCategories} categor${stats.emptyCategories === 1 ? 'y has' : 'ies have'} no products in them yet, so they look empty to a visitor.`,
            to: '/admin/products/new', cta: 'Add a product',
          },
          stats.noBangla > 0 && {
            k: 'bn',
            text: `${stats.noBangla} product${stats.noBangla === 1 ? '' : 's'} have no Bangla name — those cards stay in English when a visitor switches to বাংলা.`,
            to: '/admin/products', cta: 'Fill them in',
          },
        ].filter(Boolean);
        if (!jobs.length) return null;
        return (
          <div className="panel todo">
            <h3>Worth fixing</h3>
            <ul>
              {jobs.map((j) => (
                <li key={j.k}>
                  <span>{j.text}</span>
                  <Link className="btn btn-ghost btn-sm" to={j.to}>{j.cta}</Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {stats.products === 0 && (
        <div className="panel admin-empty">
          <h3>Your catalogue is empty</h3>
          <p className="hint">
            Add your first product and it appears on the site immediately. You need a
            name, a category, an SKU and a price — everything else is optional.
          </p>
          <Link className="btn btn-primary" to="/admin/products/new"><IconPlus /> Add the first product</Link>
        </div>
      )}
    </>
  );
}
