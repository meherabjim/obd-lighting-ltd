import { Link } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCategories } from '../context/CatalogueContext.jsx';

export default function Footer() {
  const { t, tf } = useLang();
  const site = useSettings();
  const categories = useCategories();

  return (
    <footer className="site">
      <div className="wrap">
        <div className="f-grid">
          <div>
            <div className="f-brand">
              <img src={site.logo} alt="" width="52" height="52"
                   onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div>
                <div className="f-name">{site.legalName}</div>
                <div className="f-tag">{tf(site, 'tagline')}</div>
              </div>
            </div>
            <p className="about">{tf(site, 'aboutText')}</p>
            <div className="f-contact">
              <span>{tf(site, 'address')}</span>
              <span className="mono">{site.phoneDisplay}</span>
              <span className="mono">{site.email}</span>
              <span className="mono f-licence">{t('Trade licence')} {site.tradeLicence}</span>
            </div>
          </div>

          <div>
            <h5>{t('Shop')}</h5>
            <ul>
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}><Link to={`/shop?category=${c.id}`}>{tf(c, 'name')}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5>{t('Company')}</h5>
            <ul>
              <li><Link to="/about">{t('About')}</Link></li>
              <li><Link to="/projects">{t('Trade & projects')}</Link></li>
              {site.facebook ? <li><a href={site.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li> : null}
              {site.youtube ? <li><a href={site.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li> : null}
            </ul>
          </div>

          <div>
            <h5>{t('Help')}</h5>
            <ul>
              <li>{t('Delivery & returns')}</li>
              <li>{t('Warranty claim')}</li>
              <li>{t('Bulk quotation')}</li>
            </ul>
          </div>
        </div>

        <div className="f-bottom">
          <span>© {new Date().getFullYear()} {site.legalName} — {tf(site, 'footerNote')}</span>
          <div className="pay-marks">
            <span className="pay-mark">bKash</span>
            <span className="pay-mark">Nagad</span>
            <span className="pay-mark">{t('Bank transfer')}</span>
            <span className="pay-mark">{t('Cash')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
