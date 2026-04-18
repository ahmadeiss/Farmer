"""
Notification service: creates notifications and pushes them via Channels.
The WebSocket push is always non-blocking (daemon thread) so it never delays
the HTTP response even when Redis/Channels is unavailable.
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
    Creates DB record synchronously, then pushes to WebSocket in a daemon thread.
    """

    @staticmethod
    def notify_user(
        user, title: str, body: str,
        notification_type: str = "general",
        data: dict = None,
    ) -> Notification:
        """Create a notification (DB) and fire a non-blocking WebSocket push."""
        notification = Notification.objects.create(
            user=user,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data or {},
        )
        # Push in background — never blocks the HTTP request
        NotificationService._push_async(user.id, notification)
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
