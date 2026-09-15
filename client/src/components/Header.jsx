import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCategories } from '../context/CatalogueContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { waLink, generalMessage, logEnquiry } from '../lib/whatsapp.js';
import { api } from '../api/client.js';
import { IconSearch, IconList, IconCaret, IconGrid, IconPhone, IconWhatsApp, IconLock } from './Icons.jsx';

const NAV = [
  ['/', 'Home'],
  ['/shop', 'Shop all'],
  ['/projects', 'Trade & projects'],
  ['/about', 'About'],
];

export default function Header() {
  const { t, tf, lang, setLang } = useLang();
  const site = useSettings();
  const categories = useCategories();
  // Only a signed-in admin sees a way into the dashboard. Visitors, and any
  // future non-admin account, get no link at all — not a disabled one.
  const { admin } = useAuth();
  const isAdmin = admin?.role === 'admin';
  const navigate = useNavigate();
  const [mega, setMega] = useState(false);
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState('all');

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('q', term.trim());
    if (scope !== 'all') params.set('category', scope);
    navigate(`/shop?${params.toString()}`);
    setMega(false);
  };

  return (
    <>
      <div className="util">
        <div className="wrap">
          <span><strong>{site.phoneDisplay}</strong></span>
          <span className="dot" /><span>{site.email}</span>
          <span className="dot" /><span>{tf(site, 'footerNote')}</span>
          <span className="spacer" />
          <Link to="/projects">{t('Get a trade account')}</Link>
          {/* Signed out: a quiet way in for the owner. Signed in as admin:
              the same slot shows who is signed in and goes back to the
              dashboard. A non-admin account sees neither. */}
          {isAdmin
            ? <Link className="util-admin" to="/admin"><IconGrid /> {admin.name}</Link>
            : (!admin && <Link className="util-admin" to="/admin"><IconLock /> {t('Login')}</Link>)}
          <span className="langsw" role="group" aria-label="Language">
            <button type="button" onClick={() => setLang('en')} aria-current={lang === 'en'}>EN</button>
            <button type="button" onClick={() => setLang('bn')} aria-current={lang === 'bn'}>বাংলা</button>
          </span>
        </div>
      </div>

      <header className="site">
        <div className="wrap hdr">
          <Link className="brand" to="/" aria-label={`${site.legalName} home`}>
            <img className="mark" src={site.logo} alt="" width="46" height="46"
                 onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            <span className="brand-text">
              <span className="name">{site.name}</span>
              <span className="sub">{tf(site, 'tagline')}</span>
            </span>
          </Link>

          <form className="search" onSubmit={submit} role="search">
            <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label={t('All categories')}>
              <option value="all">{t('All categories')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{tf(c, 'name')}</option>)}
            </select>
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('Search by name, model or wattage — try IP66')}
              aria-label={t('Search')}
            />
            <button type="submit"><IconSearch /><span className="lbl">{t('Search')}</span></button>
          </form>

          <div className="hdr-actions">
            <a className="icon-btn" href={`tel:+88${site.phone}`}
               onClick={() => logEnquiry(api, { source: 'phone', lang, page: 'header' })}>
              <IconPhone /><span className="lbl">{site.phoneDisplay}</span>
            </a>
            <a className="icon-btn icon-wa" target="_blank" rel="noopener noreferrer"
               href={waLink(site.whatsapp, generalMessage(lang, site.name))}
               onClick={() => logEnquiry(api, { source: 'whatsapp', lang, page: 'header' })}>
              <IconWhatsApp /><span className="lbl">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <nav className="main">
        <div className="wrap">
          <button type="button" className="cats" aria-expanded={mega} onClick={() => setMega((v) => !v)}>
            <IconList /> {t('All categories')} <span className="caret"><IconCaret /></span>
          </button>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}
                     className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {t(label)}
            </NavLink>
          ))}

        </div>
      </nav>

      {mega && (
        <div className="mega" onMouseLeave={() => setMega(false)}>
          <div className="wrap">
            <div className="mega-grid">
              {categories.map((c) => (
                <div className="mega-col" key={c.id}>
                  <Link className="ch" to={`/shop?category=${c.id}`} onClick={() => setMega(false)}>
                    
                    <span>
                      <span className="cn">{tf(c, 'name')}</span>
                      <span className="cc">{c.productCount} SKU</span>
                    </span>
                  </Link>
                  <ul>
                    {c.subs.map((s, i) => (
                      <li key={i}>
                        <Link to={`/shop?category=${c.id}`} onClick={() => setMega(false)}>{tf(s, 'name')}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
