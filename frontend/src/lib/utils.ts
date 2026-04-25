import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} ₪`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ar-PS", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("ar-PS", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    preparing: "bg-purple-100 text-purple-800 border-purple-200",
    ready_for_pickup: "bg-indigo-100 text-indigo-800 border-indigo-200",
    out_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getOrderStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    preparing: "👨‍🍳",
    ready_for_pickup: "📦",
    out_for_delivery: "🚚",
    delivered: "🎉",
    cancelled: "❌",
  };
  return icons[status] || "📋";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export const HASAAD_LOGO_URL =
  "https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png";

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return HASAAD_LOGO_URL;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`;
}
