"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import TopHeader from "@/components/layout/TopHeader";
import { DriverBottomNav } from "@/components/layout/MobileBottomNav";
import EmptyState from "@/components/ui/EmptyState";
import PriceDisplay from "@/components/ui/PriceDisplay";
import StatusBadge from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { driverApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { formatDistanceKm, haversineKm } from "@/lib/palestine";
import type { DeliveryAssignment, DriverDashboardSummary, PaginatedResponse } from "@/types";

const FILTERS = [
  { label: "الكل", value: "", icon: "📋" },
  { label: "جديدة", value: "assigned", icon: "🆕" },
  { label: "قيد التوصيل", value: "picked_up", icon: "🚚" },
  { label: "مكتملة", value: "delivered", icon: "✅" },
];

const ASSIGNMENT_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  unassigned: { label: "غير مكلف", tone: "bg-stone-100 text-stone-700" },
  assigned: { label: "بانتظار الاستلام", tone: "bg-blue-100 text-blue-700" },
  picked_up: { label: "في الطريق للمشتري", tone: "bg-orange-100 text-orange-700" },
  delivered: { label: "تم التسليم", tone: "bg-forest-100 text-forest-700" },
  failed: { label: "فشل التسليم", tone: "bg-danger-100 text-danger-700" },
};

export default function DriverDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-warm" />}>
      <DriverDashboardContent />
    </Suspense>
  );
}

function DriverDashboardContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const { user } = useAuthStore();
  const firstName = user?.full_name?.split(" ")[0] ?? "السائق";
  const [appOrigin, setAppOrigin] = useState("");
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectingDriver, setDetectingDriver] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const detectDriverLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setDetectingDriver(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
        toast.success("📍 تم تفعيل موقعك — ستظهر المسافات لكل مهمة");
        setDetectingDriver(false);
      },
      () => {
        toast.error("تعذّر تحديد الموقع. تحقق من صلاحيات المتصفح.");
        setDetectingDriver(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  };

  const { data: summary, isLoading: isSummaryLoading } = useQuery<DriverDashboardSummary>({
    queryKey: ["driver-dashboard-summary"],
    queryFn: () => driverApi.getDashboardSummary().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: deliveries, isLoading: isDeliveriesLoading } = useQuery<PaginatedResponse<DeliveryAssignment>>({
    queryKey: ["driver-deliveries", status],
    queryFn: () => driverApi.getDeliveries(status ? { status } : {}).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => ([
    { label: "مهام نشطة", value: summary?.active_deliveries ?? 0, icon: "🚚", tone: "from-earth-500 to-orange-500" },
    { label: "بانتظار الاستلام", value: summary?.assigned ?? 0, icon: "📦", tone: "from-blue-500 to-blue-600" },
    { label: "قيد التوصيل", value: summary?.picked_up ?? 0, icon: "🛵", tone: "from-orange-500 to-amber-500" },
    { label: "تم تسليمها اليوم", value: summary?.delivered_today ?? 0, icon: "✅", tone: "from-forest-500 to-forest-600" },
  ]), [summary]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-5 space-y-5 pb-24 md:pb-8">
        <HeroCard
          firstName={firstName}
          stats={stats}
          loading={isSummaryLoading}
          driverCoords={driverCoords}
          detectingDriver={detectingDriver}
          onDetectLocation={detectDriverLocation}
        />

        <FilterTabs current={status} />

        {isDeliveriesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-52 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
          </div>
        ) : !deliveries?.results?.length ? (
          <EmptyState
            icon="🚚"
            title="لا توجد مهام توصيل حالياً"
            description="عندما يتم إسناد طلبات لك ستظهر هنا مع كل التفاصيل اللازمة."
          />
        ) : (
          <section className="space-y-4">
            {deliveries.results.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                appOrigin={appOrigin}
                driverCoords={driverCoords}
              />
            ))}
          </section>
        )}
      </main>

      <DriverBottomNav />
    </div>
  );
}

