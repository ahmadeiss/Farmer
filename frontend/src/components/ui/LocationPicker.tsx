"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { GOVERNORATES, findGovernorate, type Governorate } from "@/lib/palestine";

export interface LocationValue {
  governorate: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  label?: string;
  helpText?: string;
  addressRequired?: boolean;
  compact?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  label = "الموقع",
  helpText = "اختر المحافظة وحدّد موقعك على الخريطة لتصلك المنتجات الأقرب.",
  addressRequired = false,
  compact = false,
}: Props) {
  const [detecting, setDetecting] = useState(false);

  const detectMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        const gov = nearestGovernorate(lat, lng);
        onChange({
          ...value,
          latitude: lat,
          longitude: lng,
          governorate: value.governorate || (gov?.code ?? ""),
        });
        toast.success(`📍 تم تحديد موقعك${gov ? ` — ${gov.name_ar}` : ""}`);
        setDetecting(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "رفضت الإذن بالوصول للموقع. فعّله من إعدادات المتصفح."
            : "تعذّر تحديد الموقع تلقائياً، يمكنك اختيار المحافظة يدوياً.";
        toast.error(msg);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  };

  const chosen = findGovernorate(value.governorate);
  const hasCoords = value.latitude !== null && value.longitude !== null;

  return (
    <div className="space-y-3">
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

      <select
        className="field-input w-full"
        value={value.governorate}
        onChange={(e) => onChange({ ...value, governorate: e.target.value })}
      >
        <option value="">اختر المحافظة</option>
        {GOVERNORATES.map((g) => (
          <option key={g.code} value={g.code}>{g.name_ar}</option>
        ))}
      </select>

      <textarea
        className="field-input w-full"
        rows={compact ? 2 : 3}
        placeholder="العنوان التفصيلي (القرية، الحي، أقرب معلم...)"
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        required={addressRequired}
      />

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {chosen && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
            🗺️ {chosen.name_ar}
          </span>
        )}
        {hasCoords ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 font-semibold text-forest-700">
            ✓ الموقع محدّد بدقة
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
            ⚠️ لم يُحدّد الموقع بدقة — اضغط "اكتشف موقعي"
          </span>
        )}
      </div>
    </div>
  );
}

function nearestGovernorate(lat: number, lng: number): Governorate | undefined {
  let best: Governorate | undefined;
  let bestD = Infinity;
  for (const g of GOVERNORATES) {
    const dLat = g.latitude - lat;
    const dLng = g.longitude - lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return best;
}
