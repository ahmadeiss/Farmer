"""
Django Channels WebSocket consumer for real-time notifications.
Connect to: ws://localhost:8000/ws/notifications/
Authentication via JWT token in query string.
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for user notifications.
    Each authenticated user joins their personal notification group.
    """

    async def connect(self):
        """Authenticate and join notification group."""
        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id = user.id
        self.group_name = f"notifications_{self.user_id}"

        # Join notification group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info(f"WebSocket connected: user={self.user_id}")

        # Send unread notification count on connect
        count = await self._get_unread_count()
        await self.send(text_data=json.dumps({
            "type": "connected",
            "unread_count": count,
        }))

    async def disconnect(self, close_code):
        """Leave notification group."""
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"WebSocket disconnected: user={getattr(self, 'user_id', 'unknown')}")

    async def receive(self, text_data):
        """Handle client messages (e.g., mark notifications read)."""
        try:
            data = json.loads(text_data)
            action = data.get("action")

            if action == "mark_read":
                notification_id = data.get("notification_id")
                if notification_id:
                    await self._mark_notification_read(notification_id)
                    await self.send(text_data=json.dumps({
                        "type": "marked_read",
                        "notification_id": notification_id,
                    }))

            elif action == "mark_all_read":
                count = await self._mark_all_read()
                await self.send(text_data=json.dumps({
                    "type": "all_marked_read",
                    "count": count,
                }))
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Invalid WebSocket message: {e}")

    async def notification_message(self, event):
        """Called when a notification is pushed to the group."""
        await self.send(text_data=json.dumps({
            "type": "notification",
            "notification": event["notification"],
        }))

    @database_sync_to_async
    def _get_unread_count(self):
        from apps.notifications.models import Notification
        return Notification.objects.filter(user_id=self.user_id, is_read=False).count()

    @database_sync_to_async
    def _mark_notification_read(self, notification_id: int):
        from apps.notifications.models import Notification
        Notification.objects.filter(id=notification_id, user_id=self.user_id).update(is_read=True)

    @database_sync_to_async
    def _mark_all_read(self):
        from apps.notifications.models import Notification
        return Notification.objects.filter(user_id=self.user_id, is_read=False).update(is_read=True)
