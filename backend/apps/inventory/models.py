"""
Inventory movement tracking for products.
Every stock change is recorded for auditability.
"""
from django.db import models
from apps.common.models import TimeStampedModel


class InventoryMovement(TimeStampedModel):
    """
    Audit log of all inventory changes.
    Supports: add (farmer adds stock), adjust (correction), reserve (order placed),
              sold (order delivered), release (order cancelled).
    """

    class MovementType(models.TextChoices):
        ADD = "add", "إضافة مخزون"
        ADJUST = "adjust", "تعديل"
        RESERVE = "reserve", "حجز (طلب جديد)"
        SOLD = "sold", "مبيع (تم التسليم)"
        RELEASE = "release", "إلغاء الحجز"

    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="movements",
        verbose_name="المنتج",
    )
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        verbose_name="نوع الحركة",
        db_index=True,
    )
    quantity = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الكمية",
        help_text="Positive = incoming, Negative = outgoing",
    )
    quantity_before = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الكمية قبل",
    )
    quantity_after = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الكمية بعد",
    )
    reference_order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="inventory_movements",
        verbose_name="الطلب المرتبط",
    )
    note = models.CharField(max_length=500, blank=True, verbose_name="ملاحظة")

    class Meta:
        verbose_name = "حركة مخزون"
        verbose_name_plural = "حركات المخزون"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "-created_at"]),
            models.Index(fields=["movement_type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.get_movement_type_display()} | {self.product.title} | {self.quantity}"
