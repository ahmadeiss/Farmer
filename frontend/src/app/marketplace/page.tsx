"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { buyerApi, catalogApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/buyer/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/ui/SearchBar";
import { GOVERNORATES, GOVERNORATE_BY_CODE } from "@/lib/palestine";
import type { BuyerProfile, PaginatedResponse, ProductList, Category } from "@/types";

const SORT_OPTIONS = [
  { value: "-created_at", label: "الأحدث" },
  { value: "distance",    label: "الأقرب إليّ" },
  { value: "price",       label: "الأقل سعراً" },
  { value: "-price",      label: "الأعلى سعراً" },
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [search, setSearch]               = useState("");
  const [selectedCategory, setCategory]   = useState("");
  const [selectedGov, setSelectedGov]     = useState("");
  const [sortBy, setSortBy]               = useState("-created_at");
  const [page, setPage]                   = useState(1);
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting]         = useState(false);

  const selectCategory = useCallback((slug: string) => {
    setCategory(slug);
    setPage(1);
  }, []);

  const selectGov = useCallback((code: string) => {
    setSelectedGov(code);
    setPage(1);
  }, []);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => catalogApi.getCategories().then((r) => r.data),
  });

  // Pull coords from buyer profile (if logged in as buyer)
  const { data: buyerProfile } = useQuery<BuyerProfile>({
    queryKey: ["buyer-profile"],
    queryFn: () => buyerApi.getProfile().then((r) => r.data),
    enabled: user?.role === "buyer",
  });

  useEffect(() => {
    if (coords) return;
    if (buyerProfile?.latitude && buyerProfile?.longitude) {
      setCoords({ lat: +buyerProfile.latitude, lng: +buyerProfile.longitude });
    }
  }, [buyerProfile, coords]);

  const detectMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
        toast.success("📍 تم تحديد موقعك — سنرتّب المنتجات الأقرب إليك");
        setDetecting(false);
      },
      () => {
        toast.error("تعذّر تحديد الموقع. اختر المحافظة يدوياً.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const needsCoordsForSort = sortBy === "distance" && !coords;

  const { data, isLoading, isError } = useQuery<PaginatedResponse<ProductList>>({
    queryKey: ["products", search, selectedCategory, selectedGov, sortBy, page, coords],
    queryFn: () =>
      catalogApi.getProducts({
        search: search || undefined,
        category_slug: selectedCategory || undefined,
        governorate: selectedGov || undefined,
        ordering: sortBy,
        page,
        in_stock: true,
        lat: coords?.lat,
        lng: coords?.lng,
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
    enabled: !needsCoordsForSort,
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      {/* ── Sticky Search Bar ──────────────────────────────────────── */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/95 backdrop-blur-sm
                      border-b border-surface-border shadow-xs">
        <div className="page-container py-3">
          <div className="flex gap-3 items-center">
            <SearchBar
              containerClassName="flex-1"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onClear={() => { setSearch(""); setPage(1); }}
              placeholder="ابحث عن منتج، مزارع، أو محافظة..."
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="field-input w-auto text-sm shrink-0 py-2.5 ps-3 pe-7"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
            <CategoryChip
              label="🌾 الكل"
              active={!selectedCategory}
              onClick={() => selectCategory("")}
            />
            {categories?.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={`${cat.icon} ${cat.name_ar}`}
                active={selectedCategory === cat.slug}
                onClick={() => selectCategory(cat.slug)}
              />
            ))}
          </div>

          {/* Governorate chips + detect-my-location */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 items-center">
            <button
              type="button"
              onClick={detectMyLocation}
              disabled={detecting}
              className="shrink-0 inline-flex items-center gap-1 rounded-full border border-forest-200
                         bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700
                         hover:bg-forest-100 disabled:opacity-60"
            >
              {detecting ? "⏳ جاري التحديد..." : coords ? "📍 موقعي مفعّل" : "📍 استخدم موقعي"}
            </button>
            <CategoryChip
              label="🗺️ كل المحافظات"
              active={!selectedGov}
              onClick={() => selectGov("")}
            />
            {GOVERNORATES.map((g) => (
              <CategoryChip
                key={g.code}
                label={g.name_ar}
                active={selectedGov === g.code}
                onClick={() => selectGov(g.code)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <main className="flex-1 page-container py-6 buyer-page-content">
        {/* Nudge when nearest-sort selected without coords */}
        {needsCoordsForSort && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl
                          border border-forest-100 bg-forest-50 p-4 text-sm text-forest-800">
            <p>
              لفرز المنتجات حسب الأقرب إليك نحتاج لموقعك. فعّل الموقع بنقرة واحدة.
            </p>
            <button
              type="button"
              onClick={detectMyLocation}
              disabled={detecting}
              className="rounded-lg bg-forest-500 px-3 py-1.5 text-xs font-bold text-white
                         hover:bg-forest-600 disabled:opacity-60"
            >
              {detecting ? "⏳ جاري التحديد..." : "📍 فعّل موقعي"}
            </button>
          </div>
        )}

        {/* Result count */}
        {!isLoading && data && (
          <p className="text-sm text-stone-400 mb-5 font-medium">
            {data.count > 0
              ? `${data.count} منتج متاح${selectedGov ? ` في ${GOVERNORATE_BY_CODE[selectedGov]?.name_ar ?? ""}` : ""}${sortBy === "distance" && coords ? " — مرتّبة حسب الأقرب إليك" : ""}`
              : "لا توجد منتجات"}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon="⚠️"
            title="تعذّر تحميل المنتجات"
            description="يرجى التحقق من الاتصال والمحاولة مرة أخرى"
            actionLabel="إعادة المحاولة"
            onAction={() => window.location.reload()}
          />
        ) : !data?.results?.length ? (
          <EmptyState
            icon="🔍"
            title="لم يُعثر على منتجات"
            description={
              search
                ? `لم نجد نتائج لـ "${search}". جرّب بحثاً مختلفاً.`
                : "لا توجد منتجات في هذا التصنيف حالياً."
            }
            actionLabel={selectedCategory ? "عرض كل المنتجات" : undefined}
            onAction={selectedCategory ? () => selectCategory("") : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                  className="px-4 py-2 bg-white border border-surface-border rounded-lg
                             text-sm font-medium text-stone-600 hover:bg-stone-50
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  → السابق
                </button>
                <span className="text-sm text-stone-500 px-2">
                  {data.current_page} من {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                  className="px-4 py-2 bg-white border border-surface-border rounded-lg
                             text-sm font-medium text-stone-600 hover:bg-stone-50
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  التالي ←
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm
                  font-medium transition-all duration-150
                  ${active
                    ? "bg-forest-500 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
    >
      {label}
    </button>
  );
}
