"""
Catalog models: Category and Product.
Products are the core marketplace entity.
"""
from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    """Product categories (e.g. vegetables, fruits, grains)."""

    name_ar = models.CharField(max_length=200, unique=True, verbose_name="الاسم (عربي)")
    name_en = models.CharField(max_length=200, blank=True, verbose_name="الاسم (إنجليزي)")
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or icon class")
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "تصنيف"
        verbose_name_plural = "التصنيفات"
        ordering = ["name_ar"]

    def __str__(self):
        return self.name_ar

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en or self.name_ar, allow_unicode=True)
        super().save(*args, **kwargs)


class Product(TimeStampedModel):
    """
    Core product listing by a farmer.
    Includes audio transcription scaffold for voice-described listings.
    """

    class Unit(models.TextChoices):
        KG = "kg", "كيلوغرام"
        GRAM = "gram", "غرام"
        TON = "ton", "طن"
        BOX = "box", "صندوق"
        BUNCH = "bunch", "ربطة"
        PIECE = "piece", "حبة"
        LITER = "liter", "لتر"
        BAG = "bag", "كيس"

    class TranscriptionStatus(models.TextChoices):
        NONE = "none", "لا يوجد"
        PENDING = "pending", "قيد المعالجة"
        PROCESSING = "processing", "يتم المعالجة"
        DONE = "done", "مكتمل"
        FAILED = "failed", "فشل"

    # Relations
    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="products",
        limit_choices_to={"role": "farmer"},
        verbose_name="المزارع",
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="products", verbose_name="التصنيف",
    )

    # Basic info
    title = models.CharField(max_length=300, verbose_name="اسم المنتج", db_index=True)
    description = models.TextField(blank=True, verbose_name="الوصف")
    image = models.ImageField(
        upload_to="products/images/%Y/%m/",
        null=True, blank=True,
        verbose_name="الصورة",
    )

    # Audio transcription scaffold
    audio_file = models.FileField(
        upload_to="products/audio/%Y/%m/",
        null=True, blank=True,
        verbose_name="الملف الصوتي",
        help_text="Voice description - will be transcribed via Whisper",
    )
    transcription_text = models.TextField(
        blank=True, null=True,
        verbose_name="النص المستخرج من الصوت",
    )
    transcription_status = models.CharField(
        max_length=20,
        choices=TranscriptionStatus.choices,
        default=TranscriptionStatus.NONE,
        verbose_name="حالة الاستخراج",
    )

    # Pricing and stock
    quantity_available = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الكمية المتاحة",
        db_index=True,
    )
    unit = models.CharField(max_length=20, choices=Unit.choices, default=Unit.KG, verbose_name="الوحدة")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="السعر")
    harvest_date = models.DateField(null=True, blank=True, verbose_name="تاريخ الحصاد")

    # Status
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="نشط")
    is_featured = models.BooleanField(default=False, db_index=True, verbose_name="مميز")

    # Low stock threshold
    low_stock_threshold = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=10,
        verbose_name="حد المخزون المنخفض",
    )

    class Meta:
        verbose_name = "منتج"
        verbose_name_plural = "المنتجات"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["farmer", "is_active"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["is_featured", "is_active", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.farmer.full_name}"

    @property
    def is_low_stock(self):
        """True when quantity is at or below the alert threshold (but still > 0)."""
        return 0 < self.quantity_available <= self.low_stock_threshold

    @property
    def is_in_stock(self):
        """True when there is physical stock, regardless of active status."""
        return self.quantity_available > 0
