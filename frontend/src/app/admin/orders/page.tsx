"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchBar from "@/components/ui/SearchBar";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { PaginatedResponse, Order, OrderStatus } from "@/types";

const STATUS_TABS = [
  { value: "",                 label: "الكل"         },
  { value: "pending",          label: "معلقة"         },
  { value: "confirmed",        label: "مؤكدة"         },
  { value: "preparing",        label: "تحضير"         },
  { value: "ready_for_pickup", label: "جاهزة"         },
  { value: "out_for_delivery", label: "في الطريق"     },
  { value: "delivered",        label: "مسلّمة"        },
  { value: "cancelled",        label: "ملغاة"         },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders", statusFilter, search, page],
    queryFn: () =>
      adminApi.getOrders({ status: statusFilter || undefined, search: search || undefined, page })
        .then((r) => r.data),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("تم تحديث الطلب ✓");
    },
    onError: (err: unknown) => {
      const e = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(e?.error || "تعذّر التحديث");
    },
  });

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="إدارة الطلبات"
        subtitle={data ? `${data.count} طلب إجمالي` : undefined}
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchBar
          containerClassName="sm:max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => { setSearch(""); setPage(1); }}
          placeholder="بحث بالاسم أو الهاتف..."
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
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

      {/* Table */}
      {!data?.results?.length && !isLoading ? (
        <EmptyState compact icon="📭" title="لا توجد طلبات بهذا الفلتر" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>المشتري</th>
                  <th>المزارع</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : (
                  data!.results.map((order) => (
                    <tr key={order.id}>
                      <td className="font-bold text-stone-900">#{order.id}</td>
                      <td className="text-stone-600 max-w-[120px] truncate">{order.buyer_name}</td>
                      <td className="text-stone-600 max-w-[120px] truncate">{order.farmer_name}</td>
                      <td className="font-semibold text-forest-600 tabular-nums">
                        {formatCurrency(order.total)}
                      </td>
                      <td>
                        <StatusBadge status={order.status as OrderStatus} size="sm" />
                      </td>
                      <td className="text-stone-400 text-xs whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td>
                        {order.status === "pending" && (
                          <Button
                            size="xs"
                            variant="danger"
                            loading={isPending}
                            onClick={() => updateStatus({ id: order.id, status: "cancelled" })}
                          >
                            إلغاء
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between
                          text-xs text-stone-400">
            <span>إجمالي: {data?.count ?? "—"} طلب</span>
            {data && data.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!data.previous}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50
                             disabled:opacity-40 text-xs font-medium">
                  →
                </button>
                <span className="tabular-nums">{data.current_page} / {data.total_pages}</span>
                <button onClick={() => setPage(p => p + 1)}
                  disabled={!data.next}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50
                             disabled:opacity-40 text-xs font-medium">
                  ←
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
