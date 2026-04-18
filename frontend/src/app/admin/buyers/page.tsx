"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import type { BuyerProfile, PaginatedResponse } from "@/types";

export default function AdminBuyersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<BuyerProfile>>({
    queryKey: ["admin-buyers", search, page],
    queryFn: () => adminApi.getBuyers({ search: search || undefined, page }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="المشترون"
        subtitle={data ? `${data.count} حساب مشتري` : "عرض حسابات المشترين وعناوين التوصيل الافتراضية"}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchBar
          containerClassName="sm:max-w-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          placeholder="ابحث بالاسم أو الهاتف..."
        />
      </div>

      {!data?.results?.length && !isLoading ? (
        <EmptyState compact icon="🛒" title="لا يوجد مشترون" description="لا توجد نتائج مطابقة لهذا البحث." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>العنوان الافتراضي</th>
                  <th>ملاحظات التوصيل</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : (
                  data!.results.map((buyer) => (
                    <tr key={buyer.id}>
                      <td>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{buyer.full_name}</p>
                          <p className="text-xs text-stone-400">{buyer.user.email || "بدون بريد إلكتروني"}</p>
                        </div>
                      </td>
                      <td className="text-stone-500 dir-ltr">{buyer.phone}</td>
                      <td className="text-stone-600 max-w-[220px] truncate">{buyer.default_address || "غير محدد"}</td>
                      <td className="text-stone-600 max-w-[220px] truncate">{buyer.notes || "—"}</td>
                      <td>
                        {buyer.user.is_verified ? <Badge variant="green">موثّق</Badge> : <Badge variant="yellow">غير موثّق</Badge>}
                      </td>
                      <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(buyer.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-stone-400">
            <span>إجمالي: {data?.count ?? "—"} مشتري</span>
            {data && data.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.previous}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40 text-xs font-medium"
                >
                  →
                </button>
                <span className="tabular-nums">{data.current_page} / {data.total_pages}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40 text-xs font-medium"
                >
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
