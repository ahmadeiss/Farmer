"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { cartApi } from "@/lib/api";

const BUYER_TABS = [
  { href: "/marketplace", label: "السوق", icon: BuyerMarketIcon },
  { href: "/cart", label: "السلة", icon: CartIcon },
  { href: "/orders", label: "طلباتي", icon: OrdersIcon },
  { href: "/profile", label: "حسابي", icon: ProfileIcon },
];

const FARMER_TABS = [
  { href: "/farmer/dashboard", label: "الرئيسية", icon: HomeIcon },
  { href: "/farmer/products", label: "منتجاتي", icon: ProductsIcon },
  { href: "/farmer/products/add", label: "إضافة", icon: AddIcon },
  { href: "/farmer/orders", label: "الطلبات", icon: OrdersIcon },
  { href: "/farmer/wallet", label: "المحفظة", icon: WalletIcon },
];

const ADMIN_TABS = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: HomeIcon },
  { href: "/admin/orders", label: "الطلبات", icon: OrdersIcon },
  { href: "/admin/wallets", label: "المحافظ", icon: WalletIcon },
  { href: "/admin/analytics", label: "التحليلات", icon: ChartIcon },
];

const DRIVER_TABS = [
  { href: "/driver/dashboard", label: "الرئيسية", icon: HomeIcon },
  { href: "/driver/dashboard?status=assigned", label: "جديدة", icon: OrdersIcon },
  { href: "/driver/dashboard?status=picked_up", label: "في الطريق", icon: TruckIcon },
  { href: "/profile", label: "حسابي", icon: ProfileIcon },
];

export function BuyerBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const isBuyer = isAuthenticated && user?.role === "buyer";

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
    staleTime: 30_000,
    enabled: isBuyer,
  });

  const cartCount = cart?.item_count ?? 0;

  return (
    <BottomNavShell>
      {BUYER_TABS.map((tab) => (
        <NavItem
          key={tab.href}
          href={tab.href}
          label={tab.label}
          icon={tab.icon}
          isActive={pathname === tab.href || (tab.href !== "/marketplace" && pathname.startsWith(tab.href))}
          badge={tab.href === "/cart" && cartCount > 0 ? cartCount : undefined}
        />
      ))}
    </BottomNavShell>
  );
}

export function FarmerBottomNav() {
  const pathname = usePathname();

  return (
    <BottomNavShell>
      {FARMER_TABS.map((tab) => (
        <NavItem
          key={tab.href}
          href={tab.href}
          label={tab.label}
          icon={tab.icon}
          isActive={
            tab.href === "/farmer/products/add"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href + "/")
          }
          highlight={tab.href === "/farmer/products/add"}
        />
      ))}
    </BottomNavShell>
  );
}

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <BottomNavShell>
      {ADMIN_TABS.map((tab) => (
        <NavItem
          key={tab.href}
          href={tab.href}
          label={tab.label}
          icon={tab.icon}
          isActive={pathname === tab.href || pathname.startsWith(tab.href + "/")}
        />
      ))}
    </BottomNavShell>
  );
}

export function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <BottomNavShell>
      {DRIVER_TABS.map((tab) => (
        <NavItem
          key={tab.href}
          href={tab.href}
          label={tab.label}
          icon={tab.icon}
          isActive={pathname === tab.href.split("?")[0]}
        />
      ))}
    </BottomNavShell>
  );
}

function BottomNavShell({ children }: { children: React.ReactNode }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-nav bg-white/95 backdrop-blur-sm
                 border-t border-surface-border safe-bottom"
      aria-label="التنقل الرئيسي"
    >
      <div className="flex items-stretch h-[4.25rem]">{children}</div>
    </nav>
  );
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  highlight?: boolean;
}

function NavItem({ href, label, icon: Icon, isActive, badge, highlight }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 pb-1",
        "transition-colors duration-150 relative min-w-0",
        highlight ? "text-white" : isActive ? "text-forest-600" : "text-stone-400 hover:text-stone-600"
      )}
    >
      {highlight ? (
        <div
          className="w-11 h-11 -mt-5 bg-forest-500 rounded-full flex items-center justify-center
                     shadow-forest text-white shadow-lg"
        >
          <Icon className="w-5 h-5" />
        </div>
      ) : (
        <div className="relative">
          <Icon className="w-5 h-5" />
          {badge !== undefined && badge > 0 && (
            <span
              className="absolute -top-1.5 -end-1.5 min-w-[1rem] h-4 px-0.5
                         bg-danger-500 text-white text-2xs font-bold rounded-full
                         flex items-center justify-center leading-none"
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>
      )}

      <span className={cn("text-2xs font-medium leading-none truncate max-w-full", highlight && "text-forest-600 mt-1")}>
        {label}
      </span>

      {isActive && !highlight && <span className="absolute bottom-0 inset-x-1/4 h-0.5 bg-forest-500 rounded-full" />}
    </Link>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function BuyerMarketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 7h11v10H3V7zm11 3h4l3 3v4h-7v-7zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z"
      />
    </svg>
  );
}
