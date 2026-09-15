import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { SITE } from '../config/site.js';

const SettingsContext = createContext(SITE);

/**
 * Contact details come from the database so the client can change them
 * from the admin panel. config/site.js is the fallback used until the
 * server answers (and if it never does).
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(SITE);

  useEffect(() => {
    let alive = true;
    api.settings()
      .then((s) => {
        if (!alive) return;
        // A falsy body (a 204, or a proxy returning nothing) must still settle
        // the flag, or the hero holds a blank placeholder forever.
        if (!s) { setSettings((cur) => ({ ...cur, loaded: true })); return; }
        setSettings({
          ...SITE,
          // One value drives every place the name appears.
          name: s.company_name || SITE.name,
          legalName: s.company_name || SITE.legalName,
          legalNameBn: s.company_name_bn || SITE.legalNameBn,
          tagline: s.tagline || SITE.tagline,
          taglineBn: s.tagline_bn || SITE.taglineBn,
          phone: s.phone || SITE.phone,
          phoneDisplay: s.phone
            ? String(s.phone).replace(/^(\d{5})(\d+)$/, '$1 $2')
            : SITE.phoneDisplay,
          whatsapp: s.whatsapp || SITE.whatsapp,
          email: s.email || SITE.email,
          address: s.address || SITE.address,
          addressBn: s.address_bn || SITE.addressBn,
          tradeLicence: s.trade_licence || SITE.tradeLicence,
          hours: s.hours || SITE.hours,
          hoursBn: s.hours_bn || SITE.hoursBn,
          warranty: s.warranty || SITE.warranty,
          warrantyBn: s.warranty_bn || SITE.warrantyBn,
          certifications: s.certifications ? s.certifications.split(',') : SITE.certifications,
          aboutText: s.about_text || SITE.aboutText,
          aboutTextBn: s.about_text_bn || SITE.aboutTextBn,
          footerNote: s.footer_note || SITE.footerNote,
          footerNoteBn: s.footer_note_bn || SITE.footerNoteBn,
          facebook: s.facebook || '',
          youtube: s.youtube || '',
          // Slugs of the products the admin put in the hero slider, in order.
          heroProducts: String(s.hero_products || '').split(',').map((x) => x.trim()).filter(Boolean),
          // Lets the hero hold its space until the real values are in, rather
          // than rendering a fallback built from config/site.js defaults.
          loaded: true,
        });
      })
      .catch(() => {
        // The API is down or still starting. Mark the fallback as settled
        // anyway, or the hero would hold a blank space forever waiting.
        if (alive) setSettings((cur) => ({ ...cur, loaded: true }));
      });
    return () => { alive = false; };
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
