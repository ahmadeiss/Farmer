"use client";

import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amount: string | number;
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "muted" | "highlight";
  className?: string;
  showCurrency?: boolean;
}

const sizeClasses = {
  sm: { amount: "text-base font-semibold", currency: "text-xs", unit: "text-xs" },
  md: { amount: "text-xl font-bold",       currency: "text-sm",  unit: "text-xs" },
  lg: { amount: "text-3xl font-extrabold", currency: "text-base",unit: "text-sm" },
  xl: { amount: "text-4xl font-extrabold", currency: "text-lg",  unit: "text-sm" },
};

const variantClasses = {
  primary:   "text-forest-600",
  muted:     "text-stone-500",
  highlight: "text-earth-600",
};

export default function PriceDisplay({
  amount,
  unit,
  size = "md",
  variant = "primary",
  className,
  showCurrency = true,
}: PriceDisplayProps) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = isNaN(num) ? "0.00" : num.toFixed(2);
  const sc = sizeClasses[size];
  const vc = variantClasses[variant];

  return (
    <div className={cn("flex items-baseline gap-1 tabular-nums", vc, className)}>
      <span className={sc.amount}>{formatted}</span>
      {showCurrency && (
        <span className={cn(sc.currency, "font-semibold opacity-80")}>₪</span>
      )}
      {unit && (
        <span className={cn(sc.unit, "text-stone-400 font-normal")}>/{unit}</span>
      )}
    </div>
  );
}
