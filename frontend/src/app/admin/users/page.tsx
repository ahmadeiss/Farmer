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
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ count: number; results: User[] }>({
    queryKey: ["admin-all-users", search, roleFilter, activeFilter],
    queryFn: () =>
      adminApi.getAllUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
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

  return (
    <DashboardShell role="admin">
      <PageHeader title="إدارة المستخدمين 👥" subtitle="عرض وتحكم بجميع حسابات المنصة" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBar
          containerClassName="sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="ابحث بالاسم أو الهاتف..."
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          className="border border-surface-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400"
        >
          <option value="">كل الأدوار</option>
          <option value="farmer">مزارع</option>
          <option value="buyer">مشترٍ</option>
          <option value="driver">سائق</option>
          <option value="admin">مسؤول</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as "" | "true" | "false")}
          className="border border-surface-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400"
        >
          <option value="">كل الحالات</option>
          <option value="true">نشط</option>
          <option value="false">معطّل</option>
        </select>
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
                  <th>إجراء</th>
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
                          {u.role !== "admin" && (
                            <button
                              onClick={() => toggleUser({ userId: u.id, action: u.is_active ? "deactivate" : "activate" })}
                              disabled={toggling}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                u.is_active
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-forest-100 text-forest-700 hover:bg-forest-200"
                              }`}
                            >
                              {u.is_active ? "تعطيل" : "تفعيل"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-surface-border text-xs text-stone-400">
            إجمالي: {data?.count ?? "—"} مستخدم
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
