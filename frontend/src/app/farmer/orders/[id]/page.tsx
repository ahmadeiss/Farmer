"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { ordersApi, extractApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import Button from "@/components/ui/Button";
import StatusBadge, { OrderProgress } from "@/components/ui/StatusBadge";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Order, OrderStatus } from "@/types";

const STATUS_TRANSITIONS: Record<string, { next: string; label: string } | null> = {
  pending:          { next: "confirmed",        label: "تأكيد الطلب" },
  confirmed:        { next: "preparing",        label: "بدء التحضير" },
  preparing:        { next: "ready_for_pickup", label: "جاهز للتسليم" },
  ready_for_pickup: { next: "out_for_delivery", label: "خرج للتوصيل" },
  out_for_delivery: null,
  delivered:        null,
  cancelled:        null,
};

export default function FarmerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [appOrigin, setAppOrigin] = useState("");
  useEffect(() => { setAppOrigin(window.location.origin); }, []);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["farmer-order", id],
    queryFn: () => ordersApi.getFarmerOrder(Number(id)).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      ordersApi.updateOrderStatus(Number(id), status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب ✅");
      qc.invalidateQueries({ queryKey: ["farmer-order", id] });
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر تحديث الحالة")),
  });

  const { mutate: confirmDelivery, isPending: isConfirming } = useMutation({
    mutationFn: (qrToken: string) => ordersApi.confirmQr(qrToken),
    onSuccess: () => {
      toast.success("تم تأكيد التسليم بنجاح 🎉");
      qc.invalidateQueries({ queryKey: ["farmer-order", id] });
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر تأكيد التسليم")),
  });

  if (isLoading) {
    return (
      <DashboardShell role="farmer">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </DashboardShell>
    );
  }

  if (!order) {
    return (
      <DashboardShell role="farmer">
        <div className="text-center py-16 text-stone-400">الطلب غير موجود</div>
      </DashboardShell>
    );
  }

  const transition = STATUS_TRANSITIONS[order.status as OrderStatus];
  const assignment = order.delivery_assignment;
  const isSelfDelivery = assignment?.delivery_mode === "self_delivery";
  const showQR =
    appOrigin &&
    order.qr_token &&
    isSelfDelivery &&
    (order.status === "ready_for_pickup" || order.status === "out_for_delivery");

  return (
    <DashboardShell role="farmer">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.push("/farmer/orders")}
          className="w-9 h-9 rounded-xl bg-white border border-surface-border flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors shrink-0">
          →
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-stone-900">طلب #{order.id}</h1>
          <p className="text-xs text-stone-400 mt-0.5">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status as OrderStatus} size="lg" />
      </div>

      {/* Progress */}
      {order.status !== "cancelled" && (
        <div className="card p-5 mb-4">
          <h2 className="text-sm font-bold text-stone-700 mb-4">تتبّع الطلب</h2>
          <OrderProgress status={order.status as OrderStatus} />
        </div>
      )}

      {/* Buyer Info */}
      <div className="card p-5 mb-4 space-y-2">
        <h2 className="text-sm font-bold text-stone-700">معلومات المشتري</h2>
        <p className="text-stone-800 font-semibold">👤 {order.buyer_name}</p>
        <p className="text-sm text-stone-500">📍 {order.delivery_address}</p>
        {order.notes && <p className="text-xs text-stone-400">📝 {order.notes}</p>}
      </div>

      {/* Items */}
      <div className="card p-5 mb-4">
        <h2 className="text-sm font-bold text-stone-700 mb-3">المنتجات ({order.items.length})</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-surface-border last:border-0">
              <span className="text-stone-600">{item.title_snapshot} × {item.quantity} {item.unit}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-surface-border mt-3">
          <span className="font-bold text-stone-900">الإجمالي</span>
          <PriceDisplay amount={order.total} size="md" />
        </div>
      </div>

      {/* QR + Self Delivery Voucher */}
      {showQR && (
        <div className="card p-5 mb-4 bg-forest-50 border-forest-200 space-y-4">
          <h2 className="text-sm font-bold text-forest-800">قسيمة التسليم الذاتي</h2>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-forest-100 inline-block">
              <QRCodeSVG value={`${appOrigin}/orders/confirm/${order.qr_token}`} size={148} level="M" includeMargin={false} className="rounded" />
            </div>
            <p className="text-xs text-stone-400">اعرض هذا الرمز للمشتري ليمسحه ويؤكد الاستلام</p>
          </div>
          <Button size="sm" variant="ghost" loading={isConfirming} onClick={() => confirmDelivery(order.qr_token)}
            className="w-full">
            تأكيد التسليم يدوياً
          </Button>
        </div>
      )}

      {/* Status action */}
      {transition && order.status !== "ready_for_pickup" && (
        <Button fullWidth loading={isPending} onClick={() => updateStatus({ status: transition.next })}
          className="mb-4">
          {transition.label}
        </Button>
      )}
      {order.status === "ready_for_pickup" && assignment && (
        <Button fullWidth loading={isPending} onClick={() => updateStatus({ status: "out_for_delivery" })}
          className="mb-4">
          خرج للتوصيل 🚚
        </Button>
      )}
      {order.status === "pending" && (
        <Button fullWidth variant="outline"
          className="text-danger-600 border-danger-200 hover:bg-danger-50 mb-4"
          loading={isPending}
          onClick={() => updateStatus({ status: "cancelled" })}>
          إلغاء الطلب
        </Button>
      )}

      <Button variant="outline" fullWidth onClick={() => router.push("/farmer/orders")}>
        ← العودة لقائمة الطلبات
      </Button>
    </DashboardShell>
  );
}
