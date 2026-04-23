"""
Notification service: creates notifications and pushes them via:
  1. Django Channels WebSocket (real-time, in-app)
  2. Web Push API (browser push, even when app is closed)

Both pushes are always non-blocking (daemon threads) so they never delay
the HTTP response even when Redis/Channels or push service is unavailable.
"""
import logging
import threading
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Central service for sending notifications.
    Creates DB record synchronously, then pushes to WebSocket + Web Push in daemon threads.
    """

    @staticmethod
    def notify_user(
        user, title: str, body: str,
        notification_type: str = "general",
        data: dict = None,
    ) -> Notification:
        """Create a notification (DB) and fire non-blocking WebSocket + Web Push."""
        notification = Notification.objects.create(
            user=user,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data or {},
        )
        # 1. WebSocket push (in-app real-time)
        NotificationService._push_async(user.id, notification)
        # 2. Web Push (browser, even when app is closed)
        NotificationService._push_web(user, notification)
        return notification

    @staticmethod
    def _push_async(user_id: int, notification: Notification):
        """Launch WebSocket push in a daemon thread (fire-and-forget)."""
        payload = {
            "id": notification.id,
            "title": notification.title,
            "body": notification.body,
            "type": notification.notification_type,
            "created_at": notification.created_at.isoformat(),
            "data": notification.data,
        }

        def _push():
            try:
                channel_layer = get_channel_layer()
                if channel_layer is None:
                    return
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{user_id}",
                    {"type": "notification_message", "notification": payload},
                )
                logger.debug(f"WS push sent to user {user_id}")
            except Exception as exc:
                # Redis down, channel layer unavailable, etc. — non-fatal.
                logger.warning(f"WS push failed for user {user_id}: {exc}")

        t = threading.Thread(target=_push, daemon=True)
        t.start()

    @staticmethod
    def _push_web(user, notification: Notification):
        """Send Web Push via pywebpush — non-blocking, never raises."""
        def _push():
            try:
                from .push_service import PushService
                PushService.send_push(user, notification)
            except Exception as exc:
                logger.warning("Web Push dispatch failed for user %s: %s", user.id, exc)

        t = threading.Thread(target=_push, daemon=True)
        t.start()
