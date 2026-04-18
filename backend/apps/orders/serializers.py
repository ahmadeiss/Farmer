"""Order serializers: cart, checkout, order detail, status updates."""
from decimal import Decimal

from django.conf import settings
from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem, Review


class CartItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_image = serializers.ImageField(source="product.image", read_only=True)
    unit_display = serializers.CharField(source="product.get_unit_display", read_only=True)
    farmer_id = serializers.IntegerField(source="product.farmer_id", read_only=True)
    farmer_name = serializers.CharField(source="product.farmer.full_name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_title",
            "product_image",
            "unit_display",
            "farmer_id",
            "farmer_name",
            "quantity",
            "unit_price_snapshot",
            "subtotal",
        ]
        read_only_fields = ["id", "unit_price_snapshot", "subtotal"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "item_count", "updated_at"]


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))


class CheckoutSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(min_length=10)
    notes = serializers.CharField(required=False, default="")
    governorate = serializers.CharField(required=False, allow_blank=True, default="")
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "title_snapshot", "unit_price", "quantity", "unit", "subtotal"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_status_display = serializers.CharField(source="get_payment_status_display", read_only=True)
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)
    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    qr_code_url = serializers.SerializerMethodField()
    delivery_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "buyer_name",
            "farmer",
            "farmer_name",
            "status",
            "status_display",
            "payment_method",
            "payment_status",
            "payment_status_display",
            "subtotal",
            "delivery_fee",
            "total",
            "delivery_address",
            "delivery_governorate",
            "delivery_latitude",
            "delivery_longitude",
            "notes",
            "qr_token",
            "qr_confirmed_at",
            "qr_code_url",
            "delivery_assignment",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "buyer",
            "farmer",
            "status",
            "payment_method",
            "payment_status",
            "subtotal",
            "delivery_fee",
            "total",
            "qr_token",
            "qr_confirmed_at",
            "created_at",
            "updated_at",
        ]

    def get_qr_code_url(self, obj):
        return f"{settings.QR_CODE_BASE_URL}/{obj.qr_token}/"

    def get_delivery_assignment(self, obj):
        assignment = getattr(obj, "delivery_assignment", None)
        if not assignment:
            return None
        return {
            "id": assignment.id,
            "driver_id": assignment.assigned_to_id,
            "driver_name": assignment.assigned_to.full_name if assignment.assigned_to_id else None,
            "delivery_mode": assignment.delivery_mode,
            "delivery_mode_display": assignment.get_delivery_mode_display(),
            "status": assignment.status,
            "notes": assignment.notes,
            "pickup_time": assignment.pickup_time,
            "delivered_time": assignment.delivered_time,
        }


class CheckoutResultSerializer(serializers.Serializer):
    orders = OrderSerializer(many=True, read_only=True)
    order_ids = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Admin/Farmer: update order status."""

    status = serializers.ChoiceField(choices=Order.Status.choices)


class ReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "order", "buyer_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "buyer_name", "created_at"]

    def validate_order(self, order):
        user = self.context["request"].user
        if order.buyer != user:
            raise serializers.ValidationError("لا يمكنك تقييم طلب لا يخصك.")
        if order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError("يمكن التقييم فقط بعد تسليم الطلب.")
        if hasattr(order, "review"):
            raise serializers.ValidationError("لقد قمت بتقييم هذا الطلب مسبقاً.")
        return order
