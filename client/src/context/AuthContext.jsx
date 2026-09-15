import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

/** Only staff ever sign in. Customers use the site anonymously. */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) { setChecking(false); return; }
    api.me()
      .then((r) => setAdmin(r.admin))
      .catch(() => { setToken(null); setAdmin(null); })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.login(email, password);
    setToken(r.token);
    setAdmin(r.admin);
    return r.admin;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
