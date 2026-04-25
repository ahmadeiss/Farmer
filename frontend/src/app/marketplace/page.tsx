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
  { value: "-created_at", label: "الأحدث", icon: "🆕" },
  { value: "distance", label: "الأقرب", icon: "📍" },
  { value: "price", label: "الأقل سعراً", icon: "⬇️" },
  { value: "-price", label: "الأعلى سعراً", icon: "⬆️" },
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setCategory] = useState("");
  const [selectedGov, setSelectedGov] = useState("");
  const [sortBy, setSortBy] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
        toast.success("📍 تم تحديد موقعك");
        setDetecting(false);
      },
      () => {
        toast.error("تعذّر تحديد الموقع.");
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

  const ActiveSortIcon = SORT_OPTIONS.find(o => o.value === sortBy)?.icon || "🆕";

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      {/* Sticky Search & Filters */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-surface-border shadow-sm">
        <div className="page-container py-3 space-y-3">
          {/* Search Bar */}
          <div className="flex gap-2 items-center">
            <SearchBar
              containerClassName="flex-1"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onClear={() => { setSearch(""); setPage(1); }}
              placeholder="ابحث عن منتج..."
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-colors ${
                showFilters || selectedCategory || selectedGov
                  ? "bg-forest-50 border-forest-200 text-forest-600"
                  : "bg-white border-surface-border text-stone-400 hover:border-stone-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-3 pt-2 border-t border-surface-border animate-fade-in">
              {/* Sort */}
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2">الترتيب</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        sortBy === opt.value
                          ? "bg-forest-500 text-white shadow-md"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2">التصنيفات</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => selectCategory("")}
                    className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      !selectedCategory
                        ? "bg-forest-500 text-white shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    الكل
                  </button>
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat.slug)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === cat.slug
                          ? "bg-forest-500 text-white shadow-md"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {cat.icon} {cat.name_ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Governorates + Location */}
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2">الموقع</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={detectMyLocation}
                    disabled={detecting}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-forest-50 border border-forest-200 text-forest-700 hover:bg-forest-100 disabled:opacity-60 transition-all"
                  >
                    {detecting ? (
                      <div className="w-4 h-4 border-2 border-forest-500/30 border-t-forest-500 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.65L10 18.65l-4.95-5.65a7 7 0 010-9.95zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {coords ? "📍 موقعي مفعل" : "حدد موقعي"}
                  </button>
                  <button
                    onClick={() => selectGov("")}
                    className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      !selectedGov
                        ? "bg-forest-500 text-white shadow-md"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    كل المحافظات
                  </button>
                  {GOVERNORATES.map((g) => (
                    <button
                      key={g.code}
                      onClick={() => selectGov(g.code)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedGov === g.code
                          ? "bg-forest-500 text-white shadow-md"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {g.name_ar}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 page-container py-6 buyer-page-content">
        {/* Results Count */}
        {!isLoading && data && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {data.count > 0 
                ? `${data.count} منتج متاح` 
                : "لا توجد منتجات"}
            </p>
            {(selectedGov || selectedCategory) && (
              <button
                onClick={() => { setCategory(""); setSelectedGov(""); setPage(1); }}
                className="text-sm text-forest-600 hover:text-forest-700 font-medium"
              >
                مسح الفلترات
              </button>
            )}
          </div>
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
            description={search ? `لم نجد نتائج لـ "${search}"` : "لا توجد منتجات متاحة حالياً"}
            actionLabel="تصفّح كل المنتجات"
            onAction={() => { setSearch(""); setCategory(""); setSelectedGov(""); }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((product, i) => (
                <div 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                  className="px-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  ← السابق
                </button>
                <span className="px-4 py-2 text-sm text-stone-500">
                  {data.current_page} / {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                  className="px-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
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