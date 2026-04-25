/**
 * Palestinian governorates registry. Mirror of backend/apps/common/palestine.py.
 * Used for location-based filtering, nearest-farmer sorting, and pickers.
 */

export type GovernorateRegion = "west_bank" | "gaza";

export interface Governorate {
  code: string;
  name_ar: string;
  name_en: string;
  latitude: number;
  longitude: number;
  region: GovernorateRegion;
}

export const GOVERNORATES: Governorate[] = [
  // West Bank
  { code: "jenin",      name_ar: "جنين",              name_en: "Jenin",       latitude: 32.4597, longitude: 35.2966, region: "west_bank" },
  { code: "tubas",      name_ar: "طوباس",             name_en: "Tubas",       latitude: 32.3214, longitude: 35.3691, region: "west_bank" },
  { code: "tulkarm",    name_ar: "طولكرم",            name_en: "Tulkarm",     latitude: 32.3104, longitude: 35.0286, region: "west_bank" },
  { code: "nablus",     name_ar: "نابلس",             name_en: "Nablus",      latitude: 32.2211, longitude: 35.2544, region: "west_bank" },
  { code: "qalqilya",   name_ar: "قلقيلية",           name_en: "Qalqilya",    latitude: 32.1904, longitude: 34.9706, region: "west_bank" },
  { code: "salfit",     name_ar: "سلفيت",             name_en: "Salfit",      latitude: 32.0855, longitude: 35.1807, region: "west_bank" },
  { code: "ramallah",   name_ar: "رام الله والبيرة",  name_en: "Ramallah",    latitude: 31.9038, longitude: 35.2034, region: "west_bank" },
  { code: "jericho",    name_ar: "أريحا والأغوار",    name_en: "Jericho",     latitude: 31.8667, longitude: 35.4500, region: "west_bank" },
  { code: "jerusalem",  name_ar: "القدس",             name_en: "Jerusalem",   latitude: 31.7683, longitude: 35.2137, region: "west_bank" },
  { code: "bethlehem",  name_ar: "بيت لحم",           name_en: "Bethlehem",   latitude: 31.7054, longitude: 35.2024, region: "west_bank" },
  { code: "hebron",     name_ar: "الخليل",            name_en: "Hebron",      latitude: 31.5326, longitude: 35.0998, region: "west_bank" },
  // Gaza
  { code: "north_gaza", name_ar: "شمال غزة",          name_en: "North Gaza",  latitude: 31.5500, longitude: 34.5000, region: "gaza" },
  { code: "gaza",       name_ar: "غزة",               name_en: "Gaza",        latitude: 31.5017, longitude: 34.4668, region: "gaza" },
  { code: "deir_balah", name_ar: "دير البلح",         name_en: "Deir al-Balah", latitude: 31.4181, longitude: 34.3510, region: "gaza" },
  { code: "khan_yunis", name_ar: "خان يونس",          name_en: "Khan Yunis",  latitude: 31.3462, longitude: 34.3027, region: "gaza" },
  { code: "rafah",      name_ar: "رفح",               name_en: "Rafah",       latitude: 31.2968, longitude: 34.2459, region: "gaza" },
];

export const GOVERNORATE_BY_CODE: Record<string, Governorate> = GOVERNORATES.reduce(
  (acc, g) => { acc[g.code] = g; return acc; },
  {} as Record<string, Governorate>
);

export function findGovernorate(codeOrName: string | null | undefined): Governorate | undefined {
  if (!codeOrName) return undefined;
  const direct = GOVERNORATE_BY_CODE[codeOrName];
  if (direct) return direct;
  return GOVERNORATES.find(
    (g) => g.name_ar === codeOrName || g.name_en.toLowerCase() === codeOrName.toLowerCase()
  );
}

