"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/farmer/dashboard", icon: "📊", label: "لوحة التحكم" },
  { href: "/farmer/products", icon: "🌱", label: "منتجاتي" },
  { href: "/farmer/products/add", icon: "➕", label: "إضافة منتج" },
  { href: "/farmer/orders", icon: "📦", label: "الطلبات" },
  { href: "/farmer/inventory", icon: "🏪", label: "المخزون" },
  { href: "/farmer/wallet", icon: "💰", label: "المحفظة" },
  { href: "/farmer/profile", icon: "👤", label: "الملف الشخصي" },
];

export default function FarmerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-gray-100 shadow-sm min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <span className="text-xl">🌾</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">لوحة المزارع</p>
            <p className="text-xs text-gray-500">إدارة مزرعتك</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="mr-auto w-1.5 h-1.5 bg-brand-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
