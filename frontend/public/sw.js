/**
 * حصاد الذكي — Service Worker
 * Handles Web Push notifications (receive + display + click navigation).
 * Scope: entire domain (/), served with Service-Worker-Allowed: /
 */

const CACHE_NAME = "hasaad-sw-v1";

// ── Lifecycle ──────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open clients immediately
  event.waitUntil(self.clients.claim());
});

// ── Push event: show notification ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "حصاد الذكي",
      body: event.data.text() || "لديك إشعار جديد",
      url: "/",
    };
  }

  const title = payload.title || "حصاد";
  // Resolve the target URL: backend sends full URL in payload.url
  // and the relative path in payload.data.url
  const targetUrl = payload.url || payload.data?.url || "/notifications";

  const options = {
    body: payload.body || "",
    icon: payload.icon || "https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png",
    badge: payload.badge || "https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png",
    tag: payload.tag || "hasaad-notification",
    renotify: false,
    requireInteraction: true,   // stay visible until user acts (important for mobile)
    dir: "rtl",
    lang: "ar",
    data: {
      url: targetUrl,
      notification_id: payload.data?.notification_id,
    },
    actions: [
      { action: "open",    title: "عرض الآن" },
      { action: "dismiss", title: "إغلاق" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification click: navigate to the right page ────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/notifications";
  const origin    = self.location.origin;
  const fullUrl   = targetUrl.startsWith("http") ? targetUrl : origin + targetUrl;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Prefer a tab already open on this origin
        const existing = windowClients.find((c) => c.url.startsWith(origin));
        if (existing) {
          // focus() returns a promise resolving to the focused WindowClient
          return existing.focus().then((focused) => {
            // navigate() moves the focused tab to the target URL
            if (focused && "navigate" in focused) {
              return focused.navigate(fullUrl);
            }
          });
        }
        // No open tab → open a new window
        return self.clients.openWindow(fullUrl);
      })
  );
});

// ── Push subscription change (browser rotated keys) ───────────────────────

self.addEventListener("pushsubscriptionchange", (event) => {
  // Re-subscribe and sync new subscription with backend
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
      })
      .then((newSub) => {
        // Post message to client so it can re-register with the backend
        return self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PUSH_SUBSCRIPTION_CHANGED",
              subscription: JSON.parse(JSON.stringify(newSub)),
            });
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] pushsubscriptionchange resubscribe failed:", err);
      })
  );
});
