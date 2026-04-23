"""
Notification model: in-app notifications for all users.
Real-time delivery via Django Channels WebSocket + Web Push.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Notification(TimeStampedModel):
    """
    In-app notification record.
    Created by services, delivered via WebSocket or API polling.
    """

    class Type(models.TextChoices):
        NEW_ORDER = "new_order", "طلب جديد"
        ORDER_STATUS = "order_status", "تحديث الطلب"
        LOW_STOCK = "low_stock", "مخزون منخفض"
        PAYMENT = "payment", "دفعة"
        GENERAL = "general", "عام"
        REVIEW = "review", "تقييم جديد"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="المستخدم",
    )
    title = models.CharField(max_length=200, verbose_name="العنوان")
    body = models.TextField(verbose_name="المحتوى")
    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.GENERAL,
        db_index=True,
        verbose_name="النوع",
    )
    is_read = models.BooleanField(default=False, db_index=True, verbose_name="مقروء")
    data = models.JSONField(null=True, blank=True, help_text="Extra payload for frontend")

    class Meta:
        verbose_name = "إشعار"
        verbose_name_plural = "الإشعارات"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.user.full_name}"


class PushSubscription(TimeStampedModel):
    """
    Browser Web Push subscription (one per browser/device per user).
    Stored when the user grants push notification permission.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
        verbose_name="المستخدم",
    )
    endpoint = models.CharField(
        max_length=2000,
        unique=True,
        verbose_name="Endpoint",
        help_text="Push service URL provided by the browser",
    )
    p256dh = models.CharField(
        max_length=512,
        verbose_name="p256dh Key",
        help_text="Browser public key for payload encryption",
    )
    auth = models.CharField(
        max_length=128,
        verbose_name="Auth Secret",
        help_text="Auth secret for payload encryption",
    )
    user_agent = models.CharField(
        max_length=500, blank=True, default="",
        verbose_name="User Agent",
    )
    is_active = models.BooleanField(
        default=True, db_index=True,
        verbose_name="نشط",
        help_text="Set to False when the push service returns 410 Gone",
    )

    class Meta:
        verbose_name = "اشتراك Push"
        verbose_name_plural = "اشتراكات Push"
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"PushSub({self.user.full_name} | {'✓' if self.is_active else '✗'})"
