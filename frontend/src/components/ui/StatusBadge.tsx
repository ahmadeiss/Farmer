import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

// ── Order status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: string; className: string }
> = {
  pending:          { label: "قيد الانتظار",   icon: "⏳", className: "badge-warning" },
  confirmed:        { label: "مؤكد",           icon: "✓",  className: "badge-info" },
  preparing:        { label: "قيد التحضير",    icon: "👨‍🍳", className: "badge-info" },
  ready_for_pickup: { label: "جاهز للتسليم",   icon: "📦", className: "badge-earth" },
  out_for_delivery: { label: "في الطريق",       icon: "🚚", className: "badge-earth" },
  delivered:        { label: "تم التسليم",      icon: "✓",  className: "badge-success" },
  cancelled:        { label: "ملغي",           icon: "✕",  className: "badge-danger" },
};

// ── Status progress bar steps ────────────────────────────────────────────
const PROGRESS_STEPS: OrderStatus[] = [
  "pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered",
];

interface StatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status, icon: "•", className: "badge-neutral",
  };

  const sizeClass = size === "sm" ? "badge-sm" : size === "lg" ? "badge-lg" : "badge";

  return (
    <span className={cn(sizeClass, config.className, className)}>
      {showIcon && (
        <span className="text-2xs leading-none" aria-hidden>
          {config.icon}
        </span>
      )}
      {config.label}
    </span>
  );
}

// ── Step descriptions (shown below tracker) ─────────────────────────────
const STEP_DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  pending:          "بانتظار تأكيد المزارع لطلبك",
  confirmed:        "المزارع تلقّى طلبك وسيبدأ التحضير",
  preparing:        "المزارع يجهّز منتجاتك الآن",
  ready_for_pickup: "الطلب جاهز وسيُرسل إليك قريباً",
  out_for_delivery: "طلبك في الطريق إليك الآن",
  delivered:        "تم التسليم بنجاح 🎉",
};

// ── Order progress timeline ──────────────────────────────────────────────
interface OrderProgressProps {
  status: OrderStatus;
}

export function OrderProgress({ status }: OrderProgressProps) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-lg border border-danger-100">
        <span>✕</span>
        <span className="font-medium">تم إلغاء الطلب</span>
      </div>
    );
  }

  const currentIndex = PROGRESS_STEPS.indexOf(status);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-0 min-w-[320px]">
        {PROGRESS_STEPS.map((step, i) => {
          const cfg     = STATUS_CONFIG[step];
          const isPast    = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture  = i > currentIndex;

          return (
            <div key={step} className="flex items-end flex-1 last:flex-none">
              {/* Step column: label → icon */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                {/* Label ABOVE the icon — always visible */}
                <span
                  className={cn(
                    "text-[10px] sm:text-2xs text-center leading-tight px-0.5",
                    "max-w-[56px] sm:max-w-[72px]",
                    isCurrent && "text-forest-700 font-bold",
                    isPast    && "text-stone-500 font-medium",
                    isFuture  && "text-stone-400",
                  )}
                >
                  {cfg.label}
                </span>

                {/* Icon circle */}
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center",
                    "text-sm font-bold transition-all duration-300",
                    isPast    && "bg-forest-500 text-white shadow-sm",
                    isCurrent && "bg-forest-500 text-white ring-4 ring-forest-500/20 shadow-md scale-110",
                    isFuture  && "bg-stone-100 text-stone-400 border-2 border-stone-200",
                  )}
                >
                  {isPast ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={isCurrent ? "animate-pulse" : ""}>{cfg.icon}</span>
                  )}
                </div>
              </div>

              {/* Connector line — aligns with the icon row */}
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="flex-1 flex items-center pb-4">
                  <div
                    className={cn(
                      "w-full h-0.5 transition-colors duration-300",
                      i < currentIndex ? "bg-forest-500" : "bg-stone-200",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <div className="mt-4 flex items-center gap-2 bg-forest-50 border border-forest-100 rounded-xl px-3 py-2.5">
        <span className="text-lg">{STATUS_CONFIG[status]?.icon}</span>
        <div>
          <p className="text-xs font-bold text-forest-800">{STATUS_CONFIG[status]?.label}</p>
          <p className="text-[11px] text-forest-600 mt-0.5">{STEP_DESCRIPTIONS[status] ?? ""}</p>
        </div>
      </div>
    </div>
  );
}
