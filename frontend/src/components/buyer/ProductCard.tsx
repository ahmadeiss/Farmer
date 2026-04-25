"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { getImageUrl, HASAAD_LOGO_URL } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { formatDistanceKm } from "@/lib/palestine";
import type { ProductList } from "@/types";

interface ProductCardProps {
  product: ProductList;
}

type ApiError = { response?: { data?: { code?: string; error?: string } } };

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isBuyer = user?.role === "buyer";

  const maxQty = Math.max(1, Number(product.quantity_available));
  const [qty, setQty] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isPlaceholder = !product.image;

  const decrement = () => setQty((q) => Math.max(1, q - 1));
  const increment = () => setQty((q) => Math.min(maxQty, q + 1));

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: () => cartApi.addToCart(product.id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`أُضيف ${qty} ${product.unit_display} إلى السلة ✓`);
      setQty(1);
    },
    onError: async (err: unknown) => {
      const apiErr = err as ApiError;
      const code = apiErr?.response?.data?.code;
      const msg = apiErr?.response?.data?.error ?? "";

      if (code === "different_farmer") {
        const currentQty = qty;
        toast(
          (t) => (
            <div className="flex flex-col gap-2 text-sm text-right" dir="rtl">
              <p className="font-bold text-stone-900">⚠️ منتج من مزارع مختلف</p>
              <p className="text-stone-600 text-xs leading-relaxed">
                {msg || "سلتك تحتوي على منتجات من مزارع آخر."}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    await cartApi.clearCart();
                    await cartApi.addToCart(product.id, currentQty);
                    queryClient.invalidateQueries({ queryKey: ["cart"] });
                    toast.success(`تم إفراغ السلة وإضافة ${currentQty} ${product.unit_display} ✓`);
                    setQty(1);
                  }}
                  className="flex-1 bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  إفراغ السلة وإضافة
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ),
          { duration: 10_000, style: { maxWidth: "340px" } }
        );
      } else if (code === "insufficient_stock") {
        toast.error(`الكمية المتاحة ${product.quantity_available} ${product.unit_display} فقط`);
        setQty(maxQty);
      } else {
        toast.error(msg || "تعذّر الإضافة إلى السلة");
      }
    },
  });

  const outOfStock = !product.is_in_stock;

  return (
    <div className="card-interactive flex flex-col h-full group">
      {/* Image Container */}
      <Link
        href={`/marketplace/${product.id}`}
        className="relative aspect-[4/3] overflow-hidden block bg-stone-100"
      >
        {/* Skeleton until image loads */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-stone-200 animate-pulse" />
        )}

        {isPlaceholder ? (
          /* ── Logo Placeholder ── */
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500
              bg-gradient-to-br from-forest-50 via-white to-forest-100
              ${isImageLoaded ? "opacity-100" : "opacity-0"}
              ${outOfStock ? "opacity-60" : ""}`}
          >
            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(26,157,101,0.12)_0%,transparent_70%)]" />
            {/* Decorative ring */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full
                            bg-white/80 shadow-md border border-forest-100
                            group-hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 rounded-full border-2 border-forest-200/50
                              animate-[spin_12s_linear_infinite]"
                   style={{ borderTopColor: "transparent", borderBottomColor: "transparent" }} />
              <Image
                src={HASAAD_LOGO_URL}
                alt="حصاد"
                width={56}
                height={56}
                className="object-contain w-14 h-14 drop-shadow-sm"
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          </div>
        ) : (
          <Image
            src={getImageUrl(product.image)}
            alt={product.title}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-110
              ${outOfStock ? "opacity-60" : ""}
              ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}

        {/* Out of Stock Overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/20">
            <span className="bg-white/95 text-stone-700 font-bold px-4 py-1.5 rounded-full text-sm shadow-lg">
              نفد المخزون
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 end-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="bg-gradient-to-r from-earth-500 to-earth-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              ⭐ مميز
            </span>
          )}
          {product.is_low_stock && !outOfStock && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md animate-pulse">
              ⚡ كمية محدودة
            </span>
          )}
        </div>

        {/* Distance Badge */}
        {typeof product.distance_km === "number" && (
          <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-forest-700 shadow-md">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.65L10 18.65l-4.95-5.65a7 7 0 010-9.95zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {formatDistanceKm(product.distance_km)}
          </span>
        )}

        {/* Quick View Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <span className="text-white text-sm font-medium">عرض التفاصيل</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
            {product.category_name}
          </p>
        )}

        {/* Title */}
        <Link href={`/marketplace/${product.id}`} className="block mb-2">
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2 group-hover:text-forest-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Farmer & Location */}
        <p className="text-sm text-stone-400 mb-3 truncate flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.65L10 18.65l-4.95-5.65a7 7 0 010-9.95zM10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {product.farmer_location}
        </p>

        {/* Price */}
        <div className="mt-auto">
          <PriceDisplay
            amount={product.price}
            unit={product.unit_display}
            size="lg"
          />
        </div>

        {/* Add to Cart - Buyer Only */}
        {isBuyer && !outOfStock && (
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={decrement}
              disabled={qty <= 1 || isPending}
              className="w-10 h-10 rounded-xl border-2 border-stone-200 bg-white text-stone-600 font-bold text-lg flex items-center justify-center hover:bg-stone-50 active:scale-95 disabled:opacity-40 transition-all duration-150"
            >
              −
            </button>
            <div className="flex-1 text-center font-bold text-stone-900 tabular-nums">
              {qty}
            </div>
            <button
              type="button"
              onClick={increment}
              disabled={qty >= maxQty || isPending}
              className="w-10 h-10 rounded-xl border-2 border-stone-200 bg-white text-stone-600 font-bold text-lg flex items-center justify-center hover:bg-stone-50 active:scale-95 disabled:opacity-40 transition-all duration-150"
            >
              +
            </button>
            <button
              onClick={() => addToCart()}
              disabled={isPending}
              className="flex-1 h-10 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all duration-150 shadow-md shadow-forest-500/20"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
                  </svg>
                  أضف
                </>
              )}
            </button>
          </div>
        )}

        {/* Login Prompt for Guests */}
        {!user && !outOfStock && (
          <Link
            href={`/login?next=/marketplace/${product.id}`}
            className="flex items-center justify-center gap-2 mt-4 h-10 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4m0 0m4-4v12m-4-4h12m-4-4v12m-4 4h12M5 8h14a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" />
            </svg>
            أضف للسلة
          </Link>
        )}

        {/* Harvest Date */}
        {product.harvest_date && (
          <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
            <span className="text-forest-500">🌿</span>
            <span>حصاد {new Date(product.harvest_date).toLocaleDateString("ar-PS", { month: "short", day: "numeric" })}</span>
          </p>
        )}
      </div>
    </div>
  );
}