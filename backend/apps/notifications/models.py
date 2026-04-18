"""
Notification model: in-app notifications for all users.
Real-time delivery via Django Channels WebSocket.
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
