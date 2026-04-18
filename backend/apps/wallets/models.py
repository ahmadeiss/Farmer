"""
Wallet models: cash settlement ledger for farmers.
Architected to support future digital wallet/payment integration.
"""
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Wallet(TimeStampedModel):
    """
    One wallet per farmer. Tracks cash settlement balance.
    Future: support digital balance with real payout flows.
    """

    farmer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet",
        limit_choices_to={"role": "farmer"},
        verbose_name="المزارع",
    )
    current_balance = models.DecimalField(
        max_digits=14, decimal_places=2,
        default=0,
        verbose_name="الرصيد الحالي",
    )

    # Future: digital balance fields
    # pending_balance = models.DecimalField(...)  # held until settlement
    # total_lifetime_earned = models.DecimalField(...)

    class Meta:
        verbose_name = "محفظة"
        verbose_name_plural = "المحافظ"

    def __str__(self):
        return f"محفظة {self.farmer.full_name} | {self.current_balance} ₪"


class WalletLedger(TimeStampedModel):
    """
    Immutable ledger entries for all wallet movements.
    Each row records a financial event with reference to the source.
    """

    class EntryType(models.TextChoices):
        CREDIT = "credit", "إيداع (مبيعات)"
        DEBIT = "debit", "خصم"
        HOLD = "hold", "تجميد مؤقت"
        RELEASE = "release", "إلغاء تجميد"
        SETTLEMENT = "settlement", "تسوية مالية"

    wallet = models.ForeignKey(
        Wallet, on_delete=models.CASCADE,
        related_name="ledger_entries",
        verbose_name="المحفظة",
    )
    entry_type = models.CharField(
        max_length=20,
        choices=EntryType.choices,
        verbose_name="نوع الحركة",
        db_index=True,
    )
    amount = models.DecimalField(
        max_digits=14, decimal_places=2,
        verbose_name="المبلغ",
    )
    balance_before = models.DecimalField(
        max_digits=14, decimal_places=2,
        verbose_name="الرصيد قبل",
    )
    balance_after = models.DecimalField(
        max_digits=14, decimal_places=2,
        verbose_name="الرصيد بعد",
    )

    # Reference to the source transaction
    reference_type = models.CharField(max_length=50, blank=True, verbose_name="نوع المرجع")
    reference_id = models.PositiveBigIntegerField(null=True, blank=True, verbose_name="رقم المرجع")
    description = models.CharField(max_length=500, blank=True, verbose_name="الوصف")

    class Meta:
        verbose_name = "حركة المحفظة"
        verbose_name_plural = "حركات المحافظ"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["wallet", "-created_at"]),
            models.Index(fields=["entry_type", "-created_at"]),
            models.Index(fields=["reference_type", "reference_id"]),
        ]

    def __str__(self):
        return f"{self.get_entry_type_display()} | {self.amount} ₪ | {self.wallet.farmer.full_name}"
