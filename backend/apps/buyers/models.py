"""
Buyer profile and subscription scaffold.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class BuyerProfile(TimeStampedModel):
    """Extended profile for buyers. Auto-created via signal."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="buyer_profile",
        verbose_name="المستخدم",
    )
    default_address = models.TextField(blank=True, verbose_name="العنوان الافتراضي")
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط العرض",
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط الطول",
    )
    notes = models.TextField(blank=True, verbose_name="ملاحظات التوصيل")

    class Meta:
        verbose_name = "ملف المشتري"
        verbose_name_plural = "ملفات المشترين"

    def __str__(self):
        return f"{self.user.full_name} ({self.user.phone})"

    @property
    def has_location(self):
        return self.latitude is not None and self.longitude is not None


class SubscriptionPlan(TimeStampedModel):
    """
    Subscription plan scaffold - for future 'weekly vegetable basket' feature.
    Not fully implemented in v1 but model is production-ready.
    """

    class Frequency(models.TextChoices):
        WEEKLY = "weekly", "أسبوعي"
        BIWEEKLY = "biweekly", "كل أسبوعين"
        MONTHLY = "monthly", "شهري"

    name_ar = models.CharField(max_length=200, verbose_name="اسم الخطة (عربي)")
    name_en = models.CharField(max_length=200, blank=True, verbose_name="اسم الخطة (إنجليزي)")
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="السعر")
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.WEEKLY)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "خطة الاشتراك"
        verbose_name_plural = "خطط الاشتراك"

    def __str__(self):
        return self.name_ar


class Subscription(TimeStampedModel):
    """
    Buyer subscription scaffold.
    TODO v2: implement full subscription management with recurring orders.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", "نشط"
        PAUSED = "paused", "متوقف مؤقتاً"
        CANCELLED = "cancelled", "ملغي"
        EXPIRED = "expired", "منتهي"

    buyer = models.ForeignKey(
        BuyerProfile, on_delete=models.CASCADE,
        related_name="subscriptions", verbose_name="المشتري",
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT,
        related_name="subscriptions", verbose_name="الخطة",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateField(verbose_name="تاريخ البدء")
    end_date = models.DateField(null=True, blank=True, verbose_name="تاريخ الانتهاء")
    delivery_address = models.TextField(verbose_name="عنوان التوصيل")

    class Meta:
        verbose_name = "اشتراك"
        verbose_name_plural = "الاشتراكات"

    def __str__(self):
        return f"{self.buyer.user.full_name} - {self.plan.name_ar}"
