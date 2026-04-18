"""
Farmer profile and extended farm information.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class FarmerProfile(TimeStampedModel):
    """Extended profile for farmers. Auto-created via signal after registration."""

    class PayoutMethod(models.TextChoices):
        CASH = "cash", "نقداً"
        BANK = "bank", "تحويل بنكي"
        WALLET = "wallet", "محفظة إلكترونية"  # Future

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farmer_profile",
        verbose_name="المستخدم",
    )
    farm_name = models.CharField(max_length=200, blank=True, verbose_name="اسم المزرعة")
    governorate = models.CharField(max_length=100, blank=True, verbose_name="المحافظة")
    city = models.CharField(max_length=100, blank=True, verbose_name="المدينة")
    village = models.CharField(max_length=100, blank=True, verbose_name="القرية")
    address = models.TextField(blank=True, verbose_name="العنوان التفصيلي")

    # Geolocation scaffold - ready for map integration
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط العرض",
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        verbose_name="خط الطول",
    )

    bio = models.TextField(blank=True, verbose_name="نبذة عن المزرعة")
    avatar = models.ImageField(
        upload_to="farmers/avatars/", null=True, blank=True,
        verbose_name="الصورة الشخصية",
    )
    preferred_payout_method = models.CharField(
        max_length=20,
        choices=PayoutMethod.choices,
        default=PayoutMethod.CASH,
        verbose_name="طريقة الصرف المفضلة",
    )

    # Bank details scaffold (future payout integration)
    bank_account_name = models.CharField(max_length=200, blank=True)
    bank_account_number = models.CharField(max_length=100, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "ملف المزارع"
        verbose_name_plural = "ملفات المزارعين"

    def __str__(self):
        return f"{self.farm_name or self.user.full_name} - {self.governorate}"

    @property
    def has_location(self):
        return self.latitude is not None and self.longitude is not None
