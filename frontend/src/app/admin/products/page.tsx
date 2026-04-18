"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import type { PaginatedResponse, ProductList } from "@/types";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<ProductList>>({
    queryKey: ["admin-products", search, page],
    queryFn: () =>
      adminApi.getAdminProducts({ search: search || undefined, page }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: toggleVisibility, isPending: isToggling } = useMutation({
    mutationFn: (vars: { productId: number; isActive: boolean }) =>
      adminApi.toggleProductVisibility(vars.productId, vars.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("تم تحديث حالة المنتج بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ في تحديث المنتج");
    },
  });

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="إدارة المنتجات"
        subtitle={data ? `${data.count} منتج في المنصة` : "مراجعة المنتجات النشطة والمخزون والمزارع المرتبط"}
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
          placeholder="ابحث باسم المنتج أو المزارع..."
        />
      </div>

      {!data?.results?.length && !isLoading ? (
        <EmptyState compact icon="🌱" title="لا توجد منتجات" description="لم يتم العثور على منتجات مطابقة لهذا البحث." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>المزارع</th>
                  <th>السعر</th>
                  <th>المخزون</th>
                  <th>الحالة</th>
                  <th>التحكم</th>
                  <th>تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : (
                  data!.results.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{product.title}</p>
                          <p className="text-xs text-stone-400">{product.category_name}</p>
                        </div>
                      </td>
                      <td className="text-stone-600">{product.farmer_name}</td>
                      <td className="font-semibold text-forest-700 tabular-nums">{formatCurrency(product.price)}</td>
                      <td className="text-stone-600 tabular-nums">
                        {product.quantity_available} {product.unit_display}
                      </td>
                      <td>
                        {product.is_active ? (
                          product.is_in_stock ? <Badge variant="green">نشط</Badge> : <Badge variant="orange">نفد المخزون</Badge>
                        ) : (
                          <Badge variant="gray">مخفي</Badge>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            toggleVisibility({
                              productId: product.id,
                              isActive: !product.is_active,
                            })
                          }
                          disabled={isToggling}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            product.is_active
                              ? "bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                              : "bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                          }`}
                        >
                          {product.is_active ? "إخفاء" : "إظهار"}
                        </button>
                      </td>
                      <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(product.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-stone-400">
            <span>إجمالي: {data?.count ?? "—"} منتج</span>
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
