from rest_framework import serializers
from apps.accounts.serializers import UserProfileSerializer
from .models import FarmerProfile


class FarmerProfileSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = FarmerProfile
        fields = [
            "id", "user", "full_name", "phone",
            "farm_name", "governorate", "city", "village", "address",
            "latitude", "longitude", "bio", "avatar",
            "preferred_payout_method", "has_location", "created_at",
        ]
        read_only_fields = ["id", "user", "full_name", "phone", "has_location", "created_at"]


class FarmerProfileUpdateSerializer(serializers.ModelSerializer):
    """For farmers updating their own profile."""

    class Meta:
        model = FarmerProfile
        fields = [
            "farm_name", "governorate", "city", "village", "address",
            "latitude", "longitude", "bio", "avatar", "preferred_payout_method",
        ]


class FarmerPublicSerializer(serializers.ModelSerializer):
    """Public-facing farmer info shown on product listings."""

    full_name = serializers.CharField(source="user.full_name")
    phone = serializers.CharField(source="user.phone")

    class Meta:
        model = FarmerProfile
        fields = ["id", "full_name", "phone", "farm_name", "governorate", "city", "avatar", "bio"]
