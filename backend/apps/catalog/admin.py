from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name_ar", "name_en", "slug", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name_ar", "name_en", "slug"]
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "title", "farmer", "category", "price", "unit",
        "quantity_available", "is_low_stock", "is_active", "is_featured", "created_at",
    ]
    list_filter = ["is_active", "is_featured", "category", "unit", "transcription_status"]
    search_fields = ["title", "farmer__full_name", "farmer__phone"]
    raw_id_fields = ["farmer", "category"]
    readonly_fields = ["transcription_status", "created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("المعلومات الأساسية", {"fields": ("farmer", "category", "title", "description", "image")}),
        ("التسعير والمخزون", {"fields": ("price", "unit", "quantity_available", "low_stock_threshold", "harvest_date")}),
        ("الوصف الصوتي", {"fields": ("audio_file", "transcription_text", "transcription_status")}),
        ("الحالة", {"fields": ("is_active", "is_featured")}),
        ("التواريخ", {"fields": ("created_at", "updated_at")}),
    )
