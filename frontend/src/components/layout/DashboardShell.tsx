"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import TopHeader from "./TopHeader";
import { FarmerBottomNav, AdminBottomNav } from "./MobileBottomNav";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const FARMER_NAV = [
  { href: "/farmer/dashboard", label: "الرئيسية", icon: "◉" },
  { href: "/farmer/products", label: "منتجاتي", icon: "🌱" },
  { href: "/farmer/products/add", label: "إضافة محصول", icon: "＋", highlight: true },
  { href: "/farmer/orders", label: "الطلبات", icon: "📦" },
  { href: "/farmer/inventory", label: "المخزون", icon: "📥" },
  { href: "/farmer/wallet", label: "المحفظة", icon: "💰" },
  { href: "/farmer/profile", label: "حسابي", icon: "👤" },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: "◉" },
  { href: "/admin/orders", label: "الطلبات", icon: "📦" },
  { href: "/admin/products", label: "المنتجات", icon: "🌱" },
  { href: "/admin/farmers", label: "المزارعون", icon: "👨‍🌾" },
  { href: "/admin/buyers", label: "المشترون", icon: "🛒" },
  { href: "/admin/wallets", label: "المحافظ", icon: "💰" },
  { href: "/admin/analytics", label: "التحليلات", icon: "📈" },
];

interface DashboardShellProps {
  children: ReactNode;
  role: "farmer" | "admin";
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  const nav = role === "farmer" ? FARMER_NAV : ADMIN_NAV;
  const BottomNav = role === "farmer" ? FarmerBottomNav : AdminBottomNav;
  const roleLabel = role === "farmer" ? "المزارع" : "المشرف";

  // ── Auth Guard ─────────────────────────────────────────────────────────────
  const { isReady } = useAuthGuard(role);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-surface-warm flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-400">جارٍ التحقق...</p>
        </div>
      </div>
    );
  }
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-warm flex flex-col">
      <TopHeader />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="hidden md:flex md:w-56 lg:w-60 flex-col bg-white border-l border-surface-border
                     shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto"
        >
          <div className="p-4 border-b border-surface-border">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-lg",
                  role === "farmer" ? "bg-forest-100 text-forest-700" : "bg-purple-100 text-purple-700"
                )}
              >
                {role === "farmer" ? "🌾" : "🛠"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900">{roleLabel}</p>
                <p className="text-2xs text-stone-400">Hasaad</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {nav.map((item) => (
              <SidebarItem key={item.href} item={item} role={role} />
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto md:pb-0 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
          <div className="page-container py-4 sm:py-6">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function SidebarItem({
  item,
  role,
}: {
  item: (typeof FARMER_NAV)[0];
  role: "farmer" | "admin";
}) {
  const pathname = usePathname();
  const isActive =
    item.href.endsWith("/add")
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  if (item.highlight) {
    return (
      <Link
        href={item.href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg my-2
                   bg-forest-500 text-white hover:bg-forest-600
                   transition-colors duration-150 font-semibold text-sm shadow-sm"
      >
        <span className="text-base leading-none w-5 text-center">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "transition-colors duration-150 text-sm font-medium",
        isActive
          ? role === "farmer"
            ? "bg-forest-50 text-forest-700 font-semibold"
            : "bg-purple-50 text-purple-700 font-semibold"
          : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
      )}
    >
      <span className="text-base leading-none w-5 text-center">{item.icon}</span>
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            role === "farmer" ? "bg-forest-500" : "bg-purple-500"
          )}
        />
      )}
    </Link>
  );
}
