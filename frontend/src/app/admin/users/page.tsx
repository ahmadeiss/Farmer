"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi, extractApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import type { User, UserRole } from "@/types";

const ROLES: UserRole[] = ["buyer", "farmer", "driver", "admin"];

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "مزارع",
  buyer: "مشترٍ",
  admin: "مسؤول",
  driver: "سائق",
};

const ROLE_COLORS: Record<UserRole, "green" | "blue" | "red" | "yellow"> = {
  farmer: "green",
  buyer: "blue",
  admin: "red",
  driver: "yellow",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{
    count: number; total_pages: number; current_page: number;
    next: boolean; previous: boolean; results: User[];
  }>({
    queryKey: ["admin-all-users", search, roleFilter, activeFilter, page],
    queryFn: () =>
      adminApi.getAllUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
        page,
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: toggleUser, isPending: toggling } = useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: "activate" | "deactivate" }) =>
      adminApi.toggleUser(userId, action),
    onSuccess: (res) => {
      const msg = (res.data as { message: string }).message;
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-farmers"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر تغيير حالة الحساب")),
  });

  const { mutate: deleteUser, isPending: deleting } = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("تم حذف المستخدم نهائياً 🗑️");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر حذف المستخدم")),
  });

  return (
    <DashboardShell role="admin">
      <PageHeader title="إدارة المستخدمين 👥" subtitle="عرض وتحكم بجميع حسابات المنصة" />

      {/* Top bar: filters + add button */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <SearchBar
          containerClassName="sm:max-w-xs"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          onClear={() => { setSearch(""); setPage(1); }}
          placeholder="ابحث بالاسم أو الهاتف..."
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ""); setPage(1); }}
          className="border border-surface-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400"
        >
          <option value="">كل الأدوار</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="border border-surface-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">معطّل</option>
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto px-4 py-2 bg-forest-600 text-white text-sm font-semibold rounded-xl hover:bg-forest-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span> إضافة مستخدم
        </button>
      </div>

      {!data?.results?.length && !isLoading ? (
        <EmptyState compact icon="👥" title="لا يوجد مستخدمون" description="لا توجد نتائج مطابقة." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>تاريخ التسجيل</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                  : data!.results.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <p className="font-semibold text-stone-900 truncate">{u.full_name}</p>
                          <p className="text-xs text-stone-400">{u.email || "—"}</p>
                        </td>
                        <td className="text-stone-500 dir-ltr">{u.phone}</td>
                        <td><Badge variant={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                        <td>
                          {u.is_active
                            ? <Badge variant="green">نشط</Badge>
                            : <Badge variant="yellow">معطّل</Badge>}
                        </td>
                        <td className="text-stone-400 text-xs whitespace-nowrap">{formatDate(u.created_at)}</td>
                        <td>
                          <div className="flex gap-1.5">
                            {u.role !== "admin" && (
                              <button
                                onClick={() => toggleUser({ userId: u.id, action: u.is_active ? "deactivate" : "activate" })}
                                disabled={toggling}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                  u.is_active
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-forest-100 text-forest-700 hover:bg-forest-200"
                                }`}
                              >
                                {u.is_active ? "تعطيل" : "تفعيل"}
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteId(u.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                              title="حذف الحساب نهائياً"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-stone-400">
            <span>إجمالي: {data?.count ?? "—"} مستخدم</span>
            {(data?.total_pages ?? 1) > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data?.previous}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40">→</button>
                <span className="tabular-nums">{data?.current_page} / {data?.total_pages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={!data?.next}
                  className="px-2 py-1 rounded border border-surface-border hover:bg-stone-50 disabled:opacity-40">←</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="text-5xl">🗑️</div>
            <h3 className="text-lg font-bold text-stone-900">حذف الحساب نهائياً؟</h3>
            <p className="text-sm text-stone-500">هذا الإجراء لا يمكن التراجع عنه. سيُحذف المستخدم وجميع بياناته.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold hover:bg-stone-50">إلغاء</button>
              <button onClick={() => deleteUser(deleteId!)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            qc.invalidateQueries({ queryKey: ["admin-all-users"] });
          }}
        />
      )}
    </DashboardShell>
  );
}

/* ── Add User Modal ─────────────────────────────────────────────────── */
function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: () =>
      adminApi.createUser({
        full_name: fullName,
        phone,
        email: email || undefined,
        role,
        password,
        password_confirm: confirmPassword,
      }),
    onSuccess: () => {
      toast.success(`✅ تم إنشاء حساب ${ROLE_LABELS[role]} بنجاح`);
      onCreated();
    },
    onError: (err) => toast.error(extractApiError(err, "تعذّر إنشاء الحساب")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    if (password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    createUser();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-stone-900 mb-4">➕ إضافة مستخدم جديد</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">الاسم الكامل *</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
              placeholder="أحمد محمد" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">رقم الهاتف *</label>
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr"
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
              placeholder="+970591234567" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">البريد الإلكتروني (اختياري)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr"
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
              placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">الدور *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">كلمة المرور *</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
                className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="••••••" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">تأكيد كلمة المرور *</label>
              <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} dir="ltr"
                className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="••••••" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-surface-border text-stone-600 text-sm font-semibold hover:bg-stone-50">إلغاء</button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 disabled:opacity-50">
              {isPending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
