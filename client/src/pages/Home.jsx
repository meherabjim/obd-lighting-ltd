import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import NoPhoto from '../components/NoPhoto.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Spinner from '../components/Spinner.jsx';
import { IconArrow, IconLeft, IconRight, IconList, IconCaret, IconShield, IconTag, IconTools, IconTruck, IconWhatsApp } from '../components/Icons.jsx';
import { useLang, bdt } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCategories } from '../context/CatalogueContext.jsx';
import { useProducts } from '../lib/useProducts.js';
import { waLink, productMessage, logEnquiry } from '../lib/whatsapp.js';
import { api } from '../api/client.js';
import { CCT_STOPS } from '../config/site.js';

/* ------------------------------------------------------------------ */
/* Hero slider                                                         */
/*                                                                     */
/* Every slide is a real product the admin ticked in                   */
/* Admin -> Products. Nothing here is invented: the picture is the     */
/* product's own photograph, the words are its own name and specs.     */
/* With nothing ticked, the hero is a plain text panel — no artwork.   */
/* ------------------------------------------------------------------ */

/** The spec rows worth putting under a hero slide, best first. */
const HERO_FACTS = ['Wattage', 'Luminous flux', 'CCT', 'IP', 'Length', 'Cap'];

/** Price, then the two most useful specs this product actually has. */
function heroFacts(p) {
  return HERO_FACTS
    .map((k) => p.specs?.find((s) => s.key === k))
    .filter(Boolean)
    .slice(0, 2);
}

