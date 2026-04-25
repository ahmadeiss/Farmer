"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { notificationsApi, authApi, cartApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Notification, Cart } from "@/types";
import { dashboardFor } from "@/hooks/useAuthGuard";

interface TopHeaderProps {
  className?: string;
}

export default function TopHeader({ className }: TopHeaderProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const { data: notifData } = useQuery<{ results: Notification[] }>({
    queryKey: ["notifications-preview"],
    queryFn: () => notificationsApi.getNotifications({ page_size: 8 }).then((r) => r.data),
    enabled: isAuthenticated && bellOpen,
  });

  const { data: cartData } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
    enabled: isAuthenticated && user?.role === "buyer",
    staleTime: 30_000,
  });
  const cartCount = cartData?.item_count ?? 0;

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-preview"] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      qc.invalidateQueries({ queryKey: ["notifications-preview"] });
    },
  });

  const unreadCount: number = unreadData?.unread_count ?? 0;
  const notifications: Notification[] = notifData?.results ?? [];

  // Determine logo link based on user role
  const logoHref = !isAuthenticated ? "/" : user?.role === "farmer" ? "/farmer/dashboard" : "/marketplace";

  const NOTIF_ICONS: Record<string, string> = {
    new_order: "🛒", order_status: "📦", low_stock: "⚠️",
    payment: "💰", review: "⭐", general: "🔔",
  };

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) await authApi.logout(refresh);
    } catch { /* ignore */ }
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-nav bg-white/95 backdrop-blur-sm border-b border-surface-border",
        className
      )}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2 group shrink-0" aria-label="حصاد">
            <Image
              src="https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
              alt="حصاد"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain bg-white"
            />
            <div className="hidden sm:block">
              <p className="font-extrabold text-stone-900 text-base leading-none">
                حصاد
              </p>
              <p className="text-2xs text-stone-400 leading-none mt-0.5">Hasaad</p>
            </div>
          </Link>

          {/* Nav links – desktop only */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/marketplace"
              className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600
                         hover:bg-stone-100 hover:text-stone-900 transition-colors">
              السوق
            </Link>
            {isAuthenticated && user?.role === "buyer" && (
              <Link href="/orders"
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600
                           hover:bg-stone-100 hover:text-stone-900 transition-colors">
                طلباتي
              </Link>
            )}
            {isAuthenticated && user?.role === "farmer" && (
              <Link href="/farmer/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600
                           hover:bg-stone-100 hover:text-stone-900 transition-colors">
                لوحة التحكم
              </Link>
            )}
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600
                           hover:bg-stone-100 hover:text-stone-900 transition-colors">
                الإدارة
              </Link>
            )}
            {isAuthenticated && user?.role === "driver" && (
              <Link href="/driver/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-600
                           hover:bg-stone-100 hover:text-stone-900 transition-colors">
                لوحة السائق
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {/* Cart icon – buyers only */}
                {user?.role === "buyer" && (
                  <Link
                    href="/cart"
                    className="relative p-2 rounded-lg text-stone-500 hover:bg-stone-100
                               hover:text-stone-700 transition-colors"
                    aria-label="السلة"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute top-1 end-1 min-w-[1.1rem] h-[1.1rem] px-0.5
                                       bg-forest-500 text-white text-2xs font-bold rounded-full
                                       flex items-center justify-center leading-none">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notifications bell + dropdown */}
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => setBellOpen((o) => !o)}
                    className="relative p-2 rounded-lg text-stone-500 hover:bg-stone-100
                               hover:text-stone-700 transition-colors"
                    aria-label="الإشعارات"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 end-1 min-w-[1.1rem] h-[1.1rem] px-0.5
                                       bg-danger-500 text-white text-2xs font-bold rounded-full
                                       flex items-center justify-center leading-none animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {bellOpen && (
                    <div className="absolute end-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80
                                    bg-white rounded-2xl shadow-xl border border-surface-border z-50
                                    animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between px-4 py-3
                                      border-b border-surface-border">
                        <p className="font-bold text-stone-900 text-sm">الإشعارات</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead()}
                            className="text-xs text-forest-600 hover:text-forest-700
                                       font-semibold transition-colors"
                          >
                            تحديد الكل مقروء
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-2xl mb-2">🔔</p>
                            <p className="text-sm text-stone-400">لا توجد إشعارات</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => { if (!n.is_read) markRead(n.id); }}
                              className={cn(
                                "w-full text-start px-4 py-3 flex gap-3 items-start",
                                "hover:bg-stone-50 transition-colors border-b border-surface-border last:border-0",
                                !n.is_read && "bg-forest-50/60"
                              )}
                            >
                              <span className="text-lg shrink-0 mt-0.5">
                                {NOTIF_ICONS[n.notification_type] ?? "🔔"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm leading-snug",
                                  !n.is_read ? "font-semibold text-stone-900" : "text-stone-700"
                                )}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {n.body}
                                </p>
                              </div>
                              {!n.is_read && (
                                <span className="w-2 h-2 bg-forest-500 rounded-full shrink-0 mt-1.5" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-surface-border">
                        <Link
                          href="/notifications"
                          onClick={() => setBellOpen(false)}
                          className="block text-center text-xs text-forest-600
                                     hover:text-forest-700 font-semibold transition-colors"
                        >
                          عرض كل الإشعارات
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── User avatar + menu (visible on ALL screen sizes) ─── */}
                <div ref={userMenuRef} className="relative mr-0.5">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-label="قائمة المستخدم"
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors",
                      "hover:bg-stone-100 active:bg-stone-200"
                    )}
                  >
                    {/* Avatar circle */}
                    <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center
                                    justify-center text-forest-700 font-bold text-sm shrink-0">
                      {user?.full_name?.[0] ?? "؟"}
                    </div>
                    {/* Name – visible only on sm+ */}
                    <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[100px] truncate">
                      {user?.full_name?.split(" ")[0]}
                    </span>
                    {/* Chevron – desktop only */}
                    <svg className="hidden sm:block w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute end-0 top-full mt-2 w-52
                                    bg-white rounded-2xl shadow-xl border border-surface-border z-50
                                    animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-surface-border bg-stone-50">
                        <p className="text-sm font-bold text-stone-900 truncate">{user?.full_name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {user?.role === "farmer" ? "🌾 مزارع" :
                           user?.role === "admin"  ? "🛠 مشرف" :
                           user?.role === "driver" ? "🚚 سائق" : "🛒 مشتري"}
                        </p>
                      </div>

                      {/* Dashboard link */}
                      <Link
                        href={dashboardFor(user?.role ?? "buyer")}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700
                                   hover:bg-stone-50 transition-colors"
                      >
                        <span className="text-base">🏠</span> لوحة التحكم
                      </Link>

                      {/* Profile link */}
                      <Link
                        href={user?.role === "farmer" ? "/farmer/profile" : "/profile"}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-stone-700
                                   hover:bg-stone-50 transition-colors"
                      >
                        <span className="text-base">👤</span> حسابي
                      </Link>

                      {/* Divider */}
                      <div className="h-px bg-surface-border mx-3" />

                      {/* Logout */}
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm
                                   text-danger-600 hover:bg-danger-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-stone-600
                             hover:text-stone-900 transition-colors rounded-lg hover:bg-stone-100">
                  دخول
                </Link>
                <Link href="/register"
                  className="px-4 py-1.5 text-sm font-semibold bg-forest-500 text-white
                             rounded-lg hover:bg-forest-600 transition-colors shadow-sm">
                  <span className="hidden sm:inline">إنشاء حساب</span>
                  <span className="sm:hidden">تسجيل</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
