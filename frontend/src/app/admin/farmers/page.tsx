"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { adminApi, extractApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import type { FarmerProfile, PaginatedResponse, User } from "@/types";

type Tab = "all" | "pending";

export default function AdminFarmersPage() {
  return (
    <Suspense fallback={null}>
      <AdminFarmersContent />
    </Suspense>
  );
}

function AdminFarmersContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const qc = useQueryClient();

  // Sync tab from URL query param
  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t === "pending") setTab("pending");
  }, [searchParams]);

  // All approved farmers — only fetch when on "all" tab
  const { data, isLoading } = useQuery<PaginatedResponse<FarmerProfile>>({
    queryKey: ["admin-farmers", search, page],
    queryFn: () => adminApi.getFarmers({ search: search || undefined, page }).then((r) => r.data),
    placeholderData: (prev) => prev,
    enabled: tab === "all",
  });

  // Pending farmers — always fetch so badge count shows on the tab button
  const { data: pendingData, isLoading: pendingLoading } = useQuery<{ count: number; results: User[] }>({
    queryKey: ["admin-pending-farmers"],
    queryFn: () => adminApi.getPendingFarmers().then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 60_000,
  });

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (userId: number) => adminApi.approveFarmer(userId),
    onSuccess: (_, userId) => {
      toast.success("✅ تم تفعيل حساب المزارع بنجاح وتم إشعاره!");
      qc.invalidateQueries({ queryKey: ["admin-pending-farmers"] });
      qc.invalidateQueries({ queryKey: ["admin-farmers"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر تفعيل الحساب")),
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      adminApi.rejectFarmer(userId, reason),
    onSuccess: () => {
      toast.success("🗑️ تم رفض وحذف طلب التسجيل.");
      setRejectingId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-pending-farmers"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر رفض الطلب")),
  });

  const pendingCount = pendingData?.count ?? 0;

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="المزارعون"
        subtitle="إدارة حسابات المزارعين والموافقة على التسجيلات الجديدة"
      />

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            tab === "all"
              ? "bg-forest-600 text-white"
              : "bg-white border border-surface-border text-stone-600 hover:bg-stone-50"
          }`}
        >
          المزارعون المفعّلون
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === "pending"
              ? "bg-amber-500 text-white"
              : "bg-white border border-surface-border text-stone-600 hover:bg-amber-50"
          }`}
        >
          بانتظار الموافقة
          {pendingCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === "pending" ? "bg-white text-amber-600" : "bg-amber-500 text-white"
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Pending Tab ──────────────────────────────────────── */}
      {tab === "pending" && (
        <>
          {pendingLoading ? (
            <div className="card overflow-hidden">
              <table className="data-table"><tbody>{Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
            </div>
          ) : !pendingData?.results?.length ? (
            <EmptyState compact icon="✅" title="لا توجد طلبات معلقة" description="جميع طلبات التسجيل تمت مراجعتها." />
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-sm font-semibold text-amber-800">⏳ {pendingCount} طلب تسجيل بانتظار مراجعتك</p>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>الهاتف</th>
                      <th>تاريخ التسجيل</th>
                      <th>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingData.results.map((farmer) => (
                      <tr key={farmer.id}>
                        <td>
                          <p className="font-semibold text-stone-900">{farmer.full_name}</p>
                          <p className="text-xs text-stone-400">{farmer.email || "بدون بريد"}</p>
                        </td>
                        <td className="text-stone-500 dir-ltr">{farmer.phone}</td>
                        <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(farmer.created_at)}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => approve(farmer.id)}
                              disabled={approving}
                              className="px-3 py-1.5 bg-forest-600 text-white text-xs font-semibold rounded-lg hover:bg-forest-700 disabled:opacity-50 transition-colors"
                            >
                              ✅ قبول
                            </button>
                            <button
                              onClick={() => { setRejectingId(farmer.id); setRejectReason(""); }}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
                            >
                              ❌ رفض
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── All Farmers Tab ───────────────────────────────────── */}
      {tab === "all" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <SearchBar
              containerClassName="sm:max-w-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onClear={() => { setSearch(""); setPage(1); }}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
            />
          </div>

          {!data?.results?.length && !isLoading ? (
            <EmptyState compact icon="👨‍🌾" title="لا يوجد مزارعون" description="لا توجد نتائج مطابقة." />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>المزرعة</th>
                      <th>الموقع</th>
                      <th>الهاتف</th>
                      <th>الحالة</th>
                      <th>تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                      : data!.results.map((farmer) => (
                          <tr key={farmer.id}>
                            <td>
                              <p className="font-semibold text-stone-900 truncate">{farmer.full_name}</p>
                              <p className="text-xs text-stone-400">{farmer.user.email || "بدون بريد"}</p>
                            </td>
                            <td className="text-stone-600">{farmer.farm_name || "—"}</td>
                            <td className="text-stone-600">
                              {[farmer.governorate, farmer.city, farmer.village].filter(Boolean).join("، ") || "غير محدد"}
                            </td>
                            <td className="text-stone-500 dir-ltr">{farmer.phone}</td>
                            <td>
                              {farmer.user.is_verified
                                ? <Badge variant="green">موثّق</Badge>
                                : <Badge variant="yellow">بانتظار التوثيق</Badge>}
                            </td>
                            <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(farmer.created_at)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-stone-400">
                <span>إجمالي: {data?.count ?? "—"} مزارع</span>
                {data && data.total_pages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.previous}
                      className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40 text-xs font-medium">→</button>
                    <span className="tabular-nums">{data.current_page} / {data.total_pages}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={!data.next}
                      className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40 text-xs font-medium">←</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Reject Dialog ────────────────────────────────────── */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900">رفض طلب التسجيل</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض (اختياري)"
              className="w-full border border-surface-border rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
                إلغاء
              </button>
              <button
                onClick={() => reject({ userId: rejectingId, reason: rejectReason })}
                disabled={rejecting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {rejecting ? "جارٍ الرفض..." : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
