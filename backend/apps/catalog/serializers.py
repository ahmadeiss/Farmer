from rest_framework import serializers
from apps.farmers.serializers import FarmerPublicSerializer
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name_ar", "name_en", "slug", "icon", "is_active"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for marketplace listing."""

    category_name = serializers.CharField(source="category.name_ar", read_only=True)
    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    farmer_location = serializers.SerializerMethodField()
    farmer_governorate = serializers.SerializerMethodField()
    farmer_latitude = serializers.SerializerMethodField()
    farmer_longitude = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    unit_display = serializers.CharField(source="get_unit_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "title", "image", "price", "unit", "unit_display",
            "quantity_available", "is_low_stock", "is_in_stock", "is_active",
            "harvest_date", "category_name", "farmer_name", "farmer_location",
            "farmer_governorate", "farmer_latitude", "farmer_longitude",
            "distance_km",
            "is_featured", "created_at",
        ]

    def _profile(self, obj):
        return getattr(obj.farmer, "farmer_profile", None)

    def get_farmer_location(self, obj):
        profile = self._profile(obj)
        if not profile:
            return ""
        return f"{profile.governorate or ''}, {profile.city or ''}".strip(", ")

    def get_farmer_governorate(self, obj):
        profile = self._profile(obj)
        return profile.governorate if profile else ""

    def get_farmer_latitude(self, obj):
        profile = self._profile(obj)
        return str(profile.latitude) if profile and profile.latitude is not None else None

    def get_farmer_longitude(self, obj):
        profile = self._profile(obj)
        return str(profile.longitude) if profile and profile.longitude is not None else None

    def get_distance_km(self, obj):
        coords = self.context.get("buyer_coords")
        if not coords:
            return None
        profile = self._profile(obj)
        if not profile or profile.latitude is None or profile.longitude is None:
            return None
        from apps.common.geo import haversine_km
        km = haversine_km(coords[0], coords[1], profile.latitude, profile.longitude)
        return round(km, 2) if km is not None else None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product detail including farmer profile."""

    category = CategorySerializer(read_only=True)
    farmer = FarmerPublicSerializer(source="farmer.farmer_profile", read_only=True)
    unit_display = serializers.CharField(source="get_unit_display", read_only=True)
    transcription_status_display = serializers.CharField(
        source="get_transcription_status_display", read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "title", "description", "image", "audio_file",
            "transcription_text", "transcription_status", "transcription_status_display",
            "price", "unit", "unit_display", "quantity_available",
            "low_stock_threshold", "is_low_stock", "is_in_stock",
            "harvest_date", "category", "farmer",
            "is_active", "is_featured", "created_at", "updated_at",
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """For farmers creating or editing products."""

    class Meta:
        model = Product
        fields = [
            "title", "description", "image", "audio_file",
            "category", "price", "unit", "quantity_available",
            "harvest_date", "low_stock_threshold", "is_active",
        ]

    def validate_quantity_available(self, value):
        if value < 0:
            raise serializers.ValidationError("الكمية لا يمكن أن تكون سالبة.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("السعر يجب أن يكون أكبر من صفر.")
        return value
