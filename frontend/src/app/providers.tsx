"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import PushNotificationManager from "@/components/PushNotificationManager";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

/** Inner component so the hook can access the QueryClient from context. */
function NotificationSocketBridge() {
  useNotificationSocket();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            retryOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Real-time WebSocket: receives push notifications and refreshes badge count */}
      <NotificationSocketBridge />
      {/* Web Push Notification permission banner + silent auto-subscribe */}
      <PushNotificationManager />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "var(--font-cairo), IBM Plex Sans Arabic, sans-serif",
            direction: "rtl",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
