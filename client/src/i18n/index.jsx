import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BN, SPEC_BN } from './strings.js';

const LangContext = createContext(null);
const KEY = 'obd.lang';

const read = () => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'bn' || v === 'en') return v;
  } catch { /* private mode */ }
  return 'en';
};

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(read);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch { /* private mode */ }
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    isBn: lang === 'bn',
    setLang: setLangState,
    toggle: () => setLangState((l) => (l === 'bn' ? 'en' : 'bn')),

    /** t('Add to cart') — English in, chosen language out. */
    t: (key) => (lang === 'bn' ? (BN[key] ?? key) : key),

    /** Pick the Bangla field of an object when it exists: tf(cat, 'name'). */
    tf: (obj, key) => {
      if (!obj) return '';
      if (lang === 'bn') {
        const bn = obj[`${key}Bn`] ?? obj[`${key}_bn`];
        if (bn) return bn;
      }
      return obj[key] ?? '';
    },

    /** Bangla label for a spec-sheet row. */
    specLabel: (key) => (lang === 'bn' ? (SPEC_BN[key] ?? key) : key),
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

/** ৳2,950 */
export const bdt = (n) => '৳' + Number(n ?? 0).toLocaleString('en-US');
