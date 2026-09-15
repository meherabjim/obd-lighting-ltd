import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { IconArrow } from '../components/Icons.jsx';

/** The only sign-in on the site. Customers never see this. */
export default function Login() {
  const { login } = useAuth();
  const site = useSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src={site.logo} alt="" width="56" height="56"
             onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <h1>{site.name}</h1>
        <p className="login-sub">Admin sign-in</p>

        <div className="field">
          <label htmlFor="lEmail">Email</label>
          <input id="lEmail" type="email" autoComplete="username" required
                 value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lPass">Password</label>
          <input id="lPass" type="password" autoComplete="current-password" required
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error ? <div className="error-note" role="alert">{error}</div> : null}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : <>Sign in <IconArrow /></>}
        </button>

        {/* Signing out lands here, so there has to be a way back to the
            site from this screen — otherwise the only exit is the URL bar. */}
        <Link className="login-back" to="/">← Back to the website</Link>

        <p className="login-hint">
          No account yet? Run <code>npm run setup</code> in the <code>server</code> folder.
        </p>
      </form>
    </div>
  );
}
