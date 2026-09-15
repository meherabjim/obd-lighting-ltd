import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function About() {
  const { t, tf } = useLang();
  const site = useSettings();

  return (
    <div className="wrap">
      <div className="section narrow">
        <div className="about-head">
          <img src={site.logo} alt="" width="76" height="76"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div>
            <span className="eyebrow">{t('About')}</span>
            <h2 className="page-h">{tf(site, 'legalName')}</h2>
            <p className="muted">{tf(site, 'tagline')}</p>
          </div>
        </div>

        <img className="page-banner" src="/banner-stock.jpg" alt="" loading="lazy" />

        <p className="page-p">{t('Importer and supplier of LED lighting for homes, offices, factories and roads. Ten product lines built on one electrical standard, supplied with a three-year replacement warranty, and backed by an in-house team for wiring, installation and maintenance.')}</p>

        <div className="panel">
          <h3>{t('Registration')}</h3>
          <p className="hint">{t('Dhaka North City Corporation e-Trade Licence.')}</p>
          <table className="spec-table">
            <tbody>
              <tr><th>{t('Trade name')}</th><td className="td-text">{tf(site, 'legalName')}</td></tr>
              <tr><th>{t('Trade licence no.')}</th><td>{site.tradeLicence}</td></tr>
              <tr><th>{t('Issuing authority')}</th><td className="td-text">{t('Dhaka North City Corporation')}</td></tr>
              <tr><th>{t('Business type')}</th><td className="td-text">{t('Partnership firm')}</td></tr>
              <tr><th>{t('Nature of business')}</th><td className="td-text">{t('Importer & supplier — electrical goods (wholesale)')}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>{t('Where to find us')}</h3>
          <table className="spec-table">
            <tbody>
              <tr><th>{t('Office & counter')}</th><td className="td-text">{tf(site, 'address')}</td></tr>
              <tr><th>{t('Phone')}</th><td>{site.phoneDisplay}</td></tr>
              <tr><th>{t('Email')}</th><td className="td-text">{site.email}</td></tr>
              <tr><th>{t('Counter hours')}</th><td className="td-text">{tf(site, 'hours')}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>{t('What we do')}</h3>
          <p className="hint no-mb">{t('Genuine product supply · wiring · installation · maintenance · lighting consultancy · bulk and project supply')}</p>
        </div>
      </div>
    </div>
  );
}
