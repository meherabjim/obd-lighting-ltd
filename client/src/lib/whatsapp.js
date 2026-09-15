/**
 * The site takes no orders — every "buy" action opens WhatsApp with the
 * message already written, so the customer only has to press send.
 */
export function waLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function productMessage(product, lang, brand = 'OBD LIGHTING LTD') {
  if (!product) return generalMessage(lang, brand);
  const name = lang === 'bn' ? (product.nameBn || product.name) : product.name;
  return lang === 'bn'
    ? `আসসালামু আলাইকুম, ${brand} — "${name}" (${product.sku}) এর দাম ও স্টক জানতে চাই।`
    : `Hello ${brand} — I'd like the price and stock for "${name}" (${product.sku}).`;
}

export function categoryMessage(categoryName, lang, brand = 'OBD LIGHTING LTD') {
  return lang === 'bn'
    ? `আসসালামু আলাইকুম, ${brand} — ${categoryName} এর রেট লিস্ট পাঠাবেন?`
    : `Hello ${brand} — could you send the rate list for ${categoryName}?`;
}

export function generalMessage(lang, brand = 'OBD LIGHTING LTD') {
  return lang === 'bn'
    ? `আসসালামু আলাইকুম, ${brand} — আপনাদের পণ্য সম্পর্কে জানতে চাই।`
    : `Hello ${brand} — I would like to ask about your products.`;
}

/**
 * Log that someone tapped WhatsApp or call, so the admin's enquiry list
 * shows demand even before the chat arrives. Fire-and-forget: if it fails
 * the customer must still reach WhatsApp.
 */
export function logEnquiry(api, payload) {
  try { api.sendEnquiry(payload).catch(() => {}); } catch { /* never block the link */ }
}