function Hero() {
  const { t, tf, lang, specLabel } = useLang();
  const site = useSettings();
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  const picked = site.heroProducts || [];
  const { products, loading } = useProducts(
    picked.length ? { slugs: picked.join(','), limit: 5 } : { featured: 1, limit: 5 },
  );

  // Honour the order the admin dragged them into.
  const slides = picked.length
    ? picked.map((s) => products.find((p) => p.slug === s)).filter(Boolean).slice(0, 5)
    : products.slice(0, 5);

  const count = slides.length;

  const play = () => {
    clearInterval(timer.current);
    if (count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 7000);
  };
  const pause = () => clearInterval(timer.current);

  useEffect(() => { setIndex(0); play(); return pause; }, [count]);

  // Hold the space while the first request is in flight. Rendering the empty
  // state here would flash an admin-only instruction at every visitor, and
  // would flash again when the settings arrive and the query changes.
  if (!count && (loading || !site.loaded)) {
    return <section className="hero"><div className="wrap"><div className="hero-hold" /></div></section>;
  }

  // Nothing chosen and nothing featured — a text-only hero rather than a gap.
  if (!count) {
    return (
      <section className="hero">
        <div className="wrap">
          <div className="slide slide-plain">
            <div className="slide-copy">
              <span className="eyebrow">{tf(site, 'tagline')}</span>
              <h1>{site.name || site.legalName}</h1>
              <p className="lede">{tf(site, 'aboutText')}</p>
              <div className="slide-cta">
                <Link className="btn btn-primary" to="/shop">{t('All products')} <IconArrow /></Link>
                <Link className="btn btn-ghost" to="/projects">{t('Request a project quote')}</Link>
              </div>
              <p className="hero-hint">
                {t('Tick up to 5 products in Admin → Products to show them here.')}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const p = slides[Math.min(index, count - 1)];
  const go = (n) => setIndex((n + count) % count);
  const wa = waLink(site.whatsapp, productMessage(p, lang, site.name));

  return (
    <section className="hero" onMouseEnter={pause} onMouseLeave={play}>
      <div className="wrap">
        <div className="slides">
          <div className="slide" key={p.slug}>
            <div className="slide-copy">
              <span className="eyebrow mono">{p.sku}</span>
              <h1>{tf(p, 'name')}</h1>
              <p className="lede">
                {p.specs?.length
                  ? p.specs.slice(0, 3).map((s) => s.value).join(' · ')
                  : t('Ask on WhatsApp for the full specification.')}
              </p>
              <div className="slide-cta">
                <Link className="btn btn-primary" to={`/product/${p.slug}`}>
                  {t('See details')} <IconArrow />
                </Link>
                <a className="btn btn-ghost" href={wa} target="_blank" rel="noopener noreferrer"
                   onClick={() => logEnquiry(api, {
                     source: 'whatsapp', productSlug: p.slug, lang, page: 'hero',
                   })}>
                  <IconWhatsApp /> {t('Ask on WhatsApp')}
                </a>
              </div>
              <div className="slide-facts">
                <div>
                  <div className="fv">{bdt(p.price)}</div>
                  <div className="fl">{t('Price')}</div>
                </div>
                {heroFacts(p).map((f) => (
                  <div key={f.key}>
                    <div className="fv">{f.value}</div>
                    {/* specLabel, not t(): spec names live in their own table */}
                    <div className="fl">{specLabel(f.key)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="scene-wrap">
              <Link
                className={p.image ? 'scene hero-shot' : 'scene hero-shot p-art-empty'}
                to={`/product/${p.slug}`}
              >
                {p.image
                  ? <img src={p.image} alt={tf(p, 'name')} />
                  : <NoPhoto name={p.name} sku={p.sku} size={220} />}
                <span className="scene-tag"><span className="tdot" />{p.sku}</span>
              </Link>
            </div>
          </div>
        </div>

        {count > 1 && (
          <div className="slide-nav">
            <div className="arrows">
              <button type="button" onClick={() => { pause(); go(index - 1); play(); }} aria-label="Previous slide"><IconLeft /></button>
              <button type="button" onClick={() => { pause(); go(index + 1); play(); }} aria-label="Next slide"><IconRight /></button>
            </div>
            <div className="dots">
              {slides.map((s, i) => (
                <button key={s.slug} type="button" aria-current={i === index}
                        aria-label={s.name} onClick={() => { pause(); go(i); play(); }} />
              ))}
            </div>
            <span className="slide-count mono">{index + 1} / {count}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Category sidebar (accordion)                                        */
/* ------------------------------------------------------------------ */
function CategoryRail() {
  const { t, tf } = useLang();
  const categories = useCategories();
  // `undefined` means "not chosen yet", `null` means "the user closed it".
  // Keying the effect on `open` as well made closing impossible: setting it to
  // null re-ran the effect, which immediately reopened the first category.
  const [open, setOpen] = useState(undefined);
  const firstCategory = categories[0]?.id;

  useEffect(() => {
    setOpen((cur) => (cur === undefined && firstCategory ? firstCategory : cur));
  }, [firstCategory]);

  return (
    <aside className="home-rail">
      <div className="rh"><IconList /> {t('Categories')}</div>
      {categories.map((c) => {
        const isOpen = open === c.id;
        return (
          <div className="acc" data-open={isOpen} key={c.id}>
            <button type="button" className="acc-top" aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : c.id)}>
              <span className="nm">{tf(c, 'name')}</span>
              <span className="n">{c.productCount}</span>
              <span className="cv"><IconCaret /></span>
            </button>
            {isOpen && (
              <div className="acc-body">
                {c.subs.map((s, i) => (
                  <Link key={i} to={`/shop?category=${c.id}`}>{tf(s, 'name')}</Link>
                ))}
                <Link className="all" to={`/shop?category=${c.id}`}>
                  {t('All products')} ({c.productCount}) <IconArrow />
                </Link>
              </div>
            )}
          </div>
        );
      })}
      <div className="rail-cta">
        <div className="t">{t("Can't find a fitting?")}</div>
        <div className="d">{t('Send the model number or a photo — we source non-stock items on order.')}</div>
        <Link className="btn btn-ghost btn-block btn-sm" to="/projects">{t('Ask the team')}</Link>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Colour temperature finder                                           */
/* ------------------------------------------------------------------ */
function CctFinder() {
  const { t, tf, isBn } = useLang();
  const [i, setI] = useState(3);
  const stop = CCT_STOPS[i];

  return (
    <div className="cct-band">
      <div>
        <span className="eyebrow">{t('Specify it right')}</span>
        <h2 className="cct-h">{t('Which colour temperature?')}</h2>
        <p className="cct-p">{t('The most common mistake in a lighting order is the wrong Kelvin. Every fixture is available 2700 K to 6500 K — drag the slider to see what each one looks like, and where it belongs.')}</p>
      </div>
      <div className="cct">
        <div className="cct-head">
          <span className="eyebrow">{t('Colour temperature finder')}</span>
          <span className="chip">Kelvin</span>
        </div>
        <div className="cct-stage">
          <div id="cctGlow" style={{ background: stop.hex }} />
          <div className="cct-disc" style={{ background: stop.hex }} />
        </div>
        <input type="range" min="0" max={CCT_STOPS.length - 1} step="1" value={i}
               onChange={(e) => setI(Number(e.target.value))}
               aria-label={t('Colour temperature')} />
        <div className="cct-scale">
          {CCT_STOPS.map((s) => <span key={s.k}>{s.k / 1000}K</span>)}
        </div>
        <div className="cct-read">
          <div>
            <div className="k">{stop.k} K</div>
            <div className="n">{tf(stop, 'name')} — {isBn ? stop.useBn : stop.use}</div>
          </div>
        </div>
        <Link className="btn btn-ghost btn-block cct-go" to={`/shop?cct=${stop.k}`}>
          {isBn ? `${stop.k}K পণ্য দেখুন` : `See ${stop.k}K products`} <IconArrow />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { t, tf } = useLang();
  const site = useSettings();
  const featured = useProducts({ featured: 1, limit: 5 });
  const newest = useProducts({ sort: 'newest', limit: 5 });

  return (
    <>
      <Hero />

      <div className="wrap">
        <div className="home-grid">
          <CategoryRail />

          <div className="home-main">
            <section className="section section-tight"><CctFinder /></section>

            <section className="section section-tight">
              <div className="props">
                <div className="prop"><IconShield /><div>
                  <div className="t">{t('Genuine stock only')}</div>
                  <div className="d">{t('Serial-checked imports. Counterfeit lamps are the biggest complaint in this market — we sell against it.')}</div>
                </div></div>
                <div className="prop"><IconTag /><div>
                  <div className="t">{t('Trade pricing from 50 pcs')}</div>
                  <div className="d">{t('Contractors and electricians get a tiered rate card after one verification call.')}</div>
                </div></div>
                <div className="prop"><IconTools /><div>
                  <div className="t">{t('Wiring & installation')}</div>
                  <div className="d">{t('In-house team for factory retrofits, shade hanging and street lighting runs.')}</div>
                </div></div>
                <div className="prop"><IconTruck /><div>
                  <div className="t">{t('Delivery nationwide')}</div>
                  <div className="d">{t('Inside Dhaka ৳80, elsewhere ৳150. Free over ৳5,000.')}</div>
                </div></div>
              </div>
            </section>

            <section className="section section-tight">
              <div className="section-head">
                <div><h2>{t('Best sellers')}</h2><p>{t('What contractors reorder most often.')}</p></div>
                <Link className="link-more" to="/shop">{t('See all')} <IconArrow /></Link>
              </div>
              {featured.loading ? <Spinner /> : (
                <div className="p-grid">
                  {featured.products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
              {!featured.loading && !featured.products.length && (
                <p className="muted">{t('Products you add from the admin panel will appear here.')}</p>
              )}
            </section>

            <section className="section section-tight">
              <div className="band band-photo">
                <img className="band-img" src="/banner-range.jpg" alt="" loading="lazy" />
                <div>
                  <span className="eyebrow">{t('Projects & bulk supply')}</span>
                  <h3>{t('Send us a BOQ, get a priced schedule back in 24 hours')}</h3>
                  <p>{t('Upload a bill of quantities or a floor plan. We return lamp-by-lamp selection with lumen calculations, lead times and a payment schedule — no charge, no obligation.')}</p>
                </div>
                <Link className="btn btn-dark" to="/projects">{t('Start a project enquiry')} <IconArrow /></Link>
              </div>
            </section>

            {newest.products.length > 0 && (
              <section className="section section-tight">
                <div className="section-head">
                  <div><h2>{t('New arrivals & offers')}</h2><p>{t('Updated from the admin panel.')}</p></div>
                </div>
                <div className="p-grid">
                  {newest.products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            )}

            <section className="section section-tight">
              <div className="section-head">
                <div><h2>{t('One standard, every fixture')}</h2>
                  <p>{t('The same driver and optical spec runs through the whole range.')}</p></div>
              </div>
              <div className="std">
                <div className="std-certs">
                  <div className="eyebrow">{t('Certified to')}</div>
                  <div className="cert-row">
                    {site.certifications.map((c) => <span className="cert" key={c}>{c}</span>)}
                  </div>
                  <p className="std-note">{t('Isolated driver, power factor above 0.96 and THD under 8% — that is what keeps a fitting alive on an unstable line.')}</p>
                  <div className="warranty-badge">
                    <div className="wy">3</div>
                    <div>
                      <div className="wt">{t('year replacement warranty')}</div>
                      <div className="wd">{t('On every fixture — the invoice is the warranty card')}</div>
                    </div>
                  </div>
                </div>
                <div className="std-table">
                  <table className="spec-table">
                    <tbody>
                      <tr><th>{t('Input voltage')}</th><td>AC 85–265 V</td></tr>
                      <tr><th>{t('Frequency')}</th><td>50–60 Hz</td></tr>
                      <tr><th>{t('Power factor')}</th><td>PF &gt; 0.96</td></tr>
                      <tr><th>THD</th><td>&lt; 8%</td></tr>
                      <tr><th>{t('Driver')}</th><td>{t('Isolated')}</td></tr>
                      <tr><th>{t('CRI')}</th><td>Ra &gt; 80–90</td></tr>
                      <tr><th>{t('Efficacy')}</th><td>110 lm/W</td></tr>
                      <tr><th>{t('Service life')}</th><td>50,000 h</td></tr>
                      <tr><th>{t('Material')}</th><td>{t('Aluminium + PC diffuser')}</td></tr>
                      <tr><th>{t('Operating temp')}</th><td>−20 °C to 45 °C</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
