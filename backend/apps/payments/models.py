"""
Payment abstraction layer.
Currently CASH ONLY. Architecture is ready for Jawwal Pay / digital wallets.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class PaymentProvider(models.TextChoices):
    """
    Payment provider registry.
    Add new providers here without refactoring core order logic.
    """
    CASH = "cash", "نقداً"
    # Future providers - scaffold:
    # JAWWAL_PAY = "jawwal_pay", "جوال باي"
    # BANK_TRANSFER = "bank_transfer", "تحويل بنكي"
    # VISA = "visa", "فيزا / ماستر كارد"


class PaymentTransaction(TimeStampedModel):
    """
    Records payment events.
    Currently only cash is supported.
    Future: store digital payment gateway responses here.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "بانتظار الدفع"
        SUCCESS = "success", "تم الدفع"
        FAILED = "failed", "فشل"
        REFUNDED = "refunded", "مُستَرَدّ"

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="payment_transactions",
        verbose_name="الطلب",
    )
    provider = models.CharField(
        max_length=30, choices=PaymentProvider.choices,
        default=PaymentProvider.CASH, verbose_name="مزود الدفع",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.PENDING, verbose_name="الحالة",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="المبلغ")

    # For digital payment gateways (future):
    gateway_reference = models.CharField(max_length=200, blank=True)
    gateway_response = models.JSONField(null=True, blank=True)

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="recorded_payments", verbose_name="سُجِّل بواسطة",
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "معاملة مالية"
        verbose_name_plural = "المعاملات المالية"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_provider_display()} | {self.amount} | {self.get_status_display()}"
