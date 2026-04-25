"use client";

import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import DashboardShell from "@/components/layout/DashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Wallet, WalletLedgerEntry } from "@/types";

// ── Entry type config ─────────────────────────────────────────────────────
const ENTRY_CONFIG: Record<string, { label: string; sign: string; color: string; bg: string }> = {
  credit:     { label: "إيداع",      sign: "+", color: "text-forest-600",  bg: "bg-forest-50"  },
  debit:      { label: "خصم",        sign: "−", color: "text-danger-600",  bg: "bg-danger-50"  },
  hold:       { label: "حجز",        sign: "−", color: "text-warning-600", bg: "bg-warning-50" },
  release:    { label: "تحرير",      sign: "+", color: "text-info-600",    bg: "bg-info-50"    },
  settlement: { label: "تسوية",      sign: "✓", color: "text-stone-600",   bg: "bg-stone-100"  },
};

export default function FarmerWalletPage() {
  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["my-wallet"],
    queryFn: () => walletApi.getMyWallet().then((r) => r.data),
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery<WalletLedgerEntry[]>({
    queryKey: ["my-wallet-ledger"],
    queryFn: () => walletApi.getMyLedger().then((r) => r.data),
  });

  const balance = Number(wallet?.current_balance ?? 0);

  return (
    <DashboardShell role="farmer">
      <PageHeader title="المحفظة" subtitle="أرباحك ومعاملاتك المالية" />

      {/* ── Balance Hero Card ──────────────────────────────────────── */}
      {walletLoading ? (
        <Skeleton className="h-44 w-full rounded-2xl mb-6" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-forest-800">
          {/* Decorative circles */}
          <div className="absolute -top-8 -end-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -start-6 w-48 h-48 bg-white/5 rounded-full" />

          <div className="relative p-6 sm:p-8">
            <p className="text-forest-200 text-sm font-medium mb-2">رصيدك الحالي</p>
            <p className="text-5xl sm:text-6xl font-extrabold text-white tabular-nums mb-1">
              {balance.toFixed(2)}
              <span className="text-2xl text-forest-300 font-semibold mr-2">₪</span>
            </p>
            <p className="text-forest-300 text-sm mt-3">
              يُضاف إلى رصيدك تلقائياً عند تأكيد كل توصيل
            </p>

            {/* Info pill */}
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 text-forest-200
                            rounded-xl px-4 py-2.5 text-xs backdrop-blur-sm border border-white/10">
              <span className="text-base">💡</span>
              <span>
                لاستلام مدفوعاتك، تواصل مع إدارة حصاد.
                تتم التسوية يدوياً عبر المشرف.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Ledger ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900">سجل الحركات</h2>
            {ledger && (
              <p className="text-xs text-stone-400 mt-0.5">{ledger.length} معاملة</p>
            )}
          </div>
        </div>

        {ledgerLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <div className="space-y-1.5 text-end">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !ledger?.length ? (
          <EmptyState
            compact
            icon="📋"
            title="لا توجد معاملات بعد"
            description="ستظهر معاملاتك المالية هنا عند بدء البيع"
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {ledger.map((entry) => {
              const cfg = ENTRY_CONFIG[entry.entry_type] ?? {
                label: entry.entry_type, sign: "", color: "text-stone-700", bg: "bg-stone-50",
              };
              const isPositive = ["credit", "release"].includes(entry.entry_type);

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50/70
                             transition-colors duration-100"
                >
                  {/* Type icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
                    cfg.bg, cfg.color
                  )}>
                    {cfg.sign}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {entry.description || cfg.label}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-end shrink-0">
                    <p className={cn(
                      "font-bold tabular-nums",
                      isPositive ? "text-forest-600" : "text-danger-600"
                    )}>
                      {isPositive ? "+" : "−"}{formatCurrency(Math.abs(Number(entry.amount)))}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 tabular-nums">
                      رصيد: {formatCurrency(entry.balance_after)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
