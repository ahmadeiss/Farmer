"""
Logistics models: delivery assignment workflow.
Supports assigning a system driver or marking the order as self-delivery.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class DeliveryAssignment(TimeStampedModel):
    """Tracks how an order leaves the farm and who is responsible for delivery."""

    class Status(models.TextChoices):
        UNASSIGNED = "unassigned", "غير مكلف"
        ASSIGNED = "assigned", "مكلف"
        PICKED_UP = "picked_up", "تم الاستلام من المزرعة"
        DELIVERED = "delivered", "تم التسليم"
        FAILED = "failed", "فشل التسليم"

    class DeliveryMode(models.TextChoices):
        DRIVER = "driver", "سائق من النظام"
        SELF_DELIVERY = "self_delivery", "توصيل ذاتي من المزرعة"

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="delivery_assignment",
        verbose_name="الطلب",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deliveries",
        limit_choices_to={"role": "driver"},
        verbose_name="السائق",
    )
    delivery_mode = models.CharField(
        max_length=20,
        choices=DeliveryMode.choices,
        default=DeliveryMode.DRIVER,
        verbose_name="طريقة التسليم",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNASSIGNED,
        verbose_name="الحالة",
    )
    pickup_time = models.DateTimeField(null=True, blank=True, verbose_name="وقت الاستلام")
    delivered_time = models.DateTimeField(null=True, blank=True, verbose_name="وقت التسليم")
    notes = models.TextField(blank=True, verbose_name="ملاحظات")

    class Meta:
        verbose_name = "مهمة توصيل"
        verbose_name_plural = "مهام التوصيل"
        ordering = ["-created_at"]

    def __str__(self):
        if self.delivery_mode == self.DeliveryMode.SELF_DELIVERY:
            carrier = "توصيل ذاتي"
        else:
            carrier = self.assigned_to.full_name if self.assigned_to else "غير مكلف"
        return f"توصيل الطلب #{self.order.id} -> {carrier}"

    @property
    def is_ready_for_dispatch(self):
        if self.delivery_mode == self.DeliveryMode.SELF_DELIVERY:
            return True
        return self.assigned_to_id is not None
