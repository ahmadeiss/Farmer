"""
Order models: Cart, CartItem, Order, OrderItem, Review.
The order lifecycle is the core business flow.
"""
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Cart(TimeStampedModel):
    """Active shopping cart. One cart per buyer (reused across sessions)."""

    buyer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
        limit_choices_to={"role": "buyer"},
        verbose_name="المشتري",
    )

    class Meta:
        verbose_name = "سلة التسوق"
        verbose_name_plural = "سلال التسوق"

    def __str__(self):
        return f"سلة {self.buyer.full_name}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def item_count(self):
        return self.items.count()


class CartItem(TimeStampedModel):
    """Item in a cart with price snapshot to avoid stale prices."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="cart_items",
        verbose_name="المنتج",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="الكمية")
    unit_price_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2,
        verbose_name="سعر الوحدة وقت الإضافة",
    )

    class Meta:
        verbose_name = "عنصر السلة"
        verbose_name_plural = "عناصر السلة"
        unique_together = ["cart", "product"]

    def __str__(self):
        return f"{self.product.title} x{self.quantity}"

    @property
    def subtotal(self):
        return self.quantity * self.unit_price_snapshot


class Order(TimeStampedModel):
    """
    Core order entity. Each order belongs to one buyer and one farmer.
    QR token enables delivery confirmation flow.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "قيد الانتظار"
        CONFIRMED = "confirmed", "تم التأكيد"
        PREPARING = "preparing", "قيد التحضير"
        READY = "ready_for_pickup", "جاهز للاستلام"
        OUT_FOR_DELIVERY = "out_for_delivery", "في الطريق"
        DELIVERED = "delivered", "تم التسليم"
        CANCELLED = "cancelled", "ملغي"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "الدفع عند الاستلام"
        # Future: JAWWAL_PAY = "jawwal_pay", "جوال باي"
        # Future: BANK = "bank", "تحويل بنكي"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "لم يُدفع"
        COLLECTED = "collected", "تم التحصيل"
        SETTLED = "settled", "تمت التسوية"

    # Parties
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="buyer_orders",
        limit_choices_to={"role": "buyer"},
        verbose_name="المشتري",
    )
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="farmer_orders",
        limit_choices_to={"role": "farmer"},
        verbose_name="المزارع",
    )

    # Status
    status = models.CharField(
        max_length=30, choices=Status.choices,
        default=Status.PENDING, db_index=True, verbose_name="الحالة",
    )
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices,
        default=PaymentMethod.CASH, verbose_name="طريقة الدفع",
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING, verbose_name="حالة الدفع",
    )

    # Financials
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="المجموع الفرعي")
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="الإجمالي")

    # Delivery
    delivery_address = models.TextField(verbose_name="عنوان التوصيل")
    delivery_governorate = models.CharField(max_length=50, blank=True, verbose_name="المحافظة")
    delivery_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط عرض التسليم",
    )
    delivery_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط طول التسليم",
    )
    notes = models.TextField(blank=True, verbose_name="ملاحظات")

    # QR delivery confirmation
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True, editable=False)
    qr_confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "طلب"
        verbose_name_plural = "الطلبات"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["farmer", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["qr_token"]),
        ]

    def __str__(self):
        return f"طلب #{self.id} | {self.buyer.full_name} → {self.farmer.full_name}"


class OrderItem(TimeStampedModel):
    """Snapshot of each product in an order."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="order_items", verbose_name="المنتج",
    )
    title_snapshot = models.CharField(max_length=300, verbose_name="اسم المنتج (وقت الطلب)")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20)

    class Meta:
        verbose_name = "عنصر الطلب"
        verbose_name_plural = "عناصر الطلب"

    def __str__(self):
        return f"{self.title_snapshot} x{self.quantity}"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class Review(TimeStampedModel):
    """Buyer review of a farmer after order delivery."""

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="review")
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="reviews_given", verbose_name="المشتري",
    )
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="reviews_received", verbose_name="المزارع",
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        verbose_name="التقييم",
    )
    comment = models.TextField(blank=True, verbose_name="التعليق")

    class Meta:
        verbose_name = "تقييم"
        verbose_name_plural = "التقييمات"

    def __str__(self):
        return f"تقييم {self.rating}/5 - {self.order}"
