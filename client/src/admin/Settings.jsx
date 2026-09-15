import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/** Field groups, so the page reads like a form and not a database dump. */
const GROUPS = [
  ['Contact', [
    ['phone', 'Phone number', 'Shown in the header and used by the call button'],
    ['whatsapp', 'WhatsApp number', 'International format, no + — e.g. 8801994999664'],
    ['email', 'Email'],
  ]],
  ['Company', [
    ['company_name', 'Company name (English)'],
    ['company_name_bn', 'Company name (বাংলা)'],
    ['tagline', 'Tagline (English)'],
    ['tagline_bn', 'Tagline (বাংলা)'],
    ['trade_licence', 'Trade licence number'],
  ]],
  ['Address & hours', [
    ['address', 'Address (English)'],
    ['address_bn', 'Address (বাংলা)'],
    ['hours', 'Opening hours (English)'],
    ['hours_bn', 'Opening hours (বাংলা)'],
  ]],
  ['Delivery & warranty', [
    ['delivery_inside_dhaka', 'Delivery inside Dhaka ৳'],
    ['delivery_outside_dhaka', 'Delivery outside Dhaka ৳'],
    ['free_delivery_over', 'Free delivery over ৳'],
    ['warranty', 'Warranty (English)'],
    ['warranty_bn', 'Warranty (বাংলা)'],
    ['certifications', 'Certifications, comma separated'],
  ]],
  ['Footer & about text', [
    ['about_text', 'About paragraph (English)', 'The short description in the footer'],
    ['about_text_bn', 'About paragraph (বাংলা)'],
    ['footer_note', 'Strip line (English)', 'Shown in the top bar and the footer'],
    ['footer_note_bn', 'Strip line (বাংলা)'],
  ]],
  ['Links', [
    ['facebook', 'Facebook page URL'],
    ['youtube', 'YouTube channel URL'],
  ]],
];

export default function Settings() {
  const { admin } = useAuth();
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [pwState, setPwState] = useState({ busy: false, done: false, error: null });

  useEffect(() => { api.adminSettings().then(setValues).catch(setError); }, []);

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try { await api.updateSettings(values); setSaved(true); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.again) { setPwState({ busy: false, done: false, error: 'The two new passwords do not match.' }); return; }
    setPwState({ busy: true, done: false, error: null });
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', again: '' });
      setPwState({ busy: false, done: true, error: null });
    } catch (err) {
      setPwState({ busy: false, done: false, error: err.message });
    }
  };

  if (error && !values) return <ErrorNote error={error} />;
  if (!values) return <Spinner />;

  return (
    <>
      <div className="admin-head"><h1>Settings</h1></div>
      <p className="hint page-hint">
        These values appear across the site — change them here and the site follows,
        no code editing needed.
      </p>

      <form onSubmit={save}>
        {GROUPS.map(([title, fields]) => (
          <div className="panel" key={title}>
            <h3>{title}</h3>
            <div className="fields">
              {fields.map(([key, label, hint]) => (
                <div className="field" key={key}>
                  <label htmlFor={`s_${key}`}>{label}</label>
                  <input id={`s_${key}`} value={values[key] ?? ''} onChange={set(key)} />
                  {hint ? <span className="field-hint">{hint}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        {error ? <div className="error-note" role="alert">{error}</div> : null}

        <div className="form-actions sticky-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved ? <span className="saved-note">Saved.</span> : null}
        </div>
      </form>

      <form className="panel" onSubmit={changePassword}>
        <h3>Change your password</h3>
        <p className="hint">Signed in as {admin?.email}</p>
        <div className="fields">
          <div className="field">
            <label htmlFor="pwCur">Current password</label>
            <input id="pwCur" type="password" required autoComplete="current-password"
                   value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pwNew">New password</label>
            <input id="pwNew" type="password" required minLength={8} autoComplete="new-password"
                   value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pwAgain">Repeat new password</label>
            <input id="pwAgain" type="password" required minLength={8} autoComplete="new-password"
                   value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
          </div>
        </div>
        {pwState.error ? <div className="error-note" role="alert">{pwState.error}</div> : null}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pwState.busy}>
            {pwState.busy ? 'Changing…' : 'Change password'}
          </button>
          {pwState.done ? <span className="saved-note">Password changed.</span> : null}
        </div>
      </form>
    </>
  );
}
