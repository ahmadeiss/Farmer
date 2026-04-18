"use client";

import Image from "next/image";
import Link from "next/link";
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

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isBuyer = user?.role === "buyer";

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: () => cartApi.addToCart(product.id, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("أُضيف إلى السلة ✓");
    },
    onError: async (err: unknown) => {
      const apiErr = err as ApiError;
      const code = apiErr?.response?.data?.code;
      const msg  = apiErr?.response?.data?.error ?? "";

      if (code === "different_farmer") {
        // Offer to clear cart and add this product instead
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
                    await cartApi.addToCart(product.id, 1);
                    queryClient.invalidateQueries({ queryKey: ["cart"] });
                    toast.success("تم إفراغ السلة وإضافة المنتج ✓");
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
      } else {
        toast.error(msg || "تعذّر الإضافة إلى السلة");
      }
    },
  });

  const outOfStock = !product.is_in_stock;

  return (
    <div className="card flex flex-col h-full group hover:shadow-card-hover
                    transition-all duration-200 hover:-translate-y-0.5">
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

        {/* Price + Add to cart */}
        <div className="flex items-end justify-between mt-auto gap-2">
          <PriceDisplay
            amount={product.price}
            unit={product.unit_display}
            size="md"
          />

          {isBuyer && !outOfStock && (
            <button
              onClick={() => addToCart()}
              disabled={isPending}
              aria-label={`إضافة ${product.title} إلى السلة`}
              className="shrink-0 w-9 h-9 bg-forest-500 hover:bg-forest-600
                         disabled:opacity-50 text-white rounded-lg
                         flex items-center justify-center
                         transition-all duration-150 active:scale-90 shadow-sm"
            >
              {isPending ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          )}
        </div>

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
