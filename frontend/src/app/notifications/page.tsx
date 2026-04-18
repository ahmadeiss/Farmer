"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import TopHeader from "@/components/layout/TopHeader";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const typeIcons: Record<string, string> = {
  new_order: "📦",
  order_status: "🔄",
  low_stock: "⚠️",
  payment: "💰",
  review: "⭐",
  general: "🔔",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications().then((r) => {
      const d = r.data;
      return d.results ?? d;
    }),
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
                  "w-full text-start card p-4 transition-all duration-150",
                  "hover:shadow-card-hover",
                  !notification.is_read
                    ? "border-s-4 border-forest-400 bg-forest-50/40"
                    : "opacity-80"
                )}
                onClick={() => !notification.is_read && markRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center
                                  justify-center text-xl shrink-0">
                    {typeIcons[notification.notification_type] || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "font-semibold text-sm leading-snug",
                        notification.is_read ? "text-stone-600" : "text-stone-900"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-forest-500 rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
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
