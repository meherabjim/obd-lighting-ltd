import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

/** Fetch a product list for the given filters, with loading and error state. */
export function useProducts(params) {
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.products(JSON.parse(key))
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key]);

  return { ...data, loading, error };
}
