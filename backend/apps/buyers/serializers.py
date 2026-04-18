from rest_framework import serializers
from apps.accounts.serializers import UserProfileSerializer
from .models import BuyerProfile, SubscriptionPlan, Subscription


class BuyerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = BuyerProfile
        fields = [
            "id", "user", "full_name", "phone",
            "default_address", "latitude", "longitude", "notes",
            "has_location", "created_at",
        ]
        read_only_fields = ["id", "user", "full_name", "phone", "has_location", "created_at"]


class BuyerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = ["default_address", "latitude", "longitude", "notes"]


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ["id", "name_ar", "name_en", "description", "price", "frequency", "is_active"]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=SubscriptionPlan.objects.filter(is_active=True),
        write_only=True, source="plan",
    )

    class Meta:
        model = Subscription
        fields = [
            "id", "plan", "plan_id", "status",
            "start_date", "end_date", "delivery_address", "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]
