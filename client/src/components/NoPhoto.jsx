/**
 * The stand-in for a product or category that has no photograph yet.
 *
 * Deliberately not a drawing of a light. The client asked that nothing on
 * this site be a picture they did not take, so this is a plain lettered
 * tile — obviously a placeholder, never mistakable for the product. Upload
 * a photo in Admin -> Products and it disappears.
 */

/** "T8 Double Shade 2×20W" -> "TD". Digits are skipped; they read as noise. */
export function initials(text) {
  const words = String(text || '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w));
  if (!words.length) return '—';
  const first = words[0][0];
  const second = words.length > 1 ? words[words.length - 1][0] : (words[0][1] || '');
  return (first + second).toUpperCase();
}

export default function NoPhoto({ name, sku, size = 92, label = true }) {
  return (
    <span className="nophoto" style={{ '--np': `${size}px` }} aria-hidden="true">
      <span className="np-mark">{initials(name)}</span>
      {label && sku ? <span className="np-sku mono">{sku}</span> : null}
    </span>
  );
}
