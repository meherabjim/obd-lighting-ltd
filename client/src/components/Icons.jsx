/** Small inline icons. Stroke icons inherit currentColor. */
const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconSearch = (p) => <svg width="16" height="16" viewBox="0 0 24 24" {...s} strokeWidth="2.2" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconArrow  = (p) => <svg width="14" height="14" viewBox="0 0 24 24" {...s} strokeWidth="2.3" {...p}><path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5" /></svg>;
export const IconCaret  = (p) => <svg width="12" height="12" viewBox="0 0 24 24" {...s} strokeWidth="2.6" {...p}><path d="m5 9 7 7 7-7" /></svg>;
export const IconLeft   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="2.4" {...p}><path d="m14 6-6 6 6 6" /></svg>;
export const IconRight  = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="2.4" {...p}><path d="m10 6 6 6-6 6" /></svg>;
export const IconClose  = (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...s} strokeWidth="2.1" {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconList   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>;
export const IconLock   = (p) => <svg width="14" height="14" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><rect x="4" y="10.5" width="16" height="10.5" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>;
export const IconGrid   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" /></svg>;
export const IconFilter = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M3 6h18M6.5 12h11M10 18h4" /></svg>;
export const IconShield = (p) => <svg width="21" height="21" viewBox="0 0 24 24" {...s} strokeWidth="1.7" {...p}><path d="M12 2.6 4.5 5.6v6c0 4.4 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.4 7.5-9.8v-6z" /><path d="m8.8 12 2.3 2.3 4.1-4.4" /></svg>;
export const IconTruck  = (p) => <svg width="21" height="21" viewBox="0 0 24 24" {...s} strokeWidth="1.7" {...p}><path d="M1.5 6.5h12v10h-12z" /><path d="M13.5 10h4l3 3.2v3.3h-7z" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></svg>;
export const IconTools  = (p) => <svg width="21" height="21" viewBox="0 0 24 24" {...s} strokeWidth="1.7" {...p}><path d="M14.5 6.2a3.8 3.8 0 0 0 5 5L15 16.7l-3.8-3.8z" /><path d="m10.5 13.5-6 6a1.8 1.8 0 0 0 2.5 2.5l6-6" /><path d="M4 3.5 8.5 8 7 9.5 2.5 5z" /></svg>;
export const IconTag    = (p) => <svg width="21" height="21" viewBox="0 0 24 24" {...s} strokeWidth="1.7" {...p}><path d="M11.5 2.5H21v9.5l-9.7 9.7-9.5-9.5z" /><circle cx="16.8" cy="7.2" r="1.5" /></svg>;
export const IconPin    = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.8" {...p}><path d="M12 21.5c4.2-4.8 6.5-8.2 6.5-11.3a6.5 6.5 0 1 0-13 0c0 3.1 2.3 6.5 6.5 11.3Z" /><circle cx="12" cy="10" r="2.3" /></svg>;
export const IconBox    = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.8" {...p}><path d="M12 2.8 21 7v10l-9 4.2L3 17V7z" /><path d="M3 7l9 4.2L21 7M12 11.2v10" /></svg>;
export const IconInfo   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.1" /></svg>;
export const IconCheck  = (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...s} strokeWidth="2.4" {...p}><path d="m4 12.5 5.2 5.2L20 7" /></svg>;
export const IconPlus   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="2.3" {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTrash  = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5 7.5 20h9l1-13.5M10 10v6M14 10v6" /></svg>;
export const IconEdit   = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" /><path d="M14.5 6.5 17.5 9.5" /></svg>;
export const IconPhone  = (p) => <svg width="16" height="16" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M6.6 3h3l1.5 4-2 1.4a12 12 0 0 0 5.5 5.5l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3Z" /></svg>;
export const IconLogout = (p) => <svg width="15" height="15" viewBox="0 0 24 24" {...s} strokeWidth="1.9" {...p}><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h11" /></svg>;

/** WhatsApp mark — a solid glyph, so it keeps its shape at any size. */
export const IconWhatsApp = ({ size = 17, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
  </svg>
);
