import { ReactNode } from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center
        ${compact ? "py-8 px-4" : "py-16 px-8"} ${className}`}
    >
      {/* Icon container */}
      <div
        className={`${compact ? "w-14 h-14 text-3xl" : "w-20 h-20 text-4xl"}
          rounded-2xl bg-stone-100 flex items-center justify-center mb-4
          text-stone-400`}
      >
        {icon}
      </div>

      <h3 className={`font-bold text-stone-700 mb-2
        ${compact ? "text-base" : "text-xl"}`}>
        {title}
      </h3>

      {description && (
        <p className={`text-stone-500 mb-6 max-w-xs leading-relaxed
          ${compact ? "text-sm" : "text-base"}`}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size={compact ? "sm" : "md"}
          variant="primary"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
