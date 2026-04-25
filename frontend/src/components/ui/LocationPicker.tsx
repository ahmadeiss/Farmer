"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  GOVERNORATES,
  TOWNS_BY_GOVERNORATE,
  findGovernorate,
  nominatimToGovCode,
  type Governorate,
} from "@/lib/palestine";

export interface LocationValue {
  governorate: string;
  /** Selected town/village name (Arabic) */
  town?: string;
  /** Auto-composed from governorate + town; sent to backend as delivery address */
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  label?: string;
  helpText?: string;
  /** @deprecated address is now auto-composed; kept for API compatibility */
  addressRequired?: boolean;
  compact?: boolean;
}

/** Build a human-readable address string from governorate code + town name. */
function composeAddress(govCode: string, town: string): string {
  const govName = GOVERNORATES.find((g) => g.code === govCode)?.name_ar ?? govCode;
  return town ? `${town}، ${govName}` : govName;
}

/** Fallback: nearest governorate by Euclidean distance on (lat, lng). */
function nearestGovernorate(lat: number, lng: number): Governorate | undefined {
  let best: Governorate | undefined;
  let bestD = Infinity;
  for (const g of GOVERNORATES) {
    const d = (g.latitude - lat) ** 2 + (g.longitude - lng) ** 2;
    if (d < bestD) { bestD = d; best = g; }
  }
  return best;
}

export default function LocationPicker({
  value,
  onChange,
  label = "الموقع",
  helpText = "اختر المحافظة ثم القرية/المدينة، أو اضغط 'اكتشف موقعي' تلقائياً.",
}: Props) {
  const [detecting, setDetecting] = useState(false);

  const towns = value.governorate ? (TOWNS_BY_GOVERNORATE[value.governorate] ?? []) : [];
  const chosen = findGovernorate(value.governorate);
  const hasCoords = value.latitude !== null && value.longitude !== null;

  const handleGovernorateChange = (govCode: string) => {
    onChange({ ...value, governorate: govCode, town: "", address: composeAddress(govCode, "") });
  };

  const handleTownChange = (town: string) => {
    onChange({ ...value, town, address: composeAddress(value.governorate, town) });
  };

  const detectMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        try {
          // Use Nominatim for accurate reverse geocoding
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
            { headers: { "User-Agent": "FarmerMarketplace/1.0" } }
          );
          const data = await resp.json();
          const addr = data?.address ?? {};

          // Determine governorate from county / state_district / state
          const countyStr = addr.county || addr.state_district || addr.state || "";
          const govCode = nominatimToGovCode(countyStr) ?? nearestGovernorate(lat, lng)?.code ?? value.governorate;

          // Determine town from Nominatim locality fields
          const nominatimTown: string = addr.village || addr.town || addr.suburb || addr.city_district || addr.city || "";

          // Try to match against our towns list (Arabic name match)
          const govTowns = TOWNS_BY_GOVERNORATE[govCode] ?? [];
          const matched = govTowns.find(
            (t) =>
              t.name_ar === nominatimTown ||
              t.name_en.toLowerCase() === nominatimTown.toLowerCase()
          );
          const townName = matched?.name_ar || nominatimTown || "";

          const newAddr = composeAddress(govCode, townName);
          onChange({ ...value, latitude: lat, longitude: lng, governorate: govCode, town: townName, address: newAddr });

          const govName = GOVERNORATES.find((g) => g.code === govCode)?.name_ar ?? govCode;
          toast.success(`📍 تم تحديد موقعك — ${townName || govName}`);
        } catch {
          // Fallback to nearest centroid
          const gov = nearestGovernorate(lat, lng);
          onChange({ ...value, latitude: lat, longitude: lng, governorate: gov?.code ?? value.governorate });
          toast.success(`📍 تم تحديد موقعك${gov ? ` — ${gov.name_ar}` : ""}`);
        }
        setDetecting(false);
      },
      (err) => {
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "رفضت الإذن بالوصول للموقع. فعّله من إعدادات المتصفح."
            : "تعذّر تحديد الموقع تلقائياً، يمكنك اختيار المحافظة يدوياً."
        );
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-bold text-stone-800">{label}</label>
        <button
          type="button"
          onClick={detectMyLocation}
          disabled={detecting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-forest-200 bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 hover:bg-forest-100 disabled:opacity-60"
        >
          <span aria-hidden>{detecting ? "⏳" : "📍"}</span>
          {detecting ? "جاري التحديد..." : hasCoords ? "تحديث موقعي" : "اكتشف موقعي تلقائياً"}
        </button>
      </div>

      {helpText && <p className="text-xs leading-6 text-stone-500">{helpText}</p>}

      {/* Governorate dropdown */}
      <select
        className="field-input w-full"
        value={value.governorate}
        onChange={(e) => handleGovernorateChange(e.target.value)}
      >
        <option value="">اختر المحافظة</option>
        {GOVERNORATES.map((g) => (
          <option key={g.code} value={g.code}>{g.name_ar}</option>
        ))}
      </select>

      {/* Town dropdown — shown once a governorate is chosen */}
      {value.governorate && towns.length > 0 && (
        <select
          className="field-input w-full"
          value={value.town ?? ""}
          onChange={(e) => handleTownChange(e.target.value)}
        >
          <option value="">اختر القرية / المدينة</option>
          {towns.map((t) => (
            <option key={t.name_ar} value={t.name_ar}>{t.name_ar}</option>
          ))}
        </select>
      )}

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {chosen && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
            🗺️ {chosen.name_ar}{value.town ? ` · ${value.town}` : ""}
          </span>
        )}
        {hasCoords ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 font-semibold text-forest-700">
            ✓ الموقع محدّد بدقة
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
            ⚠️ اضغط "اكتشف موقعي" لتحديد موقعك بدقة
          </span>
        )}
      </div>
    </div>
  );
}
