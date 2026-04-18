"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { catalogApi, cartApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductDetail } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<ProductDetail>({
    queryKey: ["product", params.id],
    queryFn: () => catalogApi.getProduct(Number(params.id)).then((r) => r.data),
  });

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: () => cartApi.addToCart(product!.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${product?.title} أُضيف إلى السلة 🛒`);
    },
    onError: () => toast.error("تعذّر الإضافة إلى السلة"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-warm">
        <TopHeader />
        <div className="flex-1 page-container py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const cartTotal = Number(product.price) * quantity;

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-stone-400 mb-6">
          <Link href="/marketplace" className="hover:text-forest-600 transition-colors font-medium">
            السوق
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <span>{product.category.name_ar}</span>
              <span>/</span>
            </>
          )}
          <span className="text-stone-600 truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Image ────────────────────────────────────────────── */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 shadow-sm">
            <Image
              src={getImageUrl(product.image)}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
            {product.is_featured && (
              <span className="absolute top-3 end-3 badge badge-earth shadow-sm">
                ⭐ مميز
              </span>
            )}
          </div>

          {/* ── Info ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="card p-6">
              {/* Category chip */}
              {product.category && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold
                                 bg-forest-50 text-forest-700 px-3 py-1 rounded-full mb-3">
                  {product.category.icon} {product.category.name_ar}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mb-3">
                {product.title}
              </h1>

              {/* Price */}
              <PriceDisplay
                amount={product.price}
                unit={product.unit_display}
                size="xl"
                className="mb-4"
              />

              {/* Stock indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  product.is_in_stock ? "bg-forest-500" : "bg-danger-500"
                }`} />
                <span className={`text-sm font-semibold ${
                  product.is_in_stock ? "text-forest-600" : "text-danger-600"
                }`}>
                  {product.is_in_stock
                    ? `متاح — ${Number(product.quantity_available).toFixed(1)} ${product.unit_display}`
                    : "نفد المخزون"}
                </span>
              </div>

              {product.description && (
                <p className="text-stone-600 text-sm leading-relaxed mb-4">
                  {product.description}
                </p>
              )}

              {/* Farmer voice description */}
              {product.transcription_text && (
                <div className="bg-earth-50 border border-earth-100 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-earth-700 mb-1">🎙️ كلام المزارع:</p>
                  <p className="text-sm text-earth-800 leading-relaxed">
                    {product.transcription_text}
                  </p>
                </div>
              )}

              {product.harvest_date && (
                <p className="text-xs text-stone-400 mb-4">
                  🌿 تاريخ الحصاد:{" "}
                  {new Date(product.harvest_date).toLocaleDateString("ar-PS", {
                    year: "numeric", month: "long", day: "numeric"
                  })}
                </p>
              )}

              {/* ── Add to cart (buyer only) ────────────────────── */}
              {user?.role === "buyer" && product.is_in_stock && (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-stone-700">الكمية:</p>
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      max={Number(product.quantity_available)}
                      size="md"
                      unit={product.unit_display}
                    />
                  </div>
                  <Button onClick={() => addToCart()} loading={isPending} fullWidth size="lg">
                    🛒 أضف إلى السلة — {formatCurrency(cartTotal)}
                  </Button>
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div className="mt-4 p-4 bg-forest-50 rounded-xl border border-forest-100">
                  <p className="text-forest-700 text-sm font-semibold mb-3">
                    سجّل دخولك لإضافة المنتج إلى سلتك
                  </p>
                  <div className="flex gap-2">
                    <Link href="/login"
                      className="flex-1 text-center text-sm font-bold py-2 px-4 rounded-lg
                                 bg-forest-500 text-white hover:bg-forest-600 transition-colors">
                      تسجيل الدخول
                    </Link>
                    <Link href="/register?role=buyer"
                      className="flex-1 text-center text-sm font-bold py-2 px-4 rounded-lg
                                 border-2 border-forest-500 text-forest-600 hover:bg-forest-50 transition-colors">
                      إنشاء حساب
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Farmer Card ─────────────────────────────────────── */}
            {product.farmer && (
              <div className="card p-5">
                <h3 className="font-bold text-stone-700 text-sm mb-3">عن المزارع</h3>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-forest-100 rounded-full flex items-center
                                  justify-center text-xl shrink-0">
                    🧑‍🌾
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">{product.farmer.full_name}</p>
                    {product.farmer.farm_name && (
                      <p className="text-xs text-stone-500">{product.farmer.farm_name}</p>
                    )}
                    <p className="text-xs text-stone-400">
                      📍 {product.farmer.governorate}, {product.farmer.city}
                    </p>
                  </div>
                </div>
                {product.farmer.bio && (
                  <p className="text-sm text-stone-500 mt-3 leading-relaxed">
                    {product.farmer.bio}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}
