"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { driverApi, ordersApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import PriceDisplay from "@/components/ui/PriceDisplay";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import type { DriverOption, Order, OrderStatus, PaginatedResponse } from "@/types";

const STATUS_TRANSITIONS: Record<string, { next: string; label: string } | null> = {
  pending: { next: "confirmed", label: "تأكيد الطلب" },
  confirmed: { next: "preparing", label: "بدء التحضير" },
  preparing: { next: "ready_for_pickup", label: "جاهز للتسليم" },
  ready_for_pickup: { next: "out_for_delivery", label: "خرج للتوصيل" },
  out_for_delivery: null,
  delivered: null,
  cancelled: null,
};

const resetAssignState = (
  setAssignTarget: (value: Order | null) => void,
  setDriverSearch: (value: string) => void,
  setAssignNotes: (value: string) => void,
  setSelectedDriverId: (value: number | null) => void,
  setDeliveryMode: (value: "driver" | "self_delivery") => void
) => {
  setAssignTarget(null);
  setDriverSearch("");
  setAssignNotes("");
  setSelectedDriverId(null);
  setDeliveryMode("driver");
};

export default function FarmerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [appOrigin, setAppOrigin] = useState("");
  const [assignTarget, setAssignTarget] = useState<Order | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"driver" | "self_delivery">("driver");
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["farmer-orders", statusFilter],
    queryFn: () => ordersApi.getFarmerOrders(statusFilter ? { status: statusFilter } : {}).then((r) => r.data),
  });

  const { data: drivers, isLoading: isDriversLoading } = useQuery<PaginatedResponse<DriverOption>>({
    queryKey: ["available-drivers", driverSearch],
    queryFn: () => driverApi.getAvailableDrivers(driverSearch ? { search: driverSearch } : {}).then((r) => r.data),
    enabled: !!assignTarget && deliveryMode === "driver",
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) => ordersApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
      setCancelTarget(null);
      toast.success("تم تحديث حالة الطلب");
    },
    onError: (err: unknown) => {
      const e = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(e?.error || "تعذّر تحديث الحالة");
    },
  });

  const { mutate: assignDelivery, isPending: isAssigning } = useMutation({
    mutationFn: (payload: { orderId: number; delivery_mode: "driver" | "self_delivery"; driver_id?: number | null; notes?: string }) =>
      ordersApi.assignDelivery(payload.orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
      resetAssignState(setAssignTarget, setDriverSearch, setAssignNotes, setSelectedDriverId, setDeliveryMode);
      toast.success("تم حفظ جهة التوصيل بنجاح");
    },
    onError: (err: unknown) => {
      const e = (err as { response?: { data?: { error?: string; driver_id?: string[] } } })?.response?.data;
      toast.error(e?.error || e?.driver_id?.[0] || "تعذّر حفظ جهة التوصيل");
    },
  });

  const { mutate: confirmDelivery, isPending: isConfirming } = useMutation({
    mutationFn: (qrToken: string) => ordersApi.confirmQr(qrToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmer-orders"] });
      toast.success("تم تأكيد التسليم بنجاح");
    },
    onError: (err: unknown) => {
      const e = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(e?.error || "تعذّر تأكيد التسليم");
    },
  });

  const statusTabs = useMemo(
    () => [
      { value: "", label: "الكل" },
      { value: "pending", label: "معلقة" },
      { value: "confirmed", label: "مؤكدة" },
      { value: "preparing", label: "تحضير" },
      { value: "ready_for_pickup", label: "جاهزة" },
      { value: "out_for_delivery", label: "في الطريق" },
      { value: "delivered", label: "مسلّمة" },
      { value: "cancelled", label: "ملغاة" },
    ],
    []
  );

  const selectedDriver = drivers?.results.find((driver) => driver.id === selectedDriverId) ?? null;

  return (
    <DashboardShell role="farmer">
      <PageHeader title="الطلبات" subtitle={data ? `${data.count ?? 0} طلب إجمالي` : undefined} size="md" />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {statusTabs.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              statusFilter === s.value
                ? "border-forest-500 bg-forest-500 text-white shadow-sm"
                : "border-surface-border bg-white text-stone-500 hover:bg-stone-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <EmptyState
          icon="📭"
          title="لا توجد طلبات"
          description={statusFilter ? "لا توجد طلبات بهذه الحالة" : "ستظهر طلباتك هنا عند بدء البيع"}
        />
      ) : (
        <div className="space-y-4">
          {data.results.map((order) => {
            const transition = STATUS_TRANSITIONS[order.status as OrderStatus];
            const assignment = order.delivery_assignment;
            const canDispatch = order.status === "ready_for_pickup" && !!assignment;

            return (
              <article key={order.id} className="card p-4 sm:p-5 transition-all duration-200 hover:shadow-card-hover">
                <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-stone-900">طلب #{order.id}</span>
                      <StatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-sm text-stone-600">👤 {order.buyer_name}</p>
                    <p className="text-sm leading-6 text-stone-500">📍 {order.delivery_address}</p>
                    <p className="text-xs text-stone-400">{formatDateTime(order.created_at)}</p>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    <PriceDisplay amount={order.total} size="lg" />
                    <span className="text-xs text-stone-400">{order.items.length} منتج</span>

                    {transition && order.status !== "ready_for_pickup" && (
                      <Button size="sm" loading={isPending} onClick={() => updateStatus({ orderId: order.id, status: transition.next })}>
                        {transition.label}
                      </Button>
                    )}

                    {order.status === "ready_for_pickup" &&
                      (!assignment ? (
                        <Button size="sm" onClick={() => setAssignTarget(order)}>
                          تعيين التوصيل
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          loading={isPending}
                          onClick={() => updateStatus({ orderId: order.id, status: "out_for_delivery" })}
                          disabled={!canDispatch}
                        >
                          خرج للتوصيل
                        </Button>
                      ))}

                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger-600 hover:bg-danger-50"
                        onClick={() => setCancelTarget(order.id)}
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                </div>

                {assignment && (
                  <div className="mb-4 rounded-xl border border-earth-100 bg-earth-50 p-4">
                    <p className="mb-1 text-xs font-bold text-earth-700">جهة التوصيل</p>
                    <p className="text-sm leading-6 text-stone-800">
                      {assignment.delivery_mode === "driver"
                        ? `السائق: ${assignment.driver_name ?? "غير محدد"}`
                        : "توصيل ذاتي من المزرعة"}
                    </p>
                    {assignment.notes && <p className="mt-1 text-xs leading-6 text-stone-500">{assignment.notes}</p>}
                    {order.status === "ready_for_pickup" && (
                      <button
                        onClick={() => {
                          setAssignTarget(order);
                          setDeliveryMode(assignment.delivery_mode);
                          setSelectedDriverId(assignment.driver_id);
                          setAssignNotes(assignment.notes ?? "");
                        }}
                        className="mt-2 text-xs font-semibold text-forest-700 hover:underline"
                      >
                        تعديل التعيين
                      </button>
                    )}
                  </div>
                )}

                {!assignment && order.status === "ready_for_pickup" && (
                  <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
                    <p className="text-sm font-bold text-danger-700">يجب تعيين جهة التوصيل قبل إخراج الطلب.</p>
                    <p className="mt-1 text-xs leading-6 text-danger-600">
                      اختر سائقًا من النظام أو فعّل خيار التوصيل الذاتي من المزرعة، وبعدها فقط سيظهر مسار التسليم والباركود.
                    </p>
                  </div>
                )}

                <div className="space-y-2 border-t border-surface-border pt-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-stone-600 leading-6">
                        {item.title_snapshot} × {item.quantity} {item.unit}
                      </span>
                      <span className="tabular-nums whitespace-nowrap font-semibold text-stone-800">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {assignment && assignment.delivery_mode === "driver" && (order.status === "ready_for_pickup" || order.status === "out_for_delivery") && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold text-blue-700">
                      🚚 الطلب مسند إلى {assignment.driver_name ?? "سائق من النظام"}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-blue-700">
                      السائق يحمل رمز QR اللازم لتأكيد الاستلام عند المشتري. سلّم الطلب للسائق فقط.
                    </p>
                  </div>
                )}

                {assignment && assignment.delivery_mode === "self_delivery" && (order.status === "ready_for_pickup" || order.status === "out_for_delivery") && (
                  <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 p-4">
                    <p className="mb-1 text-xs font-bold text-forest-700">قسيمة تسليم (توصيل ذاتي)</p>
                    <p className="mb-4 text-xs leading-6 text-forest-700">
                      تم اختيار التوصيل الذاتي من المزرعة. استخدم هذه القسيمة أثناء عملية التسليم للمشتري.
                    </p>

                    <div className="rounded-xl border border-forest-200 bg-white p-4">
                      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                        <div className="flex flex-col items-center">
                          {appOrigin && (
                            <QRCodeSVG
                              value={`${appOrigin}/orders/confirm/${order.qr_token}`}
                              size={132}
                              level="M"
                              includeMargin={false}
                              className="rounded"
                            />
                          )}
                          <p className="mt-3 text-[10px] text-stone-400">رمز احتياطي</p>
                          <p className="font-mono text-sm font-bold tracking-[0.2em] text-forest-700">
                            {order.qr_token.slice(0, 8).toUpperCase()}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="border-b border-dashed border-stone-200 pb-3 text-center lg:text-right">
                            <p className="text-[10px] text-stone-400">المشتري</p>
                            <p className="text-base font-bold text-stone-900">{order.buyer_name}</p>
                            <p className="mt-1 text-xs text-stone-500">طلب #{order.id}</p>
                          </div>

                          <p className="text-xs leading-6 text-stone-500">
                            يتم التأكيد تلقائيًا عند مسح المشتري للرمز. ويمكنك استخدام التأكيد اليدوي فقط عند الحاجة.
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={isConfirming}
                              onClick={() => confirmDelivery(order.qr_token)}
                            >
                              تأكيد يدوي
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="تأكيد إلغاء الطلب"
        description="هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذه الخطوة."
        confirmLabel="إلغاء الطلب"
        cancelLabel="تراجع"
        variant="danger"
        loading={isPending}
        onConfirm={() => {
          if (cancelTarget) {
            updateStatus({ orderId: cancelTarget, status: "cancelled" });
          }
        }}
        onCancel={() => setCancelTarget(null)}
      />

      {assignTarget && (
        <div className="fixed inset-0 z-modal flex items-end justify-center p-3 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            onClick={() =>
              resetAssignState(setAssignTarget, setDriverSearch, setAssignNotes, setSelectedDriverId, setDeliveryMode)
            }
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-white p-4 shadow-modal sm:p-6 max-h-[88vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-stone-900 sm:text-xl">تعيين التوصيل للطلب #{assignTarget.id}</h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              يجب تحديد جهة التسليم قبل إخراج الطلب للتوصيل أو طباعة قسيمة الباركود.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className={`rounded-2xl border p-4 text-start transition ${
                  deliveryMode === "driver"
                    ? "border-forest-500 bg-forest-50 text-forest-800"
                    : "border-surface-border bg-white text-stone-700"
                }`}
                onClick={() => setDeliveryMode("driver")}
              >
                <p className="font-bold">تعيين سائق من النظام</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">ابحث واختر سائقًا مسجلًا ليقوم بالتوصيل.</p>
              </button>

              <button
                className={`rounded-2xl border p-4 text-start transition ${
                  deliveryMode === "self_delivery"
                    ? "border-earth-500 bg-earth-50 text-earth-800"
                    : "border-surface-border bg-white text-stone-700"
                }`}
                onClick={() => {
                  setDeliveryMode("self_delivery");
                  setSelectedDriverId(null);
                }}
              >
                <p className="font-bold">توصيل ذاتي من المزرعة</p>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  سيتم تسليم الطلب مباشرة من طرف المزرعة بدون سائق من النظام.
                </p>
              </button>
            </div>

            {deliveryMode === "driver" && (
              <div className="mt-5 space-y-4">
                <SearchBar
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  onClear={() => setDriverSearch("")}
                  loading={isDriversLoading}
                  placeholder="ابحث باسم السائق أو رقم هاتفه..."
                />

                <div className="max-h-64 overflow-y-auto rounded-2xl border border-surface-border">
                  {!drivers?.results?.length ? (
                    <div className="p-5 text-sm text-stone-500">لا يوجد سائقون مطابقون للبحث.</div>
                  ) : (
                    drivers.results.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => setSelectedDriverId(driver.id)}
                        className={`flex w-full items-center justify-between gap-3 border-b border-surface-border px-4 py-3 text-start last:border-b-0 ${
                          selectedDriverId === driver.id ? "bg-forest-50" : "bg-white hover:bg-stone-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900">{driver.full_name}</p>
                          <p className="dir-ltr mt-1 text-xs text-stone-500">{driver.phone}</p>
                        </div>
                        <div className="text-xs font-semibold">
                          {driver.is_verified ? (
                            <span className="text-forest-700">موثّق</span>
                          ) : (
                            <span className="text-earth-700">غير موثّق</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {selectedDriver && (
                  <div className="rounded-xl border border-forest-100 bg-forest-50 p-4 text-sm text-forest-800">
                    السائق المحدد: <span className="font-bold">{selectedDriver.full_name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5">
              <label className="field-label">ملاحظات للسائق / التسليم</label>
              <textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={3}
                className="field-input resize-none"
                placeholder="مثال: اتصل قبل الوصول، أو سلّم الطلب من بوابة المزرعة..."
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                fullWidth
                loading={isAssigning}
                onClick={() =>
                  assignDelivery({
                    orderId: assignTarget.id,
                    delivery_mode: deliveryMode,
                    driver_id: deliveryMode === "driver" ? selectedDriverId : null,
                    notes: assignNotes,
                  })
                }
              >
                حفظ التعيين
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() =>
                  resetAssignState(setAssignTarget, setDriverSearch, setAssignNotes, setSelectedDriverId, setDeliveryMode)
                }
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
