"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, extractApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";
import type { PaginatedResponse, ProductList } from "@/types";

type Tab = "all" | "pending";

export default function AdminProductsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<ProductList | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<ProductList>>({
    queryKey: ["admin-products", search, page],
    queryFn: () =>
      adminApi.getAdminProducts({ search: search || undefined, page }).then((r) => r.data),
    placeholderData: (prev) => prev,
    enabled: tab === "all",
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery<PaginatedResponse<ProductList>>({
    queryKey: ["admin-pending-products"],
    queryFn: () => adminApi.getPendingProducts().then((r) => r.data),
    refetchInterval: 30_000,
    // Always fetch so the badge count shows even before switching tabs
    staleTime: 60_000,
  });

  const { mutate: toggleVisibility, isPending: isToggling } = useMutation({
    mutationFn: (vars: { productId: number; isActive: boolean }) =>
      adminApi.toggleProductVisibility(vars.productId, vars.isActive),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("تم تحديث حالة المنتج"); },
    onError: () => toast.error("تعذّر تحديث المنتج"),
  });

  const { mutate: deleteProduct, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("تم حذف المنتج نهائياً 🗑️");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-products"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر حذف المنتج")),
  });

  const { mutate: approveProduct, isPending: isApproving } = useMutation({
    mutationFn: (id: number) => adminApi.approveProduct(id),
    onSuccess: () => {
      toast.success("✅ تمت الموافقة على المنتج ونُشر في السوق");
      qc.invalidateQueries({ queryKey: ["admin-pending-products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر الموافقة")),
  });

  const { mutate: rejectProduct, isPending: isRejecting } = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectProduct(id, reason),
    onSuccess: () => {
      toast.success("❌ تم رفض المنتج وإشعار المزارع");
      setRejectId(null); setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-pending-products"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر الرفض")),
  });

  const pendingCount = pendingData?.count ?? 0;

  const activeList = tab === "pending" ? (pendingData?.results ?? []) : (data?.results ?? []);
  const loading = tab === "pending" ? pendingLoading : isLoading;

  return (
    <DashboardShell role="admin">
      <PageHeader title="إدارة المنتجات" subtitle={`${data?.count ?? "—"} منتج في المنصة`} />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === "all" ? "bg-forest-600 text-white" : "bg-white border border-surface-border text-stone-600 hover:bg-stone-50"}`}>
          جميع المنتجات
        </button>
        <button onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${tab === "pending" ? "bg-amber-500 text-white" : "bg-white border border-surface-border text-stone-600 hover:bg-amber-50"}`}>
          بانتظار الموافقة
          {pendingCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "pending" ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>{pendingCount}</span>}
        </button>
      </div>

      {/* Search (all tab only) */}
      {tab === "all" && (
        <div className="flex gap-3 mb-5">
          <SearchBar containerClassName="sm:max-w-sm" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onClear={() => { setSearch(""); setPage(1); }}
            placeholder="ابحث باسم المنتج أو المزارع..." />
        </div>
      )}

      {tab === "pending" && pendingCount === 0 && !loading ? (
        <EmptyState compact icon="✅" title="لا توجد منتجات معلقة" description="جميع المنتجات تمت مراجعتها." />
      ) : !activeList.length && !loading && tab === "all" ? (
        <EmptyState compact icon="🌱" title="لا توجد منتجات" description="لم يتم العثور على نتائج مطابقة." />
      ) : (
        <div className="card overflow-hidden">
          {tab === "pending" && pendingCount > 0 && (
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
              <p className="text-sm font-semibold text-amber-800">⏳ {pendingCount} منتج بانتظار مراجعتك</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>المزارع</th>
                  <th>السعر</th>
                  <th>المخزون</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                  <th>تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />) : (
                  activeList.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <p className="font-semibold text-stone-900 truncate max-w-[180px]">{product.title}</p>
                        <p className="text-xs text-stone-400">{product.category_name}</p>
                      </td>
                      <td>
                        <p className="text-stone-700 text-sm">{product.farmer_name}</p>
                        {!product.farmer_is_verified && <Badge variant="yellow">غير موثق</Badge>}
                      </td>
                      <td className="font-semibold text-forest-700 tabular-nums">{formatCurrency(product.price)}</td>
                      <td className="text-stone-600 tabular-nums">{product.quantity_available} {product.unit_display}</td>
                      <td>
                        {!product.is_approved ? <Badge variant="yellow">معلق</Badge>
                          : product.is_active ? (product.is_in_stock ? <Badge variant="green">نشط</Badge> : <Badge variant="orange">نفد</Badge>)
                          : <Badge variant="gray">مخفي</Badge>}
                      </td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          {tab === "pending" ? (<>
                            <button onClick={() => approveProduct(product.id)} disabled={isApproving}
                              className="px-2.5 py-1 bg-forest-600 text-white text-xs font-semibold rounded-lg hover:bg-forest-700 disabled:opacity-50 transition-colors">✅ قبول</button>
                            <button onClick={() => { setRejectId(product.id); setRejectReason(""); }}
                              className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors">❌ رفض</button>
                          </>) : (<>
                            <button onClick={() => toggleVisibility({ productId: product.id, isActive: !product.is_active })} disabled={isToggling}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${product.is_active ? "bg-stone-100 text-stone-600 hover:bg-stone-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                              {product.is_active ? "إخفاء" : "إظهار"}
                            </button>
                            <button onClick={() => setEditProduct(product)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">✏️ تعديل</button>
                          </>)}
                          <button onClick={() => setDeleteId(product.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
                        </div>
                      </td>
                      <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(product.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {tab === "all" && data && (
            <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-stone-400">
              <span>إجمالي: {data.count} منتج</span>
              {data.total_pages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.previous}
                    className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40">→</button>
                  <span className="tabular-nums">{data.current_page} / {data.total_pages}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={!data.next}
                    className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40">←</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="text-5xl">🗑️</div>
            <h3 className="text-lg font-bold text-stone-900">حذف المنتج نهائياً؟</h3>
            <p className="text-sm text-stone-500">هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold hover:bg-stone-50">إلغاء</button>
              <button onClick={() => deleteProduct(deleteId!)} disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900">رفض المنتج</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض (اختياري)" rows={3}
              className="w-full border border-surface-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold">إلغاء</button>
              <button onClick={() => rejectProduct({ id: rejectId!, reason: rejectReason })} disabled={isRejecting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                {isRejecting ? "جارٍ الرفض..." : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

/* ── Edit Product Modal ───────────────────────────────────────────────────── */
function EditProductModal({ product, onClose, onSaved }: {
  product: ProductList; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(product.price);
  const [qty, setQty] = useState(product.quantity_available);
  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => adminApi.updateProduct(product.id, { title, price, quantity_available: qty, is_active: isActive, is_featured: isFeatured }),
    onSuccess: () => { toast.success("تم حفظ التعديلات ✅"); onSaved(); },
    onError: (err) => toast.error(extractApiError(err, "تعذّر الحفظ")),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-stone-900">✏️ تعديل المنتج</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">اسم المنتج</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">السعر</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">الكمية</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
                className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-forest-600" />
              <span>نشط</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-amber-500" />
              <span>مميز ⭐</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold hover:bg-stone-50">إلغاء</button>
          <button onClick={() => save()} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 disabled:opacity-50">
            {isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}
