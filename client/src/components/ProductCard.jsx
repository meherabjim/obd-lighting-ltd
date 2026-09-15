import { Link } from 'react-router-dom';
import NoPhoto from './NoPhoto.jsx';
import { useLang, bdt } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { waLink, productMessage, logEnquiry } from '../lib/whatsapp.js';
import { api } from '../api/client.js';
import { IconWhatsApp } from './Icons.jsx';

/** The four spec values worth showing on a card, in order of usefulness. */
const CHIP_KEYS = ['Wattage', 'Luminous flux', 'CCT', 'IP', 'Cap', 'Type', 'Length', 'Cutout'];

export function StockPills({ product }) {
  const { t } = useLang();
  const out = [];
  if (product.stock === 0) {
    out.push(<span key="o" className="pill pill-crit">{t('Out of stock')}</span>);
  } else if (product.stock < 50) {
    out.push(<span key="l" className="pill pill-warn">{t('Only a few left')}</span>);
  }
  if (product.oldPrice && product.oldPrice > product.price) {
    const off = Math.round((1 - product.price / product.oldPrice) * 100);
    out.push(<span key="s" className="pill pill-accent">−{off}%</span>);
  }
  if (product.isNew) out.push(<span key="n" className="pill pill-blue">{t('New')}</span>);
  return out;
}

export default function ProductCard({ product }) {
  const { t, tf, lang } = useLang();
  const site = useSettings();

  const chips = CHIP_KEYS
    .map((k) => product.specs?.find((s) => s.key === k))
    .filter(Boolean)
    .slice(0, 4);

  const href = waLink(site.whatsapp, productMessage(product, lang, site.name));

  return (
    <article className="p-card">
      <Link className="p-art" to={`/product/${product.slug}`} aria-label={tf(product, 'name')}>
        <span className="flags"><StockPills product={product} /></span>
        {product.image
          ? <img src={product.image} alt={tf(product, 'name')} loading="lazy" />
          : <NoPhoto name={product.name} sku={product.sku} size={92} />}
      </Link>

      <div className="p-body">
        <Link className="p-name" to={`/product/${product.slug}`}>{tf(product, 'name')}</Link>

        <div className="p-specs">
          {chips.map((s) => <span key={s.key} className="chip">{s.value}</span>)}
        </div>

        <div className="p-foot">
          <div>
            <span className="price">{bdt(product.price)}</span>
            {product.oldPrice ? <span className="price-old">{bdt(product.oldPrice)}</span> : null}
            <div className="mono p-sku">{product.sku}</div>
          </div>
          <a
            className="add-btn"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={t('Ask on WhatsApp')}
            aria-label={`${t('Ask on WhatsApp')} — ${tf(product, 'name')}`}
            onClick={() => logEnquiry(api, {
              source: 'whatsapp', productSlug: product.slug, lang, page: 'card',
            })}
          >
            <IconWhatsApp />
          </a>
        </div>
      </div>
    </article>
  );
}
