import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Spinner from '../components/Spinner.jsx';
import Login from './Login.jsx';
import { IconLogout, IconGrid } from '../components/Icons.jsx';

const TABS = [
  ['/admin', 'Dashboard', true],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/slider', 'Home slider'],
  ['/admin/enquiries', 'Enquiries'],
  ['/admin/settings', 'Settings'],
];

export default function AdminLayout() {
  const { admin, checking, logout } = useAuth();
  const site = useSettings();
  const navigate = useNavigate();

  if (checking) return <div className="admin-shell"><Spinner /></div>;
  if (!admin) return <Login />;
  // Signed in, but not an admin: the dashboard stays shut. The server
  // refuses these requests too — this is only so the screen says why.
  if (admin.role !== 'admin') {
    return (
      <div className="admin-shell">
        <div className="crash">
          <div className="crash-card">
            <h1>This account cannot open the dashboard</h1>
            <p>
              {admin.name} is signed in, but only an administrator account can
              manage products, categories and settings.
            </p>
            <div className="crash-actions">
              <Link className="btn btn-primary" to="/">Back to the site</Link>
              <button type="button" className="btn btn-ghost"
                      onClick={() => { logout(); navigate('/admin'); }}>
                Sign in as someone else
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="wrap">
          <Link to="/admin" className="admin-brand">
            <IconGrid /> {site.name} <span>Admin</span>
          </Link>
          <nav className="admin-tabs">
            {TABS.map(([to, label, end]) => (
              <NavLink key={to} to={to} end={!!end}
                       className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-who">
            <Link to="/" className="btn btn-ghost btn-sm">View site</Link>
            <span className="admin-email">{admin.email}</span>
            <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => { logout(); navigate('/'); }}>
              <IconLogout /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="wrap admin-main">
        <Outlet />
      </main>
    </div>
  );
}
