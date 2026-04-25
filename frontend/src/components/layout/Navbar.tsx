"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { notificationsApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s
  });

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    logout();
    toast.success("تم تسجيل الخروج بنجاح");
    router.push("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "farmer") return "/farmer/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "driver") return "/driver/dashboard";
    return "/marketplace";
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🌾</span>
            <div>
              <p className="font-bold text-brand-700 leading-tight text-lg">حصاد</p>
              <p className="text-xs text-gray-400 leading-tight">Hasaad</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
              السوق
            </Link>
            {isAuthenticated && (
              <Link href={getDashboardLink()} className="text-gray-600 hover:text-brand-600 font-medium transition-colors">
                لوحة التحكم
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Cart (buyers only) */}
                {user?.role === "buyer" && (
                  <Link
                    href="/cart"
                    className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors"
                    aria-label="السلة"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </Link>
                )}

                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors"
                  aria-label="الإشعارات"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {(unreadData?.unread_count || 0) > 0 && (
                    <span className="absolute top-0 left-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadData.unread_count > 9 ? "9+" : unreadData.unread_count}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.full_name?.split(" ")[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    خروج
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors px-3 py-2"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm px-4 py-2"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
