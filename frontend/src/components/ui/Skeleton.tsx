import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
  animated?: boolean;
}

export function Skeleton({ className, rounded = "md", animated = true }: SkeletonProps) {
  const roundedClass = {
    sm:   "rounded",
    md:   "rounded-md",
    lg:   "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "bg-stone-200",
        animated && "animate-shimmer",
        roundedClass,
        className
      )}
      style={animated ? {
        background: "linear-gradient(90deg, #e8e4e0 25%, #d9d3cd 50%, #e8e4e0 75%)",
        backgroundSize: "200% 100%",
      } : undefined}
      aria-hidden="true"
    />
  );
}

// ── Preset skeleton layouts ──────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="card" aria-hidden>
      <div className="relative aspect-[4/3] bg-stone-200 animate-shimmer" 
           style={{ background: "linear-gradient(90deg, #e8e4e0 25%, #d9d3cd 50%, #e8e4e0 75%)", backgroundSize: "200% 100%" }} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-16" rounded="md" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3" aria-hidden>
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="border-t border-surface-border pt-3 flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" rounded="md" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3" aria-hidden>
      <Skeleton className="h-10 w-10" rounded="lg" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={`h-4 ${i === 0 ? "w-8" : "w-full"}`} />
        </td>
      ))}
    </tr>
  );
}
