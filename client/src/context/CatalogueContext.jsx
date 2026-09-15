import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const CatalogueContext = createContext({ categories: [], loading: true, reload: () => {} });

/** Categories are needed by the header, footer, sidebar and shop — fetch once. */
export function CatalogueProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.categories()
      .then((c) => { if (alive) setCategories(Array.isArray(c) ? c : []); })
      .catch(() => { if (alive) setCategories([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [nonce]);

  return (
    <CatalogueContext.Provider value={{ categories, loading, reload: () => setNonce((n) => n + 1) }}>
      {children}
    </CatalogueContext.Provider>
  );
}

export const useCatalogue = () => useContext(CatalogueContext);
export const useCategories = () => useContext(CatalogueContext).categories;
