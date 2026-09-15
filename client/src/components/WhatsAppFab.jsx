import { useLang } from '../i18n/index.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { waLink, generalMessage, productMessage, categoryMessage, logEnquiry } from '../lib/whatsapp.js';
import { api } from '../api/client.js';
import { IconWhatsApp } from './Icons.jsx';

/**
 * The floating button. Its message changes with the page, so a customer
 * on a product page sends a message about that product without typing.
 */
export default function WhatsAppFab({ product, categoryName }) {
  const { lang, isBn } = useLang();
  const site = useSettings();

  const message = product
    ? productMessage(product, lang, site.name)
    : categoryName
      ? categoryMessage(categoryName, lang, site.name)
      : generalMessage(lang, site.name);

  return (
    <a
      id="wa"
      href={waLink(site.whatsapp, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      onClick={() => logEnquiry(api, {
        source: 'whatsapp', productSlug: product?.slug, lang, page: 'floating',
      })}
    >
      <IconWhatsApp size={26} />
      <span className="wa-lbl">{isBn ? 'WhatsApp করুন' : 'WhatsApp us'}</span>
    </a>
  );
}
