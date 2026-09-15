/**
 * Everything about the brand lives here.
 * Change these values and the whole site follows.
 *
 * Contact details are also editable from the admin panel (Settings) —
 * those override the values below at runtime. These are the fallbacks
 * used before the server responds.
 */
/**
 * The company name lives here and nowhere else. Admin -> Settings ->
 * Company name overrides it at runtime for the whole site, header, footer,
 * WhatsApp messages and page title included.
 */
const COMPANY = 'OBD LIGHTING LTD';

export const SITE = {
  name: COMPANY,
  legalName: COMPANY,
  legalNameBn: 'ওবিডি লাইটিং',
  tagline: 'Total Lighting Solutions',
  taglineBn: 'টোটাল লাইটিং সলিউশনস',

  phone: '01994999664',
  phoneDisplay: '01994 999664',
  whatsapp: '8801994999664',          // international format, no + and no spaces
  email: 'Osram.mri@gmail.com',

  address: 'House 404, Moni Mohol, Sayed Nogor, Vatara, Dhaka 1212',
  addressBn: 'বাসা ৪০৪, মনি মহল, সাঈদ নগর, ভাটারা, ঢাকা ১২১২',
  tradeLicence: 'TRAD/DNCC/013204/2026',
  hours: 'Saturday – Thursday, 9:00 am – 8:00 pm',
  hoursBn: 'শনি – বৃহস্পতি, সকাল ৯টা – রাত ৮টা',

  established: '2026',
  certifications: ['CE', 'UL', 'LM-80', 'RoHS'],
  warranty: '3 years (replacement)',
  warrantyBn: '৩ বছর (রিপ্লেসমেন্ট)',

  aboutText: 'Importer and supplier of LED lighting for homes, offices, factories and roads. Genuine product supply, wiring, installation and maintenance.',
  aboutTextBn: 'বাসা, অফিস, কারখানা আর রাস্তার জন্য LED লাইটের আমদানিকারক ও সরবরাহকারী। আসল পণ্য সরবরাহ, ওয়্যারিং, ইনস্টলেশন ও রক্ষণাবেক্ষণ।',
  footerNote: 'Genuine stock · warranty card with every invoice',
  footerNoteBn: 'আসল পণ্য · প্রতিটি ইনভয়েসে ওয়ারেন্টি কার্ড',
  facebook: '',
  youtube: '',
  heroProducts: [],
  loaded: false,

  logo: '/logo.webp',                 // put the real logo file in client/public/
};

/** Wattage bands used by the shop filter. */
export const WATT_BANDS = [
  { id: 'w1', name: 'Up to 20 W',  nameBn: '২০ ওয়াট পর্যন্ত' },
  { id: 'w2', name: '21 – 50 W',   nameBn: '২১ – ৫০ ওয়াট' },
  { id: 'w3', name: '51 – 100 W',  nameBn: '৫১ – ১০০ ওয়াট' },
  { id: 'w4', name: 'Above 100 W', nameBn: '১০০ ওয়াটের বেশি' },
];

/** Colour temperatures offered, used by the finder on the home page. */
export const CCT_STOPS = [
  { k: 2200, name: 'Amber / filament', nameBn: 'অ্যাম্বার / ফিলামেন্ট', hex: '#FF9A3C', use: 'Restaurants, lounges, feature lighting', useBn: 'রেস্টুরেন্ট, লাউঞ্জ, ফিচার লাইটিং' },
  { k: 2700, name: 'Warm white',       nameBn: 'ওয়ার্ম হোয়াইট',      hex: '#FFC183', use: 'Bedrooms, living rooms, hospitality',    useBn: 'শোবার ঘর, বসার ঘর, হোটেল' },
  { k: 3000, name: 'Soft white',       nameBn: 'সফট হোয়াইট',        hex: '#FFD5AC', use: 'Retail displays, reception areas',       useBn: 'দোকানের ডিসপ্লে, রিসেপশন' },
  { k: 4000, name: 'Neutral white',    nameBn: 'নিউট্রাল হোয়াইট',    hex: '#FFEDD6', use: 'Offices, classrooms, showrooms',         useBn: 'অফিস, ক্লাসরুম, শোরুম' },
  { k: 5700, name: 'Cool white',       nameBn: 'কুল হোয়াইট',        hex: '#F4F5FF', use: 'Warehouses, high bay, workshops',        useBn: 'গুদাম, হাই বে, ওয়ার্কশপ' },
  { k: 6500, name: 'Daylight',         nameBn: 'ডে-লাইট',           hex: '#DCE9FF', use: 'Factories, garages, task lighting',      useBn: 'কারখানা, গ্যারেজ, কাজের আলো' },
];
