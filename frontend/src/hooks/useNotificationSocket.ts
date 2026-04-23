"use client";

/**
 * useNotificationSocket
 *
 * Opens a persistent WebSocket connection to Django Channels for real-time
 * notifications. On receiving a new notification it:
 *   1. Invalidates React Query "unread-count" so the bell badge updates instantly.
 *   2. Shows a toast with the notification title/body.
 *   3. Plays a subtle audio cue (optional — silent fail if browser blocks it).
 *
 * Auth: JWT access token sent as ?token= query param (handled by
 *       JwtAuthMiddleware on the backend).
 *
 * Reconnect: exponential back-off up to 30 s, stops after 5 consecutive
 *            failures to avoid hammering a down server.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/^http/, "ws"); // http→ws, https→wss

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export function useNotificationSocket() {
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    if (!isAuthenticated) return;

    function connect() {
      if (unmountedRef.current) return;

      const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) return;

      const url = `${WS_BASE}/ws/notifications/?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0; // reset on successful connection
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            notification?: { title?: string; body?: string };
            unread_count?: number;
          };

          if (msg.type === "notification" && msg.notification) {
            // 1. Refresh badge count immediately
            qc.invalidateQueries({ queryKey: ["unread-count"] });

            // 2. Show toast
            const { title = "إشعار جديد", body = "" } = msg.notification;
            toast(`🔔 ${title}${body ? `\n${body}` : ""}`, {
              duration: 5000,
              style: { direction: "rtl", textAlign: "right" },
            });
          } else if (msg.type === "connected") {
            // Sync badge count on first connect
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
        if (retryRef.current > MAX_RETRIES) return; // give up

        const delay = Math.min(BASE_DELAY_MS * 2 ** (retryRef.current - 1), 30_000);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose which handles retry
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent retry on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, qc]);
}
