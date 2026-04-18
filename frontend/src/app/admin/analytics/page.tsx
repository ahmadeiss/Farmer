"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAnalyticsPage() {
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["top-products"],
    queryFn: () => analyticsApi.getTopProducts(10).then((r) => r.data.results),
  });

  const { data: topFarmers, isLoading: farmersLoading } = useQuery({
    queryKey: ["top-farmers"],
    queryFn: () => analyticsApi.getTopFarmers(10).then((r) => r.data.results),
  });

  const { data: ordersByStatus } = useQuery({
    queryKey: ["orders-by-status"],
    queryFn: () => analyticsApi.getOrdersByStatus().then((r) => r.data),
  });

  const { data: revenueTrend } = useQuery({
    queryKey: ["revenue-trend-30"],
    queryFn: () => analyticsApi.getRevenueTrend(30).then((r) => r.data.results),
  });

  const statusLabels: Record<string, string> = {
    pending: "معلقة",
    confirmed: "مؤكدة",
    preparing: "تحضير",
    ready_for_pickup: "جاهزة",
    out_for_delivery: "في الطريق",
    delivered: "مسلّمة",
    cancelled: "ملغاة",
  };

  const BarSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-2 w-full" rounded="full" />
        </div>
      ))}
    </div>
  );

  return (
    <DashboardShell role="admin">
      <PageHeader title="التحليلات" subtitle="إحصائيات المنصة التفصيلية" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Orders by Status */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 mb-4">توزيع الطلبات حسب الحالة</h2>
          {!ordersByStatus ? <BarSkeleton /> : (
            <div className="space-y-3">
              {Object.entries(ordersByStatus).map(([status, count]) => {
                const total = Object.values(ordersByStatus).reduce(
                  (a: number, b: unknown) => a + (b as number), 0
                );
                const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-stone-600 font-medium">{statusLabels[status] || status}</span>
                      <span className="font-bold text-stone-800 tabular-nums">
                        {count as number} <span className="text-stone-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 mb-4">الإيرادات — آخر 30 يوم</h2>
          {!revenueTrend ? <BarSkeleton /> : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(revenueTrend as Array<{ date: string; revenue: number; orders: number }>)
                .slice(-15).reverse().map((day) => (
                  <div key={day.date}
                    className="flex items-center justify-between text-xs p-2.5
                               bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                    <span className="text-stone-500">
                      {new Date(day.date).toLocaleDateString("ar-PS", { day: "numeric", month: "short" })}
                    </span>
                    <span className="font-bold text-forest-600 tabular-nums">
                      {formatCurrency(day.revenue)}
                    </span>
                    <span className="text-stone-400">{day.orders} طلب</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 mb-4">🥇 أكثر المنتجات مبيعاً</h2>
          {productsLoading ? <BarSkeleton /> : (
            <div className="space-y-3">
              {(topProducts as Array<{ product_id: number; title_snapshot: string; total_quantity: number; order_count: number }>)
                ?.map((p, i) => (
                  <div key={p.product_id} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-earth-100 text-earth-700" : "bg-stone-100 text-stone-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{p.title_snapshot}</p>
                      <p className="text-2xs text-stone-400">{p.order_count} طلب</p>
                    </div>
                    <span className="text-sm font-bold text-forest-600 tabular-nums shrink-0">
                      {p.total_quantity} وحدة
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top Farmers */}
        <div className="card p-5">
          <h2 className="font-bold text-stone-900 mb-4">🏆 أفضل المزارعين</h2>
          {farmersLoading ? <BarSkeleton /> : (
            <div className="space-y-3">
              {(topFarmers as Array<{ farmer_id: number; farmer__full_name: string; total_revenue: number; order_count: number }>)
                ?.map((f, i) => (
                  <div key={f.farmer_id} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-forest-100 text-forest-700" : "bg-stone-100 text-stone-500"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{f.farmer__full_name}</p>
                      <p className="text-2xs text-stone-400">{f.order_count} طلب مكتمل</p>
                    </div>
                    <span className="text-sm font-bold text-forest-600 tabular-nums shrink-0">
                      {formatCurrency(f.total_revenue)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
