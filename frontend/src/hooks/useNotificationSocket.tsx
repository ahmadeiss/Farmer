"use client";

/**
 * useNotificationSocket
 *
 * Opens a persistent WebSocket connection to Django Channels for real-time
 * notifications. On receiving a new notification it:
 *   1. Invalidates React Query cache so the bell badge updates instantly.
 *   2. Shows a CLICKABLE toast that navigates to the relevant page.
 *
 * Auth: JWT access token sent as ?token= query param.
 * Reconnect: exponential back-off up to 30 s, stops after 5 failures.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

/** Notification type → frontend URL (mirrors backend push_service.py) */
function getNotificationUrl(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case "new_order":    return "/farmer/orders";
    case "order_status": return data.order_id ? `/orders/${data.order_id}` : "/orders";
    case "low_stock":    return "/farmer/inventory";
    case "payment":      return "/farmer/wallet";
    case "review":       return data.order_id ? `/orders/${data.order_id}/review` : "/orders";
    case "general":      return data.assignment_id ? "/driver/dashboard" : "/";
    default:             return "/notifications";
  }
}

const typeIcons: Record<string, string> = {
  new_order:    "📦",
  order_status: "🔄",
  low_stock:    "⚠️",
  payment:      "💰",
  review:       "⭐",
  general:      "🔔",
};

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws");

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export function useNotificationSocket() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const wsRef    = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    if (!isAuthenticated) return;

    function connect() {
      if (unmountedRef.current) return;
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) return;

      const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => { retryRef.current = 0; };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            notification?: {
              id?: number;
              title?: string;
              body?: string;
              type?: string;
              data?: Record<string, unknown>;
            };
          };

          if (msg.type === "notification" && msg.notification) {
            // 1. Refresh caches
            qc.invalidateQueries({ queryKey: ["unread-count"] });
            qc.invalidateQueries({ queryKey: ["notifications"] });

            // 2. Build deep-link URL
            const notifType = msg.notification.type ?? "general";
            const notifData = msg.notification.data ?? {};
            const targetUrl = getNotificationUrl(notifType, notifData);
            const icon      = typeIcons[notifType] ?? "🔔";
            const title     = msg.notification.title ?? "إشعار جديد";
            const body      = msg.notification.body  ?? "";

            // 3. Clickable JSX toast
            toast(
              (t) => (
                <button
                  className="w-full text-right"
                  style={{ all: "unset", cursor: "pointer", width: "100%", display: "block" }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = targetUrl;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", direction: "rtl" }}>
                    <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: "13px", margin: 0, color: "#1c1917" }}>{title}</p>
                      {body && (
                        <p style={{ fontSize: "12px", margin: "2px 0 0", color: "#78716c", whiteSpace: "normal" }}>
                          {body}
                        </p>
                      )}
                      <p style={{ fontSize: "10px", margin: "4px 0 0", color: "#1a9d65", fontWeight: 600 }}>
                        اضغط للعرض ←
                      </p>
                    </div>
                  </div>
                </button>
              ),
              {
                duration: 7000,
                style: { padding: "12px 14px", maxWidth: "360px", direction: "rtl" },
              },
            );

          } else if (msg.type === "connected") {
            qc.invalidateQueries({ queryKey: ["unread-count"] });
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (unmountedRef.current) return;
        retryRef.current += 1;
        if (retryRef.current > MAX_RETRIES) return;
        const delay = Math.min(BASE_DELAY_MS * 2 ** (retryRef.current - 1), 30_000);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, qc]);
}
