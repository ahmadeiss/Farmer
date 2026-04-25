import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "earth";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg " +
  "transition-all duration-150 focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-offset-2 active:scale-[0.96] active:brightness-95 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none touch-target";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-forest-500 text-white shadow-sm hover:bg-forest-600 active:bg-forest-700 " +
    "focus-visible:ring-forest-500",
  secondary:
    "bg-white border-2 border-forest-500 text-forest-600 hover:bg-forest-50 " +
    "active:bg-forest-100 focus-visible:ring-forest-500",
  ghost:
    "text-stone-600 hover:bg-stone-100 hover:text-stone-900 " +
    "focus-visible:ring-stone-400",
  outline:
    "bg-white border border-surface-border text-stone-700 hover:bg-stone-50 " +
    "hover:border-stone-300 focus-visible:ring-stone-400",
  danger:
    "bg-danger-500 text-white shadow-sm hover:bg-danger-600 active:bg-danger-700 " +
    "focus-visible:ring-danger-500",
  earth:
    "bg-earth-500 text-white shadow-sm hover:bg-earth-600 active:bg-earth-700 " +
    "focus-visible:ring-earth-500",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  xs: "px-2.5 py-1    text-xs  rounded-md gap-1",
  sm: "px-3.5 py-1.5  text-sm  rounded-md",
  md: "px-5   py-2.5  text-base",
  lg: "px-6   py-3    text-base",
  xl: "px-8   py-4    text-lg  rounded-xl",
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children,
      disabled, leftIcon, rightIcon, fullWidth, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);

Button.displayName = "Button";
export default Button;
