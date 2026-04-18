import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode | string;
  href?: string;
  trend?: { value: number; label: string };
  colorScheme?: "green" | "earth" | "blue" | "purple" | "red" | "stone";
  className?: string;
}

const colorSchemes = {
  green:  { icon: "bg-forest-100 text-forest-700", trend: "text-forest-600" },
  earth:  { icon: "bg-earth-100  text-earth-700",  trend: "text-earth-600"  },
  blue:   { icon: "bg-info-100   text-info-700",   trend: "text-info-600"   },
  purple: { icon: "bg-purple-100 text-purple-700", trend: "text-purple-600" },
  red:    { icon: "bg-danger-100 text-danger-700", trend: "text-danger-600" },
  stone:  { icon: "bg-stone-100  text-stone-600",  trend: "text-stone-500"  },
};

export default function StatsCard({
  title,
  value,
  icon,
  href,
  trend,
  colorScheme = "green",
  className,
}: StatsCardProps) {
  const cs = colorSchemes[colorScheme];

  const content = (
    <div className={cn("card p-5 space-y-3 transition-all duration-200", href && "hover:shadow-card-hover", className)}>
      {/* Icon */}
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl", cs.icon)}>
        {icon}
      </div>

      {/* Label */}
      <p className="text-sm text-stone-500 font-medium leading-none">{title}</p>

      {/* Value */}
      <p className="text-2xl font-extrabold text-stone-900 tabular-nums leading-none">
        {value}
      </p>

      {/* Trend */}
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs font-semibold", cs.trend)}>
          <span>{trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "→"}</span>
          <span>
            {Math.abs(trend.value)}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