/** Haversine distance in kilometers between two (lat, lng) points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} م`;
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km)} كم`;
}

// ─── Towns / Villages ────────────────────────────────────────────────────────

export interface Town {
  name_ar: string;
  name_en: string;
}

export const TOWNS_BY_GOVERNORATE: Record<string, Town[]> = {
  ramallah: [
    { name_ar: "رام الله", name_en: "Ramallah" },
    { name_ar: "البيرة", name_en: "Al-Bireh" },
    { name_ar: "بيتونيا", name_en: "Beitunia" },
    { name_ar: "كفر عين", name_en: "Kafr Ein" },
    { name_ar: "كفر مالك", name_en: "Kafr Malik" },
    { name_ar: "كفر نعمة", name_en: "Kafr Ni'ma" },
    { name_ar: "كوبر", name_en: "Kobar" },
    { name_ar: "سلواد", name_en: "Silwad" },
    { name_ar: "سنجل", name_en: "Sinjil" },
    { name_ar: "عين يبرود", name_en: "Ein Yabrud" },
    { name_ar: "عين سينيا", name_en: "Ein Sinya" },
    { name_ar: "يبرود", name_en: "Yabroud" },
    { name_ar: "جفنا", name_en: "Jifna" },
    { name_ar: "جبع", name_en: "Jaba" },
    { name_ar: "دير أبو مشعل", name_en: "Deir Abu Mash'al" },
    { name_ar: "دير السودان", name_en: "Deir as-Sudan" },
    { name_ar: "دير غسانة", name_en: "Deir Ghassana" },
    { name_ar: "دير قديس", name_en: "Deir Qaddis" },
    { name_ar: "أبو قش", name_en: "Abu Qash" },
    { name_ar: "أم صفا", name_en: "Um Safa" },
    { name_ar: "بيت أور الفوقا", name_en: "Beit Ur al-Fawqa" },
    { name_ar: "بيت أور التحتا", name_en: "Beit Ur al-Tahta" },
    { name_ar: "بيت دقو", name_en: "Beit Daqqu" },
    { name_ar: "بيت ريما", name_en: "Beit Rima" },
    { name_ar: "بيت رنتيس", name_en: "Beit Runtis" },
    { name_ar: "بيت سيرا", name_en: "Beit Sira" },
    { name_ar: "بيت لقيا", name_en: "Beit Liqya" },
    { name_ar: "بيت نوبا", name_en: "Beit Nuba" },
    { name_ar: "بيتين", name_en: "Beitin" },
    { name_ar: "تفوح", name_en: "Taffuh" },
    { name_ar: "شقبا", name_en: "Shaqba" },
    { name_ar: "عبود", name_en: "Aboud" },
    { name_ar: "عطارة", name_en: "Attara" },
    { name_ar: "لبن الشرقية", name_en: "Luban ash-Sharqiyya" },
    { name_ar: "مزرعة القبلية", name_en: "Mazra'a al-Qibliyya" },
    { name_ar: "المزرعة الشرقية", name_en: "Al-Mazra'a ash-Sharqiyya" },
    { name_ar: "النبي صالح", name_en: "Nabi Salih" },
    { name_ar: "نعلين", name_en: "Na'alin" },
    { name_ar: "نيلين", name_en: "Ni'lin" },
    { name_ar: "رأس كركر", name_en: "Ras Karkar" },
    { name_ar: "رأس عطية", name_en: "Ras Atiyya" },
    { name_ar: "قبية", name_en: "Qibya" },
  ],
  jenin: [
    { name_ar: "جنين", name_en: "Jenin" },
    { name_ar: "يعبد", name_en: "Ya'bad" },
    { name_ar: "قباطية", name_en: "Qabatiya" },
    { name_ar: "عرابة", name_en: "Arrabeh" },
    { name_ar: "برقين", name_en: "Burqin" },
    { name_ar: "الزبابدة", name_en: "Zababdeh" },
    { name_ar: "مخيم جنين", name_en: "Jenin Camp" },
    { name_ar: "كفر راعي", name_en: "Kafr Ra'i" },
    { name_ar: "طمون", name_en: "Tamun" },
    { name_ar: "فارعة", name_en: "Fari'a" },
    { name_ar: "عنين", name_en: "Anin" },
    { name_ar: "كفر دان", name_en: "Kafr Dan" },
    { name_ar: "المقيبلة", name_en: "Al-Muqeibila" },
    { name_ar: "صانور", name_en: "Sanur" },
    { name_ar: "ميثلون", name_en: "Meithalun" },
    { name_ar: "سيلة الحارثية", name_en: "Silet al-Harithiyya" },
  ],
  nablus: [
    { name_ar: "نابلس", name_en: "Nablus" },
    { name_ar: "بيتا", name_en: "Beita" },
    { name_ar: "حوارة", name_en: "Huwwara" },
    { name_ar: "سبسطية", name_en: "Sebastia" },
    { name_ar: "عصيرة الشمالية", name_en: "Asira ash-Shamaliyya" },
    { name_ar: "عقرابا", name_en: "Aqraba" },
    { name_ar: "كفر قليل", name_en: "Kafr Qallil" },
    { name_ar: "قريوت", name_en: "Qaryut" },
    { name_ar: "يانون", name_en: "Yanun" },
    { name_ar: "عورتا", name_en: "Awarta" },
    { name_ar: "بيت إيبا", name_en: "Beit Iba" },
    { name_ar: "روجيب", name_en: "Rujeib" },
    { name_ar: "تل", name_en: "Tell" },
    { name_ar: "دير شرف", name_en: "Deir Sharaf" },
  ],
  tulkarm: [
    { name_ar: "طولكرم", name_en: "Tulkarm" },
    { name_ar: "عنبتا", name_en: "Anabta" },
    { name_ar: "باقة الشرقية", name_en: "Baqah ash-Sharqiyya" },
    { name_ar: "كفر اللبد", name_en: "Kafr al-Labad" },
    { name_ar: "إلار", name_en: "Illar" },
    { name_ar: "شوفة", name_en: "Shufa" },
    { name_ar: "مخيم طولكرم", name_en: "Tulkarm Camp" },
    { name_ar: "سفارين", name_en: "Safareen" },
    { name_ar: "كفر زيباد", name_en: "Kafr Zibad" },
    { name_ar: "ذنابة", name_en: "Dhinnaba" },
  ],
  tubas: [
    { name_ar: "طوباس", name_en: "Tubas" },
    { name_ar: "طمون", name_en: "Tamun" },
    { name_ar: "عقابا", name_en: "Aqaba" },
    { name_ar: "تياسير", name_en: "Tayasir" },
    { name_ar: "عين البيضاء", name_en: "Ein al-Baida" },
    { name_ar: "بردلة", name_en: "Bardala" },
  ],
  qalqilya: [
    { name_ar: "قلقيلية", name_en: "Qalqilya" },
    { name_ar: "حبلة", name_en: "Habla" },
    { name_ar: "عزون", name_en: "Azzun" },
    { name_ar: "كفر ثلث", name_en: "Kafr Thulth" },
    { name_ar: "جيوس", name_en: "Jayyus" },
    { name_ar: "فلامية", name_en: "Falamya" },
    { name_ar: "جينصافوط", name_en: "Jinsafut" },
    { name_ar: "إماتين", name_en: "Imatin" },
  ],
  salfit: [
    { name_ar: "سلفيت", name_en: "Salfit" },
    { name_ar: "كفل حارس", name_en: "Kafil Haris" },
    { name_ar: "مردا", name_en: "Marda" },
    { name_ar: "برودة", name_en: "Buruda" },
    { name_ar: "فرخة", name_en: "Farkhah" },
    { name_ar: "ديراستيا", name_en: "Derastya" },
    { name_ar: "كانا", name_en: "Kana" },
    { name_ar: "رافات", name_en: "Rafat" },
    { name_ar: "حارس", name_en: "Haris" },
    { name_ar: "كفر الديك", name_en: "Kafr ad-Dik" },
  ],
  jericho: [
    { name_ar: "أريحا", name_en: "Jericho" },
    { name_ar: "العوجا", name_en: "Al-Auja" },
    { name_ar: "النويعمة", name_en: "An-Nuwei'ma" },
    { name_ar: "مخيم عقبة جبر", name_en: "Aqabat Jabr Camp" },
    { name_ar: "مخيم عين السلطان", name_en: "Ein as-Sultan Camp" },
    { name_ar: "فصايل", name_en: "Fasayil" },
    { name_ar: "المرج", name_en: "Al-Marj" },
  ],
  jerusalem: [
    { name_ar: "القدس", name_en: "Jerusalem" },
    { name_ar: "أبو ديس", name_en: "Abu Dis" },
    { name_ar: "العيزرية", name_en: "Al-Eizariya" },
    { name_ar: "بيت حنينا", name_en: "Beit Hanina" },
    { name_ar: "شعفاط", name_en: "Shu'fat" },
    { name_ar: "كفر عقب", name_en: "Kafr Aqab" },
    { name_ar: "الرام", name_en: "Ar-Ram" },
    { name_ar: "قلنديا", name_en: "Qalandia" },
    { name_ar: "حزما", name_en: "Hizma" },
    { name_ar: "عناتا", name_en: "Anata" },
    { name_ar: "بيت إكسا", name_en: "Beit Iksa" },
    { name_ar: "بدو", name_en: "Bidu" },
    { name_ar: "قطنة", name_en: "Qatanna" },
    { name_ar: "النبي سموئيل", name_en: "Nabi Samwil" },
    { name_ar: "جبل المكبر", name_en: "Jabal al-Mukabbir" },
    { name_ar: "الطور", name_en: "at-Tur" },
    { name_ar: "واد الجوز", name_en: "Wadi al-Joz" },
    { name_ar: "العيسوية", name_en: "Al-Isawiyya" },
  ],
  bethlehem: [
    { name_ar: "بيت لحم", name_en: "Bethlehem" },
    { name_ar: "بيت جالا", name_en: "Beit Jala" },
    { name_ar: "بيت ساحور", name_en: "Beit Sahour" },
    { name_ar: "الدوحة", name_en: "Ad-Doha" },
    { name_ar: "بيت فجار", name_en: "Beit Fajjar" },
    { name_ar: "الخضر", name_en: "Al-Khader" },
    { name_ar: "تقوع", name_en: "Tuqu'" },
    { name_ar: "عبيدية", name_en: "Ubaidiya" },
    { name_ar: "أرطاس", name_en: "Artas" },
    { name_ar: "نحالين", name_en: "Nahalin" },
    { name_ar: "وادي فوكين", name_en: "Wadi Fukin" },
    { name_ar: "مخيم عايدة", name_en: "Aida Camp" },
    { name_ar: "مخيم الدهيشة", name_en: "Dheisheh Camp" },
    { name_ar: "بيت أمر", name_en: "Beit Ummar" },
    { name_ar: "حلحول", name_en: "Halhul" },
  ],
  hebron: [
    { name_ar: "الخليل", name_en: "Hebron" },
    { name_ar: "دورا", name_en: "Dura" },
    { name_ar: "يطا", name_en: "Yatta" },
    { name_ar: "ظاهرية", name_en: "Adh-Dhahiriya" },
    { name_ar: "سعير", name_en: "Sa'ir" },
    { name_ar: "حلحول", name_en: "Halhul" },
    { name_ar: "تفوح", name_en: "Taffuh" },
    { name_ar: "إذنا", name_en: "Idhna" },
    { name_ar: "ترقوميا", name_en: "Tarqumia" },
    { name_ar: "بيت أمر", name_en: "Beit Ummar" },
    { name_ar: "الشيوخ", name_en: "Ash-Shuyukh" },
    { name_ar: "بني نعيم", name_en: "Bani Na'im" },
    { name_ar: "دير سامت", name_en: "Deir Samit" },
    { name_ar: "مخيم الفوار", name_en: "Al-Fawar Camp" },
    { name_ar: "مخيم العروب", name_en: "Al-Arroub Camp" },
    { name_ar: "الفوار", name_en: "Al-Fawar" },
  ],
  north_gaza: [
    { name_ar: "جباليا", name_en: "Jabaliya" },
    { name_ar: "بيت لاهيا", name_en: "Beit Lahiya" },
    { name_ar: "بيت حانون", name_en: "Beit Hanoun" },
  ],
  gaza: [
    { name_ar: "غزة", name_en: "Gaza" },
    { name_ar: "الشجاعية", name_en: "Ash-Shuja'iyya" },
    { name_ar: "التفاح", name_en: "At-Tuffah" },
    { name_ar: "الرمال", name_en: "Ar-Rimal" },
    { name_ar: "النصيرات", name_en: "An-Nuseirat" },
    { name_ar: "البريج", name_en: "Al-Bureij" },
  ],
  deir_balah: [
    { name_ar: "دير البلح", name_en: "Deir al-Balah" },
    { name_ar: "مغازي", name_en: "Maghazi" },
    { name_ar: "النصيرات", name_en: "An-Nuseirat" },
  ],
  khan_yunis: [
    { name_ar: "خان يونس", name_en: "Khan Yunis" },
    { name_ar: "عبسان الكبيرة", name_en: "Abasan al-Kabira" },
    { name_ar: "بني سهيلة", name_en: "Bani Suhayla" },
    { name_ar: "خزاعة", name_en: "Khuzaa" },
  ],
  rafah: [
    { name_ar: "رفح", name_en: "Rafah" },
    { name_ar: "تل السلطان", name_en: "Tel as-Sultan" },
    { name_ar: "مخيم رفح", name_en: "Rafah Camp" },
  ],
};

// ─── Nominatim Reverse Geocoding ─────────────────────────────────────────────

/** Maps Nominatim county/state strings (EN or AR) → our governorate codes. */
const NOMINATIM_GOV_MAP: Record<string, string> = {
  "ramallah": "ramallah",
  "ramallah and al-bireh": "ramallah",
  "ramallah and al-bireh governorate": "ramallah",
  "محافظة رام الله": "ramallah",
  "محافظة رام الله والبيرة": "ramallah",
  "رام الله والبيرة": "ramallah",
  "jenin": "jenin",
  "jenin governorate": "jenin",
  "محافظة جنين": "jenin",
  "نابلس": "nablus",
  "nablus": "nablus",
  "nablus governorate": "nablus",
  "محافظة نابلس": "nablus",
  "tulkarm": "tulkarm",
  "tulkarm governorate": "tulkarm",
  "محافظة طولكرم": "tulkarm",
  "tubas": "tubas",
  "tubas governorate": "tubas",
  "محافظة طوباس": "tubas",
  "qalqilya": "qalqilya",
  "qalqilya governorate": "qalqilya",
  "محافظة قلقيلية": "qalqilya",
  "salfit": "salfit",
  "salfit governorate": "salfit",
  "محافظة سلفيت": "salfit",
  "jericho": "jericho",
  "jericho and al-aghwar governorate": "jericho",
  "محافظة أريحا": "jericho",
  "jerusalem": "jerusalem",
  "jerusalem governorate": "jerusalem",
  "محافظة القدس": "jerusalem",
  "bethlehem": "bethlehem",
  "bethlehem governorate": "bethlehem",
  "محافظة بيت لحم": "bethlehem",
  "hebron": "hebron",
  "hebron governorate": "hebron",
  "محافظة الخليل": "hebron",
  "north gaza": "north_gaza",
  "north gaza governorate": "north_gaza",
  "محافظة شمال غزة": "north_gaza",
  "gaza": "gaza",
  "gaza governorate": "gaza",
  "محافظة غزة": "gaza",
  "deir al-balah": "deir_balah",
  "deir el-balah governorate": "deir_balah",
  "محافظة دير البلح": "deir_balah",
  "khan yunis": "khan_yunis",
  "khan yunis governorate": "khan_yunis",
  "محافظة خان يونس": "khan_yunis",
  "rafah": "rafah",
  "rafah governorate": "rafah",
  "محافظة رفح": "rafah",
};

/**
 * Converts a Nominatim county/state string to one of our governorate codes.
 * Returns undefined if no match is found.
 */
export function nominatimToGovCode(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  // exact match
  const exact = NOMINATIM_GOV_MAP[key];
  if (exact) return exact;
  // partial match — e.g. "Ramallah and Al-Bireh Governorate (West Bank)"
  for (const [mapKey, code] of Object.entries(NOMINATIM_GOV_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return code;
  }
  return undefined;
}
