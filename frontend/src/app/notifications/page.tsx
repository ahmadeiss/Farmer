"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Notification, UserRole } from "@/types";

const typeIcons: Record<string, string> = {
  new_order:    "📦",
  order_status: "🔄",
  low_stock:    "⚠️",
  payment:      "💰",
  review:       "⭐",
  general:      "🔔",
};

const typeLabels: Record<string, string> = {
  new_order:    "طلب جديد",
  order_status: "تحديث الطلب",
  low_stock:    "تنبيه المخزون",
  payment:      "دفعة",
  review:       "تقييم",
  general:      "إشعار",
};

/** Resolve the deep-link URL from a notification's type + data + user role */
function getNotificationUrl(type: string, data: Record<string, unknown>, role?: UserRole): string {
  switch (type) {
    case "new_order":
      if (data.order_id) return `/farmer/orders/${data.order_id}`;
      return "/farmer/orders";
    case "order_status":
      if (data.order_id) return `/orders/${data.order_id}`;
      return role === "farmer" ? "/farmer/orders" : "/orders";
    case "low_stock":
      return "/farmer/inventory";
    case "payment":
      return "/farmer/wallet";
    case "review":
      if (data.order_id) return `/orders/${data.order_id}/review`;
      return role === "farmer" ? "/farmer/orders" : "/orders";
    case "general":
      if (data.assignment_id) return "/driver/dashboard";
      if (data.action === "farmer_approval") return "/admin/farmers?tab=pending";
      if (data.action === "farmer_approved") return "/login";
      return "/";
    default:
      return "/";
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications().then((r) => {
      const d = r.data;
      return d.results ?? d;
    }),
    refetchInterval: 30_000,
  });

  const { mutate: markAllRead, isPending } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  /** Mark as read then navigate to the relevant page */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead(notification.id);
    }
    const url = getNotificationUrl(notification.notification_type, notification.data, user?.role);
    router.push(url);
  };

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      <TopHeader />

      <main className="flex-1 page-container py-6 max-w-2xl buyer-page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-stone-400 mt-0.5">{unreadCount} غير مقروء</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" loading={isPending} onClick={() => markAllRead()}>
              تعليم الكل مقروءاً
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4 flex gap-3 animate-pulse">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" rounded="lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications?.length ? (
          <EmptyState
            icon="🔔"
            title="لا توجد إشعارات"
            description="ستظهر هنا التحديثات الخاصة بطلباتك ومنتجاتك"
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                className={cn(
                  "w-full text-start card p-4 transition-all duration-150 group",
                  "hover:shadow-card-hover active:scale-[0.99]",
                  !notification.is_read
                    ? "border-s-4 border-forest-400 bg-forest-50/50"
                    : "opacity-75 hover:opacity-100"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon with type-colored background */}
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-200 group-hover:scale-105",
                    !notification.is_read ? "bg-forest-100" : "bg-stone-100"
                  )}>
                    {typeIcons[notification.notification_type] || "🔔"}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Type label */}
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                      {typeLabels[notification.notification_type] || "إشعار"}
                    </p>

                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "font-semibold text-sm leading-snug",
                        notification.is_read ? "text-stone-600" : "text-stone-900"
                      )}>
                        {notification.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-forest-500 rounded-full" />
                        )}
                        {/* Navigation arrow */}
                        <svg
                          className="w-3.5 h-3.5 text-stone-300 group-hover:text-forest-500 transition-colors rotate-180"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-2xs text-stone-400 mt-1.5">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
