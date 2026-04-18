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