function HeroCard({
  firstName,
  stats,
  loading,
  driverCoords,
  detectingDriver,
  onDetectLocation,
}: {
  firstName: string;
  stats: { label: string; value: number; icon: string; tone: string }[];
  loading: boolean;
  driverCoords: { lat: number; lng: number } | null;
  detectingDriver: boolean;
  onDetectLocation: () => void;
}) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-earth-600 via-orange-600 to-stone-900 p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-orange-100">لوحة السائق</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">أهلاً، {firstName} 👋</h1>
          <p className="mt-2 text-xs text-orange-50 max-w-md leading-6">
            كل مهام التوصيل المخصصة لك — تواصل بضغطة، وافتح الخريطة مباشرة.
          </p>
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={detectingDriver}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5
                       text-xs font-semibold backdrop-blur hover:bg-white/25 disabled:opacity-60"
          >
            {detectingDriver
              ? "⏳ جاري تحديد موقعك..."
              : driverCoords
                ? "📍 موقعك مفعّل — اضغط للتحديث"
                : "📍 فعّل موقعي لحساب المسافات"}
          </button>
        </div>
        <span className="text-4xl md:text-5xl" aria-hidden>🚚</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl bg-gradient-to-br ${stat.tone} p-3 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg" aria-hidden>{stat.icon}</span>
              <span className="text-2xl font-black tabular-nums">
                {loading ? "—" : stat.value}
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-white/90">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FilterTabs({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="تصفية المهام">
      {FILTERS.map((filter) => {
        const isActive = current === filter.value;
        const href = filter.value ? `/driver/dashboard?status=${filter.value}` : "/driver/dashboard";
        return (
          <a
            key={filter.value || "all"}
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-earth-600 text-white shadow-sm"
                : "border border-surface-border bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span aria-hidden>{filter.icon}</span>
            <span>{filter.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function DeliveryCard({
  delivery,
  appOrigin,
  driverCoords,
}: {
  delivery: DeliveryAssignment;
  appOrigin: string;
  driverCoords: { lat: number; lng: number } | null;
}) {
  const qc = useQueryClient();
  const assignmentStatus = ASSIGNMENT_STATUS_LABELS[delivery.status] ?? ASSIGNMENT_STATUS_LABELS.unassigned;

  const { mutate: markPickup, isPending: isPickingUp } = useMutation({
    mutationFn: () => driverApi.markPickup(delivery.id),
    onSuccess: () => {
      toast.success("تم تأكيد استلام الطلب من المزرعة ✅");
      qc.invalidateQueries({ queryKey: ["driver-deliveries"] });
      qc.invalidateQueries({ queryKey: ["driver-dashboard-summary"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "تعذّر تأكيد الاستلام.");
    },
  });

  const farmerAddress = delivery.farmer_location?.address || "";
  const farmName = delivery.farmer_location?.farm_name || "";
  const farmerLat = parseCoord(delivery.farmer_location?.latitude);
  const farmerLng = parseCoord(delivery.farmer_location?.longitude);

  const buyerAddress = delivery.buyer_location?.address || delivery.order.delivery_address || "";
  const buyerLat = parseCoord(delivery.buyer_location?.latitude);
  const buyerLng = parseCoord(delivery.buyer_location?.longitude);

  const canPickup = delivery.status === "assigned" && delivery.order.status === "ready_for_pickup";
  const isDone = delivery.status === "delivered";
  const isFailed = delivery.status === "failed";
  const showQr = !isDone && !isFailed && !!delivery.order.qr_token;
  const qrActive = delivery.status === "picked_up";

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-border bg-stone-50 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">طلب #{delivery.order.id}</h2>
            <StatusBadge status={delivery.order.status} size="sm" />
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${assignmentStatus.tone}`}>
              {assignmentStatus.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {formatDateTime(delivery.created_at)}
          </p>
        </div>
        <PriceDisplay amount={delivery.order.total} size="md" />
      </header>

      <div className="grid gap-3 p-4 md:grid-cols-2">
        <ContactBlock
          tone="earth"
          label="نقطة الاستلام (المزارع)"
          icon="🌾"
          name={delivery.order.farmer_name}
          subtitle={farmName || undefined}
          phone={delivery.farmer_phone || undefined}
          address={farmerAddress}
          latitude={farmerLat}
          longitude={farmerLng}
          driverCoords={driverCoords}
        />
        <ContactBlock
          tone="forest"
          label="نقطة التسليم (المشتري)"
          icon="📍"
          name={delivery.order.buyer_name}
          phone={delivery.buyer_phone || undefined}
          address={buyerAddress}
          latitude={buyerLat}
          longitude={buyerLng}
          driverCoords={driverCoords}
        />
      </div>

      <section className="border-t border-surface-border px-4 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">
          محتويات الطلب • {delivery.order.items.length} صنف
        </p>
        <ul className="space-y-1.5">
          {delivery.order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-stone-700">
                {item.title_snapshot}
                <span className="text-stone-400"> × {item.quantity} {item.unit}</span>
              </span>
              <span className="shrink-0 font-semibold text-stone-800 tabular-nums">
                {formatCurrency(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {(delivery.order.notes || delivery.notes) && (
        <section className="border-t border-surface-border bg-amber-50/40 px-4 py-3">
          <p className="text-[11px] font-bold text-amber-700">📝 ملاحظات</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">
            {delivery.order.notes || delivery.notes}
          </p>
        </section>
      )}

      {showQr && (
        <section
          className={`border-t-2 border-dashed px-4 py-5 ${
            qrActive
              ? "border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50"
              : "border-stone-300 bg-stone-50/60"
          }`}
        >
          <div className="mb-3 text-center">
            <p className={`text-sm font-black ${qrActive ? "text-orange-800" : "text-stone-700"}`}>
              {qrActive
                ? "📱 اعرض هذا الرمز للمشتري ليمسحه ويؤكد الاستلام"
                : "📱 رمز تأكيد التسليم — جاهز معك لتسليم الطلب"}
            </p>
            <p className={`mt-1 text-[11px] leading-5 ${qrActive ? "text-orange-700" : "text-stone-500"}`}>
              {qrActive
                ? "فور مسح المشتري للرمز سيتم تحديث حالة الطلب تلقائياً إلى \"تم التسليم\"."
                : "الرمز يعمل فقط عند تسجيل دخول المشتري بحسابه، لذا يمكنك الاحتفاظ به الآن واستعراضه وقت التسليم."}
            </p>
          </div>
          <div
            className={`grid gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center ${
              qrActive ? "border-orange-200" : "border-stone-200"
            }`}
          >
            <div className="flex flex-col items-center">
              {appOrigin ? (
                <QRCodeSVG
                  value={`${appOrigin}/orders/confirm/${delivery.order.qr_token}`}
                  size={160}
                  level="M"
                  includeMargin={false}
                  className="rounded"
                />
              ) : (
                <Skeleton className="h-40 w-40 rounded" />
              )}
              <p className="mt-2 text-[10px] text-stone-400">رمز احتياطي</p>
              <p
                className={`font-mono text-sm font-bold tracking-[0.2em] ${
                  qrActive ? "text-orange-700" : "text-stone-700"
                }`}
              >
                {delivery.order.qr_token.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="space-y-2 text-center md:text-right">
              <div className="rounded-lg bg-stone-50 p-3">
                <p className="text-[10px] text-stone-400">المشتري</p>
                <p className="text-base font-bold text-stone-900">{delivery.order.buyer_name}</p>
                <p className="mt-1 text-xs text-stone-500">طلب #{delivery.order.id}</p>
              </div>
              <p className="text-xs leading-6 text-stone-600">
                وجّه كاميرا هاتف المشتري نحو الرمز — لن يُقبل التأكيد إلا إذا كان المشتري مسجّلاً بحسابه، فالرمز آمن معك.
              </p>
              {!qrActive && canPickup && (
                <p className="text-[11px] font-semibold text-forest-700">
                  💡 اضغط «استلمت الطلب من المزرعة» لتحديث حالة الطلب قبل التوجّه للمشتري.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-surface-border bg-stone-50/70 px-4 py-3">
        {canPickup && (
          <Button
            size="sm"
            variant="primary"
            loading={isPickingUp}
            onClick={() => markPickup()}
          >
            ✅ استلمت الطلب من المزرعة
          </Button>
        )}
        {isDone && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-700">
            🎉 تم تسليم الطلب بنجاح
          </span>
        )}
      </footer>
    </article>
  );
}

function parseCoord(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ContactBlock({
  tone,
  label,
  icon,
  name,
  subtitle,
  phone,
  address,
  latitude,
  longitude,
  driverCoords,
}: {
  tone: "earth" | "forest";
  label: string;
  icon: string;
  name: string;
  subtitle?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  driverCoords?: { lat: number; lng: number } | null;
}) {
  const toneClasses =
    tone === "earth"
      ? "bg-earth-50/60 border-earth-100"
      : "bg-forest-50/60 border-forest-100";

  const hasCoords = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      : null;

  const distanceKm =
    driverCoords && hasCoords
      ? haversineKm(driverCoords, { lat: latitude!, lng: longitude! })
      : null;

  return (
    <div className={`rounded-xl border p-3 ${toneClasses}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600">
        <span aria-hidden>{icon}</span>
        {label}
        {distanceKm !== null && (
          <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow-sm">
            🧭 {formatDistanceKm(distanceKm)}
          </span>
        )}
      </p>
      <p className="mt-1.5 text-sm font-bold text-stone-900">{name}</p>
      {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      {address && (
        <p className="mt-1 text-xs leading-5 text-stone-600">📍 {address}</p>
      )}
      {hasCoords && (
        <p className="mt-0.5 text-[10px] font-mono text-stone-400">
          {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            📞 اتصال
          </a>
        )}
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-forest-200 bg-forest-50 px-2.5 py-1.5 text-xs font-semibold text-forest-700 hover:bg-forest-100"
          >
            💬 واتساب
          </a>
        )}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            🗺️ فتح الخريطة{hasCoords ? " (بدقة)" : ""}
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-earth-200 bg-earth-50 px-2.5 py-1.5 text-xs font-semibold text-earth-700 hover:bg-earth-100"
          >
            🧭 الملاحة
          </a>
        )}
      </div>
    </div>
  );
}

