"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import StatusBadge, { OrderProgress } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["my-order", id],
    queryFn: () => ordersApi.getMyOrder(Number(id)).then((r) => r.data),
    refetchInterval: 30_000, // auto-refresh every 30s to catch status updates
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!order) return null;

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content space-y-5">
        {/* ── Back + Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-surface-border
                       flex items-center justify-center text-stone-500
                       hover:bg-stone-50 transition-colors shrink-0">
            →
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">طلب #{order.id}</h1>
            <p className="text-xs text-stone-400 mt-0.5">{formatDateTime(order.created_at)}</p>
          </div>
          <div className="ms-auto">
            <StatusBadge status={order.status as OrderStatus} size="lg" />
          </div>
        </div>

        {/* ── Status tracker ────────────────────────────────────────── */}
        {!isCancelled && (
          <div className="card p-5">
            <h2 className="section-title mb-5">تتبّع الطلب</h2>
            <OrderProgress status={order.status as OrderStatus} />
          </div>
        )}

        {/* ── Farmer info ───────────────────────────────────────────── */}
        <div className="card p-5">
          <h2 className="section-title mb-3">المزارع</h2>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-forest-100 flex items-center justify-center
                            text-xl shrink-0">🌾</div>
            <div>
              <p className="font-semibold text-stone-900">{order.farmer_name}</p>
              <p className="text-xs text-stone-400 mt-0.5">منتج طازج من المزرعة مباشرة</p>
            </div>
          </div>
        </div>

        {/* ── Items ─────────────────────────────────────────────────── */}
        <div className="card p-5">
          <h2 className="section-title mb-3">المنتجات ({order.items.length})</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id}
                className="flex items-center justify-between py-2.5
                           border-b border-surface-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 text-sm truncate">{item.title_snapshot}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {Number(item.quantity).toFixed(1)} {item.unit} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <span className="font-bold text-stone-900 tabular-nums text-sm ms-4 shrink-0">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-4 pt-4 border-t border-surface-border space-y-2 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>المجموع الفرعي</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>رسوم التوصيل</span>
              <span className={Number(order.delivery_fee) === 0 ? "text-forest-600 font-semibold" : "tabular-nums"}>
                {Number(order.delivery_fee) === 0 ? "مجاني" : formatCurrency(order.delivery_fee)}
              </span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-stone-900 pt-1
                            border-t border-surface-border">
              <span>الإجمالي</span>
              <PriceDisplay amount={order.total} size="md" />
            </div>
          </div>
        </div>

        {/* ── Delivery & Payment ────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="section-title">التوصيل والدفع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="field-label mb-1">📍 عنوان التوصيل</p>
              <p className="text-stone-700 leading-relaxed">{order.delivery_address}</p>
            </div>
            <div>
              <p className="field-label mb-1">💵 طريقة الدفع</p>
              <p className="text-stone-700">نقداً عند الاستلام</p>
              <span className={`badge mt-1 inline-block ${
                order.payment_status === "collected" ? "badge-success" : "badge-warning"
              }`}>
                {order.payment_status === "collected" ? "✓ تم التحصيل" : "في انتظار الدفع"}
              </span>
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <p className="field-label mb-1">📝 ملاحظات</p>
                <p className="text-stone-600 text-xs leading-relaxed">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Delivery instructions (buyer scans farmer's QR slip) ──── */}
        {(order.status === "out_for_delivery" || order.status === "ready_for_pickup") && (
          <div className="card p-5 bg-forest-50 border border-forest-100">
            <h2 className="section-title text-forest-800 mb-2">📷 تأكيد الاستلام</h2>
            <p className="text-sm text-forest-700 leading-relaxed mb-3">
              عند وصول الطلب، سيكون مع السائق قسيمة تحتوي رمز QR.
              افتح كاميرا هاتفك وامسح الرمز ليتم تأكيد الاستلام تلقائياً.
            </p>
            <ul className="text-xs text-forest-600 space-y-1.5 leading-relaxed ps-4 list-disc">
              <li>ستفتح صفحة تؤكّد التسليم مباشرة بعد المسح.</li>
              <li>تأكد من تسجيل دخولك بنفس الحساب الذي طلبت منه.</li>
              <li>في حال تعذّر المسح، يمكنك تزويد السائق بالرمز الاحتياطي المكتوب على القسيمة.</li>
            </ul>
          </div>
        )}

        {/* ── Post-delivery actions ─────────────────────────────────── */}
        {isDelivered && (
          <div className="card p-5 bg-earth-50 border border-earth-100">
            <p className="font-bold text-earth-800 mb-1">🎉 شكراً على ثقتك!</p>
            <p className="text-xs text-earth-600 mb-4">
              تم تسليم طلبك بنجاح. رأيك يهمّنا — قيّم تجربتك مع المزارع.
            </p>
            <Link href={`/orders/${order.id}/review`}>
              <Button variant="outline" size="sm">⭐ تقييم الطلب</Button>
            </Link>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex gap-3 pb-4">
          <Link href="/orders" className="flex-1">
            <Button variant="outline" fullWidth>← طلباتي</Button>
          </Link>
          <Link href="/marketplace" className="flex-1">
            <Button fullWidth>تسوّق مجدداً 🛒</Button>
          </Link>
        </div>
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />
      <div className="flex-1 page-container py-6 buyer-page-content space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    </div>
  );
}
