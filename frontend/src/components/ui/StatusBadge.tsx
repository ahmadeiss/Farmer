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
    <div className="w-full">
      <div className="flex items-center gap-0">
        {PROGRESS_STEPS.map((step, i) => {
          const cfg = STATUS_CONFIG[step];
          const isPast    = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture  = i > currentIndex;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    "transition-all duration-200",
                    isPast    && "bg-forest-500 text-white",
                    isCurrent && "bg-forest-500 text-white ring-4 ring-forest-500/20",
                    isFuture  && "bg-stone-200 text-stone-400",
                  )}
                >
                  {isPast ? "✓" : cfg.icon}
                </div>
                <span
                  className={cn(
                    "text-2xs text-center hidden sm:block max-w-[64px] leading-tight",
                    isCurrent && "text-forest-700 font-semibold",
                    !isCurrent && (isPast ? "text-stone-500" : "text-stone-400"),
                  )}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PROGRESS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 mb-5 transition-colors duration-200",
                    i < currentIndex ? "bg-forest-500" : "bg-stone-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
