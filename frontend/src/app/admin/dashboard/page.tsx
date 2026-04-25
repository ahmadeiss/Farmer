"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { analyticsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import StatsCard from "@/components/ui/StatsCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import type { OrderStatus } from "@/types";
import type { DashboardSummary } from "@/types";

const QUICK_ACTIONS = [
  { label: "إدارة الطلبات",     icon: "📦", href: "/admin/orders"    },
  { label: "تسويات المحافظ",    icon: "💰", href: "/admin/wallets"   },
  { label: "إدارة المنتجات",    icon: "🌱", href: "/admin/products"  },
  { label: "التحليلات المفصّلة", icon: "📈", href: "/admin/analytics" },
];

export default function AdminDashboardPage() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["admin-dashboard"],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: lowStock } = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: () => analyticsApi.getLowStock().then((r) => r.data.results),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () =>
      import("@/lib/api").then((m) =>
        m.adminApi.getOrders({ ordering: "-created_at", page_size: 5 }).then((r) => r.data.results)
      ),
  });

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="لوحة الإدارة 👑"
        subtitle="نظرة شاملة على منصة حصاد"
      />

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard title="إجمالي الطلبات"   value={summary?.orders.total ?? "—"}
              icon="📦" colorScheme="green" href="/admin/orders" />
            <StatsCard title="طلبات اليوم"       value={summary?.orders.today ?? "—"}
              icon="📅" colorScheme="blue" href="/admin/orders" />
            <StatsCard title="الإيرادات الكلية"  value={formatCurrency(summary?.revenue.total ?? 0)}
              icon="💰" colorScheme="earth" href="/admin/wallets" />
            <StatsCard title="إيرادات الشهر"     value={formatCurrency(summary?.revenue.this_month ?? 0)}
              icon="📈" colorScheme="purple" href="/admin/analytics" />
            <StatsCard title="المزارعون"          value={summary?.users.farmers ?? "—"}
              icon="🧑‍🌾" colorScheme="green" href="/admin/farmers" />
            <StatsCard title="المشترون"           value={summary?.users.buyers ?? "—"}
              icon="🛒" colorScheme="stone" href="/admin/buyers" />
            <StatsCard title="منتجات نشطة"       value={summary?.products.active ?? "—"}
              icon="🌱" colorScheme="green" href="/admin/products" />
            <StatsCard title="طلبات معلقة"        value={summary?.orders.pending ?? "—"}
              icon="⏳" colorScheme="red" href="/admin/orders?status=pending" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Recent Orders ──────────────────────────────────────── */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center">
            <h2 className="font-bold text-stone-900">آخر الطلبات</h2>
            <Link href="/admin/orders"
              className="text-xs text-forest-600 hover:text-forest-700 font-semibold transition-colors">
              عرض الكل ←
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>المشتري</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {!recentOrders ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
              ) : recentOrders.map((order: { id: number; buyer_name: string; total: number; status: OrderStatus }) => (
                <tr key={order.id}>
                  <td className="font-bold text-stone-700">#{order.id}</td>
                  <td className="text-stone-600">{order.buyer_name}</td>
                  <td className="font-semibold tabular-nums">{formatCurrency(order.total)}</td>
                  <td>
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Right Column ───────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Low stock alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-stone-900 text-sm">⚠️ تحذيرات المخزون</h2>
              <Link href="/admin/products"
                className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                الكل ←
              </Link>
            </div>
            {!lowStock?.length ? (
              <div className="text-center py-4">
                <p className="text-2xl">✅</p>
                <p className="text-xs text-stone-400 mt-1">لا توجد تحذيرات</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(lowStock as { id: number; title: string; quantity_available: string; unit: string; farmer__full_name: string }[])
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id}
                      className="flex items-center justify-between p-2.5 bg-danger-50
                                 rounded-lg border border-danger-100">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 text-xs truncate">{item.title}</p>
                        <p className="text-2xs text-stone-400">{item.farmer__full_name}</p>
                      </div>
                      <span className="text-danger-600 font-bold text-xs shrink-0 ms-2 tabular-nums">
                        {item.quantity_available} {item.unit}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="font-bold text-stone-900 text-sm mb-3">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl
                             bg-stone-50 hover:bg-forest-50 hover:text-forest-700
                             text-stone-600 transition-all duration-150
                             text-xs font-semibold text-center"
                >
                  <span className="text-xl">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
