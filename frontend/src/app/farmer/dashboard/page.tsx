"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { analyticsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import StatsCard from "@/components/ui/StatsCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCardSkeleton } from "@/components/ui/Skeleton";

const QUICK_ACTIONS = [
  { label: "إضافة محصول جديد", icon: "🌱", href: "/farmer/products/add", highlight: true },
  { label: "الطلبات المعلقة",  icon: "⏳", href: "/farmer/orders?status=pending" },
  { label: "إدارة المخزون",    icon: "🏪", href: "/farmer/inventory" },
  { label: "المحفظة",          icon: "💰", href: "/farmer/wallet" },
];

const TIPS = [
  "أضف صورة واضحة لكل منتج — تزيد المبيعات حتى 3×",
  "حدّث الكمية المتاحة يومياً لتجنب إلغاء الطلبات",
  "أضف وصفاً صوتياً لمنتجك لتسهيل الوصول",
];

export default function FarmerDashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.full_name?.split(" ")[0] ?? "المزارع";

  const { data: summary, isLoading } = useQuery({
    queryKey: ["farmer-summary"],
    queryFn: () => analyticsApi.getFarmerSummary().then((r) => r.data),
  });

  return (
    <DashboardShell role="farmer">
      {/* Welcome */}
      <PageHeader
        title={`أهلاً، ${firstName} 👋`}
        subtitle="إليك ملخص نشاطك اليوم"
        size="md"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard title="طلبات مكتملة"  value={summary?.total_orders ?? 0}
              icon="📦" colorScheme="green" href="/farmer/orders?status=delivered" />
            <StatsCard title="إجمالي الأرباح" value={formatCurrency(summary?.total_revenue ?? 0)}
              icon="💰" colorScheme="earth" href="/farmer/wallet" />
            <StatsCard title="طلبات معلقة"   value={summary?.pending_orders ?? 0}
              icon="⏳" colorScheme="blue" href="/farmer/orders?status=pending" />
            <StatsCard title="جارية الآن"    value={summary?.in_progress_orders ?? 0}
              icon="🚚" colorScheme="purple" href="/farmer/orders" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold
                            transition-all duration-150 hover:shadow-sm active:scale-[0.98]
                            ${action.highlight
                              ? "bg-forest-500 text-white hover:bg-forest-600 col-span-2 sm:col-span-1"
                              : "bg-stone-50 text-stone-700 hover:bg-forest-50 hover:text-forest-700 border border-surface-border"
                            }`}
              >
                <span className="text-xl">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="card p-5">
          <h2 className="section-title mb-4">💡 نصائح</h2>
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-forest-100 text-forest-600 rounded-full
                                 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-600 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
