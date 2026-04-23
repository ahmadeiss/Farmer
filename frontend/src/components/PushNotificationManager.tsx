"use client";
/**
 * PushNotificationManager
 *
 * Shown to authenticated users who haven't decided about push notifications yet.
 * A subtle, dismissible banner that slides in after a short delay.
 *
 * Behaviour:
 *  - Permission = "granted"  → silently subscribe, no UI
 *  - Permission = "default"  → show banner after 4 seconds (only once per session)
 *  - Permission = "denied"   → do nothing
 *  - Permission = "unsupported" → do nothing (old browser)
 */

import { useEffect, useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useAuthStore } from "@/store/authStore";

const DISMISSED_KEY = "hasaad-push-banner-dismissed";

export default function PushNotificationManager() {
  const { isAuthenticated } = useAuthStore();
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushSubscription();
  const [visible, setVisible] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Auto-subscribe silently if permission already granted
  useEffect(() => {
    if (permission === "granted" && !isSubscribed && !isLoading) {
      subscribe();
    }
  }, [permission, isSubscribed, isLoading, subscribe]);

  // Show banner after 4 s if permission not yet decided, user is logged in,
  // and the banner was not previously dismissed this session.
  useEffect(() => {
    if (
      !isAuthenticated ||
      permission !== "default" ||
      sessionStorage.getItem(DISMISSED_KEY)
    )
      return;

    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [isAuthenticated, permission]);

  const handleAllow = async () => {
    const ok = await subscribe();
    setIsDone(true);
    if (ok) {
      setTimeout(() => setVisible(false), 2500);
    } else {
      setTimeout(() => setVisible(false), 1500);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  // Nothing to render if not visible or irrelevant state
  if (!visible || permission === "denied" || permission === "unsupported") {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="طلب تفعيل الإشعارات"
      className={[
        // Positioning — bottom of screen, above mobile nav
        "fixed bottom-[5.5rem] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6",
        "sm:w-[360px] z-[60]",
        // Appear animation
        "transition-all duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      ].join(" ")}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-surface-border overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-forest-400 via-forest-500 to-leaf-500" />

        <div className="p-4">
          {isDone ? (
            // Success / Failure state
            <div className="flex items-center gap-3 py-1">
              <span className="text-2xl">{permission === "granted" ? "✅" : "👋"}</span>
              <p className="text-sm font-semibold text-stone-800">
                {permission === "granted"
                  ? "تم تفعيل الإشعارات بنجاح!"
                  : "يمكنك تفعيلها لاحقاً من إعدادات المتصفح"}
              </p>
            </div>
          ) : (
            // Prompt state
            <>
              <div className="flex items-start gap-3 mb-4">
                {/* Bell icon */}
                <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
                         6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6
                         8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4
                         17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 text-sm leading-snug">
                    ابقَ على اطّلاع دائماً 🔔
                  </p>
                  <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                    فعّل الإشعارات لتصلك تحديثات الطلبات والمنتجات فوراً —
                    حتى عندما تغلق الموقع.
                  </p>
                </div>

                {/* Close X */}
                <button
                  onClick={handleDismiss}
                  className="text-stone-300 hover:text-stone-500 transition-colors p-0.5 -mt-0.5 shrink-0"
                  aria-label="إغلاق"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleAllow}
                  disabled={isLoading}
                  className="flex-1 bg-forest-500 hover:bg-forest-600 disabled:opacity-60
                             text-white text-sm font-semibold py-2.5 px-4 rounded-xl
                             transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "تفعيل الإشعارات"
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-sm font-medium text-stone-500
                             hover:bg-stone-100 rounded-xl transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
