from rest_framework import serializers

from apps.accounts.models import User
from apps.orders.serializers import OrderSerializer
from .models import DeliveryAssignment


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    driver_id = serializers.IntegerField(source="assigned_to_id", read_only=True)
    driver_name = serializers.CharField(source="assigned_to.full_name", read_only=True)
    delivery_mode_display = serializers.CharField(source="get_delivery_mode_display", read_only=True)
    buyer_phone = serializers.CharField(source="order.buyer.phone", read_only=True)
    farmer_phone = serializers.CharField(source="order.farmer.phone", read_only=True)
    farmer_location = serializers.SerializerMethodField()
    buyer_location = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryAssignment
        fields = [
            "id",
            "order",
            "driver_id",
            "driver_name",
            "delivery_mode",
            "delivery_mode_display",
            "status",
            "pickup_time",
            "delivered_time",
            "notes",
            "buyer_phone",
            "farmer_phone",
            "farmer_location",
            "buyer_location",
            "created_at",
            "updated_at",
        ]

    def get_farmer_location(self, obj):
        profile = getattr(obj.order.farmer, "farmer_profile", None)
        if not profile:
            return None
        parts = [profile.governorate, profile.city, profile.village, profile.address]
        address = "، ".join(p for p in parts if p)
        return {
            "farm_name": profile.farm_name or "",
            "address": address,
            "latitude": str(profile.latitude) if profile.latitude is not None else None,
            "longitude": str(profile.longitude) if profile.longitude is not None else None,
        }

    def get_buyer_location(self, obj):
        order = obj.order
        # Prefer coordinates captured at checkout; fall back to the buyer's saved profile.
        lat = order.delivery_latitude
        lng = order.delivery_longitude
        if lat is None or lng is None:
            profile = getattr(order.buyer, "buyer_profile", None)
            if profile is not None:
                lat = lat if lat is not None else profile.latitude
                lng = lng if lng is not None else profile.longitude
        return {
            "address": order.delivery_address or "",
            "governorate": order.delivery_governorate or "",
            "latitude": str(lat) if lat is not None else None,
            "longitude": str(lng) if lng is not None else None,
        }


class DriverOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "phone", "is_verified"]


class DeliveryAssignmentUpdateSerializer(serializers.Serializer):
    delivery_mode = serializers.ChoiceField(choices=DeliveryAssignment.DeliveryMode.choices)
    driver_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        delivery_mode = attrs["delivery_mode"]
        driver_id = attrs.get("driver_id")

        if delivery_mode == DeliveryAssignment.DeliveryMode.DRIVER:
            if not driver_id:
                raise serializers.ValidationError({"driver_id": "اختيار السائق مطلوب."})
            try:
                driver = User.objects.get(id=driver_id, role=User.Role.DRIVER, is_active=True)
            except User.DoesNotExist:
                raise serializers.ValidationError({"driver_id": "السائق المحدد غير موجود."})
            attrs["driver"] = driver
        else:
            attrs["driver"] = None

        return attrs


class DriverDashboardSummarySerializer(serializers.Serializer):
    assigned = serializers.IntegerField()
    picked_up = serializers.IntegerField()
    delivered_today = serializers.IntegerField()
    active_deliveries = serializers.IntegerField()
