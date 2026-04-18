"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Wallet } from "@/types";

export default function AdminWalletsPage() {
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: wallets, isLoading } = useQuery<Wallet[]>({
    queryKey: ["admin-wallets"],
    queryFn: () => adminApi.getWallets().then((r) => r.data),
  });

  const { register, handleSubmit, reset } = useForm<{ amount: string; note: string }>();

  const { mutate: settle, isPending } = useMutation({
    mutationFn: ({ farmerId, data }: { farmerId: number; data: object }) =>
      adminApi.settleWallet(farmerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets"] });
      toast.success("تمت التسوية بنجاح ✅");
      setShowSettleModal(false);
      reset();
    },
    onError: (err: unknown) => {
      const errorData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      toast.error(errorData?.error || "تعذّر إتمام التسوية");
    },
  });

  const onSettle = (data: { amount: string; note: string }) => {
    if (!selectedFarmerId) return;
    settle({ farmerId: selectedFarmerId, data });
  };

  const totalBalance = Array.isArray(wallets)
    ? wallets.reduce((sum, w) => sum + Number(w.current_balance), 0)
    : 0;
  const pendingCount = Array.isArray(wallets)
    ? wallets.filter((w) => Number(w.current_balance) > 0).length
    : 0;

  return (
    <DashboardShell role="admin">
      <PageHeader
        title="المحافظ والتسويات"
        subtitle="إدارة مدفوعات المزارعين وتسوية الأرصدة"
      />

      {/* Summary hero */}
      <div className="relative overflow-hidden rounded-2xl bg-forest-800 p-6 mb-6">
        <div className="absolute -top-6 -end-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-forest-200 text-sm mb-1">إجمالي الأرصدة المستحقة</p>
          <p className="text-5xl font-extrabold text-white tabular-nums">
            {totalBalance.toFixed(2)}
            <span className="text-2xl text-forest-300 font-semibold mr-2">₪</span>
          </p>
          {pendingCount > 0 && (
            <p className="text-forest-300 text-sm mt-2">
              {pendingCount} مزارع ينتظر التسوية
            </p>
          )}
        </div>
      </div>

      {/* Wallets table */}
      {isLoading ? (
        <div className="card p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !wallets?.length ? (
        <EmptyState compact icon="💰" title="لا توجد محافظ" description="لم يتم إنشاء أي محافظ بعد" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المزارع</th>
                  <th>الهاتف</th>
                  <th>الرصيد المستحق</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => {
                  const bal = Number(wallet.current_balance);
                  return (
                    <tr key={wallet.id}>
                      <td className="font-semibold text-stone-900">{wallet.farmer_name}</td>
                      <td className="font-mono text-xs text-stone-500 dir-ltr">
                        {wallet.farmer_phone}
                      </td>
                      <td>
                        <PriceDisplay
                          amount={wallet.current_balance}
                          size="sm"
                          variant={bal > 0 ? "primary" : "muted"}
                        />
                      </td>
                      <td>
                        {bal > 0 ? (
                          <Button
                            size="xs"
                            variant="earth"
                            onClick={() => {
                              setSelectedFarmerId(wallet.farmer);
                              setShowSettleModal(true);
                            }}
                          >
                            💵 تسوية
                          </Button>
                        ) : (
                          <span className="text-xs text-stone-300">مسوّى</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            onClick={() => { setShowSettleModal(false); reset(); }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-modal animate-scale-in">
            <h2 className="text-lg font-bold text-stone-900 mb-1">تسجيل تسوية نقدية</h2>
            <p className="text-sm text-stone-400 mb-5">
              سيتم تسجيل التسوية في سجل المزارع مباشرةً
            </p>
            <form onSubmit={handleSubmit(onSettle)} className="space-y-4">
              <div>
                <label className="field-label">المبلغ المدفوع (₪) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  className="field-input"
                  placeholder="0.00"
                  {...register("amount", { required: true })}
                />
              </div>
              <div>
                <label className="field-label">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="مثال: تسوية شهر أبريل"
                  {...register("note")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={isPending} fullWidth>
                  تأكيد التسوية
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => { setShowSettleModal(false); reset(); }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
