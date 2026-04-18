from rest_framework import serializers
from .models import InventoryMovement


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    movement_type_display = serializers.CharField(source="get_movement_type_display", read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            "id", "product", "product_title", "movement_type", "movement_type_display",
            "quantity", "quantity_before", "quantity_after",
            "reference_order", "note", "created_at",
        ]
        read_only_fields = [
            "id", "quantity_before", "quantity_after", "created_at",
        ]


class StockAdjustSerializer(serializers.Serializer):
    """Farmer manually adjusts stock quantity."""

    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    note = serializers.CharField(max_length=500, required=False, default="")
