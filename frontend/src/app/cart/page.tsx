"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cartApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Cart } from "@/types";

export default function CartPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
    enabled: user?.role === "buyer",
  });

  const { mutate: removeItem, isPending: isRemoving } = useMutation({
    mutationFn: (productId: number) => cartApi.removeFromCart(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("تم إزالة المنتج من السلة");
    },
  });

  const { mutate: updateQty } = useMutation({
    mutationFn: ({ productId, qty }: { productId: number; qty: number }) =>
      cartApi.addToCart(productId, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const { mutate: clearCart, isPending: isClearing } = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("تم إفراغ السلة");
    },
  });

  const total = Number(cart?.total ?? 0);
  const DELIVERY_FEE = 0;
  const farmersCount = new Set(cart?.items.map((item) => item.farmer_id) ?? []).size;

  if (!user || user.role !== "buyer") {
    return (
      <div className="min-h-screen flex flex-col bg-surface-warm">
        <TopHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <EmptyState
            icon="🛒"
            title="يجب تسجيل الدخول"
            description="سجّل دخولك كمشتري للوصول إلى سلة التسوق"
            actionLabel="تسجيل الدخول"
            onAction={() => router.push("/login")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">سلة التسوق</h1>
            {cart && cart.item_count > 0 && (
              <p className="text-sm text-stone-400 mt-0.5">{cart.item_count} منتج</p>
            )}
          </div>
          {cart && cart.item_count > 0 && (
            <button
              onClick={() => clearCart()}
              disabled={isClearing}
              className="text-sm text-danger-500 font-medium hover:text-danger-600 transition-colors disabled:opacity-50"
            >
              إفراغ السلة
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-4 animate-pulse">
                <Skeleton className="w-20 h-20 rounded-xl shrink-0" rounded="lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-8 w-28 mt-2" rounded="md" />
                </div>
                <Skeleton className="h-6 w-16 self-start" />
              </div>
            ))}
          </div>
        ) : !cart || cart.item_count === 0 ? (
          <EmptyState
            icon="🛒"
            title="السلة فارغة"
            description="لم تضف أي منتجات بعد. تصفّح السوق واختر ما يناسبك."
            actionLabel="تصفّح السوق"
            onAction={() => router.push("/marketplace")}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    <Image src={getImageUrl(item.product_image)} alt={item.product_title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">
                      {item.product_title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">من: {item.farmer_name}</p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <QuantitySelector
                        value={Number(item.quantity)}
                        onChange={(qty) => updateQty({ productId: item.product, qty })}
                        min={1}
                        size="sm"
                        unit={item.unit_display}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <PriceDisplay amount={item.subtotal} size="sm" />
                    <p className="text-2xs text-stone-400 tabular-nums">
                      {formatCurrency(item.unit_price_snapshot)} / وحدة
                    </p>
                    <button
                      onClick={() => removeItem(item.product)}
                      disabled={isRemoving}
                      aria-label="إزالة من السلة"
                      className="text-stone-300 hover:text-danger-500 transition-colors disabled:opacity-50 mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="card p-5 lg:sticky lg:top-20">
                <h2 className="font-bold text-stone-900 text-base mb-4">ملخص الطلب</h2>

                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between text-stone-600">
                    <span>المجموع ({cart.item_count} منتج)</span>
                    <span className="tabular-nums font-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>رسوم التوصيل</span>
                    <span className="text-forest-600 font-semibold">
                      {DELIVERY_FEE === 0 ? "مجاني" : formatCurrency(DELIVERY_FEE)}
                    </span>
                  </div>
                  <div className="h-px bg-surface-border" />
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>الإجمالي</span>
                    <PriceDisplay amount={total + DELIVERY_FEE} size="md" />
                  </div>
                </div>

                <div className="flex gap-2.5 bg-forest-50 border border-forest-100 rounded-xl p-3 mb-4">
                  <span className="text-lg shrink-0">🧺</span>
                  <p className="text-xs text-forest-700 leading-relaxed">
                    السلة تدعم الآن الشراء من أكثر من مزارع. لديك {farmersCount} {farmersCount === 1 ? "مزارع" : "مزارعين"} في هذه السلة، وسيتم تقسيمها تلقائياً إلى طلب مستقل لكل مزارع مع نفس عنوان التوصيل.
                  </p>
                </div>

                <div className="flex gap-2.5 bg-earth-50 border border-earth-100 rounded-xl p-3 mb-4">
                  <span className="text-lg shrink-0">💵</span>
                  <p className="text-xs text-earth-700 leading-relaxed">
                    الدفع عند الاستلام فقط. ستؤكد الاستلام برمز QR.
                  </p>
                </div>

                <Button onClick={() => router.push("/checkout")} fullWidth size="lg">
                  إتمام الشراء
                </Button>

                <Link href="/marketplace" className="block text-center text-sm text-forest-600 mt-3 hover:text-forest-700 font-medium transition-colors">
                  ← متابعة التسوق
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}
