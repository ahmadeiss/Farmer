from django.contrib import admin
from .models import InventoryMovement


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ["product", "movement_type", "quantity", "quantity_before", "quantity_after", "created_at"]
    list_filter = ["movement_type"]
    search_fields = ["product__title", "product__farmer__full_name"]
    raw_id_fields = ["product", "reference_order"]
    readonly_fields = ["quantity_before", "quantity_after", "created_at"]
    ordering = ["-created_at"]
