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

  const title = payload.title || "حصاد الذكي";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-72.png",
    tag: payload.tag || "hasaad-notification",
    // Replace older notification with the same tag instead of stacking
    renotify: false,
    // Keep notification visible until user interacts
    requireInteraction: false,
    // RTL direction for Arabic text
    dir: "rtl",
    lang: "ar",
    data: {
      url: payload.url || "/",
      notification_id: payload.data?.notification_id,
    },
    // Action buttons
    actions: [
      { action: "open", title: "عرض" },
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

  const targetUrl = event.notification.data?.url || "/";
  const origin = self.location.origin;
  const fullUrl = targetUrl.startsWith("http") ? targetUrl : origin + targetUrl;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If a tab is already open on this origin, focus + navigate it
        for (const client of windowClients) {
          if (client.url.startsWith(origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(fullUrl);
            }
            return;
          }
        }
        // No open tab → open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
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
