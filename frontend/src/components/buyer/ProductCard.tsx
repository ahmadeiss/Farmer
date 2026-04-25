"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { formatDistanceKm } from "@/lib/palestine";
import type { ProductList } from "@/types";

interface ProductCardProps {
  product: ProductList;
}

type ApiError = { response?: { data?: { code?: string; error?: string } } };

const GUEST_CART_KEY = "hasaad-guest-cart";

interface GuestCartItem {
  productId: number;
  productTitle: string;
  unitPrice: number;
  unitDisplay: string;
  qty: number;
}

const getGuestCart = (): GuestCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveGuestCart = (items: GuestCartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const addToGuestCart = (item: Omit<GuestCartItem, "qty">) => {
  const cart = getGuestCart();
  const existing = cart.find((i) => i.productId === item.productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveGuestCart(cart);
};

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isBuyer = user?.role === "buyer";
  const isGuest = !user;

  // Max = available stock, min = 1 (always at least 1 unit)
  const maxQty = Math.max(1, Number(product.quantity_available));
  const [qty, setQty] = useState(1);

  const decrement = () => setQty((q) => Math.max(1, q - 1));
  const increment = () => setQty((q) => Math.min(maxQty, q + 1));

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: () => cartApi.addToCart(product.id, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`أُضيف ${qty} ${product.unit_display} إلى السلة ✓`);
      setQty(1); // reset after adding
    },
    onError: async (err: unknown) => {
      const apiErr = err as ApiError;
      const code = apiErr?.response?.data?.code;
      const msg  = apiErr?.response?.data?.error ?? "";

      if (code === "different_farmer") {
        const currentQty = qty; // capture for closure
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
                  className="flex-1 bg-forest-500 hover:bg-forest-600 text-white
                             text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  إفراغ السلة وإضافة المنتج
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700
                             text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
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
    <div className="card-interactive flex flex-col h-full group hover:shadow-card-hover
                    transition-all duration-200 hover:-translate-y-1 active:scale-[0.98]">
      {/* Image */}
      <Link
        href={`/marketplace/${product.id}`}
        className="relative aspect-[4/3] overflow-hidden block bg-stone-100"
      >
        <Image
          src={getImageUrl(product.image)}
          alt={product.title}
          fill
          className={`object-cover transition-transform duration-300
                      group-hover:scale-[1.04] ${outOfStock ? "opacity-60" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlays */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/30">
            <span className="bg-white/90 text-stone-700 font-bold px-3 py-1 rounded-full text-xs shadow">
              نفد المخزون
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 end-2 flex flex-col gap-1">
          {product.is_featured && (
            <span className="badge badge-earth text-2xs shadow-sm">⭐ مميز</span>
          )}
          {product.is_low_stock && !outOfStock && (
            <span className="badge badge-warning text-2xs shadow-sm">كمية محدودة</span>
          )}
        </div>

        {/* Distance badge */}
        {typeof product.distance_km === "number" && (
          <span
            className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full
                       bg-white/95 px-2 py-0.5 text-2xs font-bold text-forest-700 shadow-sm"
          >
            📍 {formatDistanceKm(product.distance_km)}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        {product.category_name && (
          <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
            {product.category_name}
          </p>
        )}

        {/* Title */}
        <Link href={`/marketplace/${product.id}`} className="block mb-1">
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2
                         hover:text-forest-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Farmer & location */}
        <p className="text-xs text-stone-400 mb-3 truncate">
          🌍 {product.farmer_location}
        </p>

        {/* Price */}
        <div className="mt-auto">
          <PriceDisplay
            amount={product.price}
            unit={product.unit_display}
            size="md"
          />
        </div>

        {/* Quantity controls + Add to cart — buyer only, in-stock only */}
        {isBuyer && !outOfStock && (
          <div className="flex items-center gap-1.5 mt-3">
            {/* − button */}
            <button
              type="button"
              onClick={decrement}
              disabled={qty <= 1 || isPending}
              aria-label="تقليل الكمية"
              className="w-7 h-7 rounded-md border border-surface-border bg-white
                         text-stone-600 font-bold text-sm flex items-center justify-center
                         hover:bg-stone-100 active:scale-90 disabled:opacity-30
                         transition-all duration-100 shrink-0"
            >
              −
            </button>

            {/* Quantity display */}
            <span className="w-9 text-center text-sm font-bold text-stone-900 tabular-nums select-none">
              {qty}
            </span>

            {/* + button */}
            <button
              type="button"
              onClick={increment}
              disabled={qty >= maxQty || isPending}
              aria-label="زيادة الكمية"
              className="w-7 h-7 rounded-md border border-surface-border bg-white
                         text-stone-600 font-bold text-sm flex items-center justify-center
                         hover:bg-stone-100 active:scale-90 disabled:opacity-30
                         transition-all duration-100 shrink-0"
            >
              +
            </button>

            {/* unit label */}
            <span className="text-2xs text-stone-400 truncate flex-1">{product.unit_display}</span>

            {/* Add to cart button */}
            <button
              onClick={() => addToCart()}
              disabled={isPending}
              aria-label={`إضافة ${product.title} إلى السلة`}
              className="shrink-0 h-7 px-2.5 bg-forest-500 hover:bg-forest-600
                         disabled:opacity-50 text-white rounded-lg text-xs font-bold
                         flex items-center gap-1
                         transition-all duration-150 active:scale-90 shadow-sm"
            >
              {isPending ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
                  </svg>
                  أضف
                </>
              )}
            </button>
          </div>
        )}

        {/* Guest: show add button that saves to localStorage */}
        {isGuest && !outOfStock && (
          <div className="flex items-center gap-1.5 mt-3">
            {/* − button */}
            <button
              type="button"
              onClick={decrement}
              disabled={qty <= 1}
              aria-label="تقليل الكمية"
              className="w-7 h-7 rounded-md border border-surface-border bg-white
                         text-stone-600 font-bold text-sm flex items-center justify-center
                         hover:bg-stone-100 active:scale-90 disabled:opacity-30
                         transition-all duration-100 shrink-0"
            >
              −
            </button>

            {/* Quantity display */}
            <span className="w-9 text-center text-sm font-bold text-stone-900 tabular-nums select-none">
              {qty}
            </span>

            {/* + button */}
            <button
              type="button"
              onClick={increment}
              disabled={qty >= maxQty}
              aria-label="زيادة الكمية"
              className="w-7 h-7 rounded-md border border-surface-border bg-white
                         text-stone-600 font-bold text-sm flex items-center justify-center
                         hover:bg-stone-100 active:scale-90 disabled:opacity-30
                         transition-all duration-100 shrink-0"
            >
              +
            </button>

            {/* unit label */}
            <span className="text-2xs text-stone-400 truncate flex-1">{product.unit_display}</span>

            {/* Add to cart for guest */}
            <button
              onClick={() => {
                addToGuestCart({
                  productId: product.id,
                  productTitle: product.title,
                  unitPrice: Number(product.price),
                  unitDisplay: product.unit_display,
                });
                toast.success(
                  (t) => (
                    <div className="flex flex-col gap-2 text-sm text-right" dir="rtl">
                      <p className="font-bold text-stone-900">
                        أُضيف {qty} {product.unit_display} إلى السلة ✓
                      </p>
                      <p className="text-stone-600 text-xs leading-relaxed">
                        سجّل دخولك لاستكمال الشراء
                      </p>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          router.push("/login?redirect=/cart");
                        }}
                        className="bg-forest-500 hover:bg-forest-600 text-white
                                   text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                      >
                        تسجيل الدخول الآن
                      </button>
                    </div>
                  ),
                  { duration: 8000, style: { maxWidth: "340px" } }
                );
                setQty(1);
              }}
              aria-label={`إضافة ${product.title} إلى السلة`}
              className="shrink-0 h-7 px-2.5 bg-forest-500 hover:bg-forest-600
                         text-white rounded-lg text-xs font-bold
                         flex items-center gap-1
                         transition-all duration-150 active:scale-90 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" />
              </svg>
              أضف
            </button>
          </div>
        )}

        {/* Harvest date */}
        {product.harvest_date && (
          <p className="text-2xs text-stone-400 mt-2 flex items-center gap-1">
            <span>🌿</span>
            حصاد {new Date(product.harvest_date).toLocaleDateString("ar-PS", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}
