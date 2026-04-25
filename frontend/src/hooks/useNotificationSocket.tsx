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
 * Reconnect: exponential back-off up to 30 s, unlimited retries.
 * Fallback: polls /notifications/unread-count/ every 30 s as safety net.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

/** Role-aware notification URL routing — uses recipient_role from data when available */
function getNotificationUrl(type: string, data: Record<string, unknown>, role?: UserRole): string {
  // Prefer explicit recipient_role stored in notification data; fall back to current user's role
  const recipientRole = (data.recipient_role as UserRole | undefined) ?? role;

  switch (type) {
    case "new_order":
      // Always sent to the farmer
      if (data.order_id) return `/farmer/orders/${data.order_id}`;
      return "/farmer/orders";

    case "order_status":
      // Sent to buyer for status updates, sent to farmer for delivery confirmation
      if (recipientRole === "farmer") {
        return data.order_id ? `/farmer/orders/${data.order_id}` : "/farmer/orders";
      }
      return data.order_id ? `/orders/${data.order_id}` : "/orders";

    case "low_stock":
      return "/farmer/inventory";

    case "payment":
      return "/farmer/wallet";

    case "review":
      if (data.order_id) {
        return recipientRole === "farmer"
          ? `/farmer/orders/${data.order_id}`
          : `/orders/${data.order_id}/review`;
      }
      return recipientRole === "farmer" ? "/farmer/orders" : "/orders";

    case "general": {
      if (data.assignment_id) return "/driver/dashboard";
      // Admin receives product or farmer approval notifications
      if (data.action === "product_approval") return "/admin/products?tab=pending";
      if (data.action === "farmer_approval") return "/admin/farmers?tab=pending";
      // Farmer receives product approved/rejected
      if (data.action === "product_approved" || data.action === "product_rejected")
        return "/farmer/products";
      // Farmer receives account approval — go to dashboard (already logged in)
      if (data.action === "farmer_approved") return "/farmer/dashboard";
      return "/";
    }

    default:
      return "/notifications";
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

const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS  = 30_000;

export function useNotificationSocket() {
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const wsRef       = useRef<WebSocket | null>(null);
  const retryRef    = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    if (!isAuthenticated) return;

    // ── Polling fallback: refresh notification count every 30 s ─────────
    pollRef.current = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["unread-count"] });
    }, 30_000);

    function showToast(
      notifType: string,
      notifData: Record<string, unknown>,
      title: string,
      body: string,
    ) {
      const targetUrl = getNotificationUrl(notifType, notifData, user?.role);
      const icon = typeIcons[notifType] ?? "🔔";

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
        { duration: 7000, style: { padding: "12px 14px", maxWidth: "360px", direction: "rtl" } },
      );
    }

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
            // 1. Invalidate caches for instant badge update
            qc.invalidateQueries({ queryKey: ["unread-count"] });
            qc.invalidateQueries({ queryKey: ["notifications"] });

            // 2. Invalidate related order queries so UI updates in real time
            const notifData = msg.notification.data ?? {};
            if (notifData.order_id) {
              qc.invalidateQueries({ queryKey: ["my-order", String(notifData.order_id)] });
              qc.invalidateQueries({ queryKey: ["my-orders"] });
              qc.invalidateQueries({ queryKey: ["farmer-order", String(notifData.order_id)] });
              qc.invalidateQueries({ queryKey: ["farmer-orders"] });
            }

            // 3. Show clickable toast
            showToast(
              msg.notification.type ?? "general",
              notifData,
              msg.notification.title ?? "إشعار جديد",
              msg.notification.body ?? "",
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
        // Unlimited retries with exponential back-off capped at 30 s
        const delay = Math.min(BASE_DELAY_MS * 2 ** Math.min(retryRef.current - 1, 10), MAX_DELAY_MS);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => { ws.close(); };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, user?.role, qc]);
}
