"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import { BuyerBottomNav } from "@/components/layout/MobileBottomNav";
import Footer from "@/components/layout/Footer";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { PaginatedResponse, Order, OrderStatus } from "@/types";

const STATUS_TABS = [
  { value: "",            label: "الكل"      },
  { value: "pending",     label: "معلقة"     },
  { value: "confirmed",   label: "مؤكدة"     },
  { value: "preparing",   label: "تحضير"     },
  { value: "out_for_delivery", label: "في الطريق" },
  { value: "delivered",   label: "مسلّمة"    },
  { value: "cancelled",   label: "ملغاة"     },
];

export default function MyOrdersPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["my-orders", statusFilter],
    queryFn: () =>
      ordersApi.getMyOrders(statusFilter ? { status: statusFilter } : {}).then((r) => r.data),
    enabled: !!user && user.role === "buyer",
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 buyer-page-content">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">طلباتي</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            تتبّع حالة طلباتك ومشترياتك السابقة
          </p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium
                          transition-all duration-150 shrink-0
                          ${statusFilter === s.value
                            ? "bg-forest-500 text-white shadow-sm"
                            : "bg-white text-stone-500 border border-surface-border hover:bg-stone-50"
                          }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : !data?.results?.length ? (
          <EmptyState
            icon="📦"
            title="لا توجد طلبات"
            description="ابدأ بالتسوق من السوق وستجد طلباتك هنا"
            actionLabel="تصفّح السوق"
            onAction={() => window.location.href = "/marketplace"}
          />
        ) : (
          <div className="space-y-4">
            {data.results.map((order) => (
              <div key={order.id}
                className="card p-5 hover:shadow-card-hover transition-all duration-200">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <span className="font-bold text-stone-900">طلب #{order.id}</span>
                      <StatusBadge status={order.status as OrderStatus} />
                    </div>
                    <p className="text-xs text-stone-400">
                      🌾 {order.farmer_name} · {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <PriceDisplay amount={order.total} size="md" />
                </div>

                {/* Items preview */}
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {order.items.slice(0, 4).map((item) => (
                    <span key={item.id}
                      className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                      {item.title_snapshot}
                    </span>
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-xs text-stone-400 px-1 py-1">
                      +{order.items.length - 4} أخرى
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm text-forest-600 hover:text-forest-700
                               font-semibold transition-colors"
                  >
                    عرض التفاصيل ←
                  </Link>
                  {order.status === "delivered" && (
                    <Link
                      href={`/orders/${order.id}/review`}
                      className="text-xs text-earth-600 hover:text-earth-700
                                 font-medium transition-colors"
                    >
                      ⭐ إضافة تقييم
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BuyerBottomNav />
    </div>
  );
}
