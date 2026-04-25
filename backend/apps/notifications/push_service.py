"""
Web Push Notification Service (VAPID).

Sends browser push notifications using pywebpush + VAPID.
Runs fire-and-forget in a daemon thread — never blocks HTTP responses.

Setup:
    1. pip install pywebpush
    2. python manage.py generate_vapid_keys
    3. Add VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_ADMIN_EMAIL to .env
"""
import json
import logging
import threading

from django.conf import settings

from .models import Notification, PushSubscription

logger = logging.getLogger(__name__)

# Notification type → frontend URL mapping
_URL_MAP = {
    "new_order":    lambda data: "/farmer/orders",
    "order_status": lambda data: f"/orders/{data['order_id']}" if data.get("order_id") else "/orders",
    "low_stock":    lambda data: "/farmer/inventory",
    "payment":      lambda data: "/farmer/wallet",
    "review":       lambda data: "/farmer/orders",
    "general":      lambda data: (
        "/driver/dashboard" if data.get("assignment_id") else "/"
    ),
}


def _get_url(notification: Notification) -> str:
    """Derive the target URL from notification type + data."""
    data = notification.data or {}
    handler = _URL_MAP.get(notification.notification_type)
    try:
        return handler(data) if handler else "/"
    except Exception:
        return "/"


def _send_to_subscription(sub: PushSubscription, payload: dict) -> bool:
    """
    Send a single Web Push. Returns True on success.
    Deactivates the subscription on 410 Gone (expired/unsubscribed).
    """
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed — skipping Web Push")
        return False

    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.debug("VAPID keys not configured — skipping Web Push")
        return False

    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"},
        )
        return True

    except Exception as exc:
        # Check for WebPushException with 410 Gone → subscription expired
        response = getattr(exc, "response", None)
        if response is not None and getattr(response, "status_code", None) == 410:
            logger.info("Push subscription expired (410), deactivating: %s", sub.id)
            PushSubscription.objects.filter(pk=sub.pk).update(is_active=False)
        else:
            logger.warning("Web Push failed for sub %s: %s", sub.id, exc)
        return False


class PushService:
    """
    Sends Web Push notifications to all active browser subscriptions for a user.
    Always non-blocking — runs in a daemon thread.
    """

    @staticmethod
    def send_push(user, notification: Notification) -> None:
        """Fire-and-forget: send push to all active subscriptions for this user."""
        # Use the Hasaad logo hosted on Cloudinary as the notification icon
        LOGO_URL = "https://res.cloudinary.com/dutilondd/image/upload/v1777122878/logo_hasaad_v8s05t.png"
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        payload = {
            "title": notification.title,
            "body": notification.body,
            "icon": LOGO_URL,
            "badge": LOGO_URL,
            "tag": f"hasaad-{notification.id}",
            "url": frontend_url + _get_url(notification),
            "data": {
                "notification_id": notification.id,
                "url": _get_url(notification),
            },
        }

        def _worker():
            subscriptions = list(
                PushSubscription.objects.filter(user=user, is_active=True)
            )
            if not subscriptions:
                return
            sent = 0
            for sub in subscriptions:
                if _send_to_subscription(sub, payload):
                    sent += 1
            if sent:
                logger.debug("Web Push sent to %d device(s) for user %s", sent, user.id)

        t = threading.Thread(target=_worker, daemon=True)
        t.start()
