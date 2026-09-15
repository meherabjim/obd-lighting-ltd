import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import NoPhoto from '../components/NoPhoto.jsx';
import ProductCard, { StockPills } from '../components/ProductCard.jsx';
import Spinner, { EmptyState } from '../components/Spinner.jsx';
import WhatsAppFab from '../components/WhatsAppFab.jsx';
import { IconArrow, IconWhatsApp, IconPhone, IconTruck, IconShield, IconBox, IconPin } from '../components/Icons.jsx';
import { useLang, bdt } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { api } from '../api/client.js';
import { waLink, productMessage, logEnquiry } from '../lib/whatsapp.js';

export default function Product() {
  const { slug } = useParams();
  const { t, tf, lang, specLabel } = useLang();
  const site = useSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null); setError(null);
    window.scrollTo(0, 0);
    api.product(slug)
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setError(e); });
    return () => { alive = false; };
  }, [slug]);

  if (error) {
    return (
      <div className="wrap">
        <EmptyState title={t('That product is no longer listed.')}
                    action={<Link className="btn btn-primary" to="/shop">{t('Browse products')}</Link>} />
      </div>
    );
  }
  if (!data) return <div className="wrap"><Spinner /></div>;

  const { product: p, related } = data;
  const warranty = p.specs.find((s) => s.key === 'Warranty')?.value || site.warranty;
  const stockLabel = p.stock === 0 ? t('Out of stock — ask for lead time')
    : p.stock < 50 ? `${t('Low stock')} · ${p.stock} ${t('pcs')}`
    : `${t('In stock')} · ${p.stock} ${t('pcs')}`;
  const stockClass = p.stock === 0 ? 'pill-crit' : p.stock < 50 ? 'pill-warn' : 'pill-ok';
  const waHref = waLink(site.whatsapp, productMessage(p, lang, site.name));

  return (
    <div className="wrap">
      <div className="crumb">
        <Link to="/">{t('Home')}</Link> /
        <Link to={`/shop?category=${p.categoryId}`}>{tf({ name: p.categoryName, nameBn: p.categoryNameBn }, 'name')}</Link> /
        <span>{tf(p, 'name')}</span>
      </div>

      <div className="pdp">
        <div>
          <div className="pdp-art">
            <span className="flags"><StockPills product={p} /></span>
            {p.image ? <img src={p.image} alt={tf(p, 'name')} />
                     : <NoPhoto name={p.name} sku={p.sku} size={210} />}
          </div>

          {p.specs.length > 0 && (
            <div className="panel pdp-specs">
              <h3>{t('Technical specification')}</h3>
              <p className="hint">{t('Manufacturer data sheet values at 25°C ambient.')}</p>
              <table className="spec-table">
                <tbody>
                  {p.specs.map((s) => (
                    <tr key={s.key}><th>{specLabel(s.key)}</th><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="p-brand">{site.name}</div>
          <h1>{tf(p, 'name')}</h1>
          <div className="sku">{t('Model')} {p.sku} · {tf({ name: p.categoryName, nameBn: p.categoryNameBn }, 'name')}</div>

          <div className="pdp-badges">
            <span className={`pill ${stockClass}`}>{stockLabel}</span>
            {site.certifications.map((c) => <span className="cert cert-sm" key={c}>{c}</span>)}
          </div>

          <div className="price-block">
            <span className="now">{bdt(p.price)}</span>
            {p.oldPrice ? <>
              <span className="price-old price-old-lg">{bdt(p.oldPrice)}</span>
              <span className="pill pill-accent">{t('Save')} {bdt(p.oldPrice - p.price)}</span>
            </> : null}
          </div>
          <div className="price-note">{t('Price per piece, VAT included. Invoice with warranty card.')}</div>

          <div className="trade-note">
            <b>{t('Trade price available.')}</b>{' '}
            {bdt(Math.round(p.price * 0.86))} {t('per piece from 50 pcs')},{' '}
            {bdt(Math.round(p.price * 0.79))} {t('from 200 pcs')}.{' '}
            <Link to="/projects">{t('apply for a trade account')}</Link>.
          </div>

          <div className="buy-row">
            <a className="btn btn-wa" href={waHref} target="_blank" rel="noopener noreferrer"
               onClick={() => logEnquiry(api, { source: 'whatsapp', productSlug: p.slug, lang, page: 'product' })}>
              <IconWhatsApp /> {t('Order on WhatsApp')}
            </a>
            <a className="btn btn-ghost" href={`tel:+88${site.phone}`}
               onClick={() => logEnquiry(api, { source: 'phone', productSlug: p.slug, lang, page: 'product' })}>
              <IconPhone /> {t('Call to order')}
            </a>
          </div>
          <p className="buy-note">{t('Send us the model number and quantity — we confirm stock, price and delivery the same day.')}</p>

          <div className="delivery">
            <div><IconTruck /><span>{t('Inside Dhaka ৳80 · next working day. Outside Dhaka ৳150 · 2–3 days. Free over ৳5,000.')}</span></div>
            <div><IconShield /><span><b>{warranty}.</b> {t('Keep the invoice — it is the warranty card.')}</span></div>
            <div><IconBox /><span>{t('Carton of 50 pcs available — ask for master-carton pricing on WhatsApp.')}</span></div>
            <div><IconPin /><span>{tf(site, 'address')}</span></div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section-tight">
          <div className="section-head">
            <div><h2>{t('Others in')} {tf({ name: p.categoryName, nameBn: p.categoryNameBn }, 'name')}</h2></div>
            <Link className="link-more" to={`/shop?category=${p.categoryId}`}>{t('View category')} <IconArrow /></Link>
          </div>
          <div className="p-grid">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}

      <WhatsAppFab product={p} />
    </div>
  );
}
