import { useState } from 'react';
import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { api } from '../api/client.js';
import { IconArrow, IconCheck, IconWhatsApp } from '../components/Icons.jsx';
import { waLink, generalMessage } from '../lib/whatsapp.js';

const PROJECT_TYPES = [
  'Factory / warehouse', 'Office fit-out', 'Apartment building',
  'Retail or showroom', 'Street / campus lighting', 'Other',
];

export default function Projects() {
  const { t, lang } = useLang();
  const site = useSettings();
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', type: PROJECT_TYPES[0], message: '' });
  const [state, setState] = useState({ sending: false, sent: false, error: null });

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ sending: true, sent: false, error: null });
    try {
      await api.sendEnquiry({
        source: 'form',
        name: form.name,
        company: form.company,
        phone: form.phone,
        email: form.email,
        message: `[${form.type}] ${form.message}`,
        page: 'projects',
        lang,
      });
      setState({ sending: false, sent: true, error: null });
      setForm({ name: '', company: '', phone: '', email: '', type: PROJECT_TYPES[0], message: '' });
    } catch (err) {
      setState({ sending: false, sent: false, error: err.message });
    }
  };

  return (
    <div className="wrap">
      <div className="section narrow">
        <span className="eyebrow">{t('Trade & projects')}</span>
        <h2 className="page-h">{t('Buying for a site, not a room')}</h2>
        <p className="page-p">{t('Contractors, consultants and facility teams work differently from retail buyers, so this side of the business works differently too.')}</p>

        <div className="panel">
          <table className="spec-table">
            <tbody>
              <tr><th>{t('Pricing')}</th><td className="td-text">{t('Tiered rate card at 50 / 200 / 1,000 pcs')}</td></tr>
              <tr><th>{t('Payment terms')}</th><td className="td-text">{t('30 days on approved accounts')}</td></tr>
              <tr><th>{t('BOQ turnaround')}</th><td className="td-text">{t('Priced schedule within 24 working hours')}</td></tr>
              <tr><th>{t('Lighting calculation')}</th><td className="td-text">{t('Lux level and fixture count, free with any BOQ')}</td></tr>
              <tr><th>{t('Site support')}</th><td className="td-text">{t('Wiring, shade hanging, installation and commissioning')}</td></tr>
              <tr><th>{t('Warranty handling')}</th><td className="td-text">{t('Replacement from stock, no shipping back to us')}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>{t('Send a project enquiry')}</h3>
          <p className="hint">{t('We reply within one working day. For anything urgent, WhatsApp is faster.')}</p>

          {state.sent ? (
            <div className="success-note" role="status">
              <IconCheck />
              <div>
                <b>{t('Thank you — your enquiry is with us.')}</b>
                <div>{t('We will call you on the number you gave.')}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="fields">
                <div className="field">
                  <label htmlFor="pName">{t('Contact name')} <span className="req">*</span></label>
                  <input id="pName" required value={form.name} onChange={change('name')} />
                </div>
                <div className="field">
                  <label htmlFor="pCompany">{t('Company')}</label>
                  <input id="pCompany" value={form.company} onChange={change('company')} />
                </div>
                <div className="field">
                  <label htmlFor="pPhone">{t('Mobile number')} <span className="req">*</span></label>
                  <input id="pPhone" required inputMode="tel" placeholder="01XXX-XXXXXX"
                         value={form.phone} onChange={change('phone')} />
                </div>
                <div className="field">
                  <label htmlFor="pEmail">{t('Email')}</label>
                  <input id="pEmail" type="email" value={form.email} onChange={change('email')} />
                </div>
                <div className="field full">
                  <label htmlFor="pType">{t('Project type')}</label>
                  <select id="pType" value={form.type} onChange={change('type')}>
                    {PROJECT_TYPES.map((x) => <option key={x} value={x}>{t(x)}</option>)}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="pMsg">{t('What do you need?')} <span className="req">*</span></label>
                  <textarea id="pMsg" rows="4" required value={form.message} onChange={change('message')}
                            placeholder={t('e.g. 240 high bays for a 3-shed knit factory in Gazipur, replacing 400W metal halide')} />
                </div>
              </div>

              {state.error ? <div className="error-note" role="alert">{state.error}</div> : null}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={state.sending}>
                  {state.sending ? t('Sending…') : <>{t('Send enquiry')} <IconArrow /></>}
                </button>
                <a className="btn btn-wa" target="_blank" rel="noopener noreferrer"
                   href={waLink(site.whatsapp, generalMessage(lang, site.name))}>
                  <IconWhatsApp /> {t('Or message on WhatsApp')}
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
