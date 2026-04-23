"use client";
/**
 * usePushSubscription
 *
 * Handles the full Web Push lifecycle:
 *  1. Register the service worker (/sw.js)
 *  2. Check / request browser notification permission
 *  3. Subscribe to push via the PushManager (VAPID)
 *  4. Sync the subscription object with the backend
 *  5. Handle pushsubscriptionchange messages from the SW
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { pushApi } from "@/lib/api";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export interface UsePushSubscriptionReturn {
  /** Current browser notification permission */
  permission: PushPermission;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Whether any async operation is in progress */
  isLoading: boolean;
  /** Request permission and subscribe */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
}

/** Convert a base64url string to ArrayBuffer (required by PushManager.subscribe) */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i);
  }
  return buffer;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const swReg = useRef<ServiceWorkerRegistration | null>(null);

  const isPushSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // ── Register SW + check existing subscription on mount ──────────────────
  useEffect(() => {
    if (!isPushSupported) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermission);

    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        swReg.current = reg;

        const existingSub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existingSub);

        // Listen for pushsubscriptionchange messages from SW
        navigator.serviceWorker.addEventListener("message", async (event) => {
          if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
            const newSub: PushSubscriptionJSON = event.data.subscription;
            try {
              await pushApi.subscribe(newSub);
              setIsSubscribed(true);
            } catch {
              setIsSubscribed(false);
            }
          }
        });
      } catch (err) {
        console.warn("[Push] Service worker registration failed:", err);
      }
    };

    init();
  }, [isPushSupported]);

  // ── Subscribe ────────────────────────────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !swReg.current) return false;
    setIsLoading(true);
    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      if (result !== "granted") return false;

      // 2. Get VAPID public key from server
      let vapidKey: string;
      try {
        const { vapid_public_key } = await pushApi.getVapidPublicKey();
        vapidKey = vapid_public_key;
      } catch {
        // Fallback to env var (if set)
        vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
      }
      if (!vapidKey) {
        console.warn("[Push] No VAPID public key available");
        return false;
      }

      // 3. Subscribe in browser
      const sub = await swReg.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
      });

      // 4. Send to backend
      await pushApi.subscribe(sub.toJSON() as PushSubscriptionJSON);
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.warn("[Push] Subscribe failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isPushSupported]);

  // ── Unsubscribe ──────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!swReg.current) return;
    setIsLoading(true);
    try {
      const sub = await swReg.current.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.warn("[Push] Unsubscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
