"use client";

import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { btn: "w-7 h-7 text-sm",   display: "w-10 text-sm",  wrapper: "rounded-md" },
  md: { btn: "w-9 h-9 text-base", display: "w-12 text-base",wrapper: "rounded-lg" },
  lg: { btn: "w-11 h-11 text-lg", display: "w-14 text-lg",  wrapper: "rounded-xl" },
};

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  unit,
  size = "md",
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const sc = sizeConfig[size];

  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  const btnBase = cn(
    "flex items-center justify-center font-bold text-stone-600 transition-all duration-150",
    "hover:bg-stone-100 active:bg-stone-200 active:scale-90",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    sc.btn
  );

  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "inline-flex items-center border border-surface-border bg-white overflow-hidden",
          sc.wrapper,
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= min}
          className={cn(btnBase, "border-l border-surface-border")}
          aria-label="تقليل الكمية"
        >
          −
        </button>

        <span
          className={cn(
            "tabular-nums font-semibold text-stone-900 text-center select-none",
            sc.display
          )}
        >
          {value}
        </span>

        <button
          type="button"
          onClick={increment}
          disabled={disabled || value >= max}
          className={cn(btnBase, "border-r border-surface-border")}
          aria-label="زيادة الكمية"
        >
          +
        </button>
      </div>

      {unit && (
        <span className="mr-2 text-sm text-stone-500 font-medium">{unit}</span>
      )}
    </div>
  );
}
