"""
Catalog views: categories and products (marketplace + farmer management).
"""
from django.db import models
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsFarmer, IsAdmin
from .filters import ProductFilter
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
)
from .tasks import process_audio_transcription


class CategoryListView(generics.ListAPIView):
    """Public: list active categories. Pagination disabled — categories are a small finite list."""

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None
    queryset = Category.objects.filter(is_active=True)


class MarketplaceProductListView(generics.ListAPIView):
    """
    Public marketplace: list active products with filtering, search, ordering.
    Buyers and anonymous users can browse.

    Location-aware extras:
      - `?lat=<float>&lng=<float>` — when provided, each product gets `distance_km`
        computed from the buyer's coordinates to the farmer's coordinates.
      - `?ordering=distance` — sorts nearest-first (requires lat/lng).
    """

    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filterset_class = ProductFilter
    search_fields = ["title", "description", "farmer__full_name", "category__name_ar"]
    ordering_fields = ["price", "created_at", "quantity_available", "harvest_date"]
    ordering = ["-is_featured", "-created_at"]

    def _buyer_coords(self):
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        try:
            return (float(lat), float(lng)) if lat and lng else None
        except (TypeError, ValueError):
            return None

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["buyer_coords"] = self._buyer_coords()
        return ctx

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_active=True, quantity_available__gt=0)
            .select_related("farmer", "farmer__farmer_profile", "category")
        )
        # Client-side sort for nearest-first (haversine is not trivially expressible
        # in portable SQL; Palestine catalog sizes make this acceptable).
        if self.request.query_params.get("ordering") == "distance":
            coords = self._buyer_coords()
            if coords:
                from apps.common.geo import haversine_km
                products = list(qs)
                products.sort(key=lambda p: (
                    haversine_km(
                        coords[0], coords[1],
                        getattr(getattr(p.farmer, "farmer_profile", None), "latitude", None),
                        getattr(getattr(p.farmer, "farmer_profile", None), "longitude", None),
                    ) or float("inf")
                ))
                return products
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """Public: product detail page."""

    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    queryset = Product.objects.filter(is_active=True).select_related(
        "farmer", "farmer__farmer_profile", "category"
    )


class FarmerProductViewSet(viewsets.ModelViewSet):
    """
    Farmer's own product CRUD.
    Farmers can only manage their own products.
    """

    permission_classes = [IsFarmer]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductCreateUpdateSerializer
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        return Product.objects.filter(farmer=self.request.user).select_related("category")

    def perform_create(self, serializer):
        product = serializer.save(farmer=self.request.user)
        # Trigger audio transcription if audio was uploaded
        if product.audio_file:
            process_audio_transcription.delay(product.id)

    def perform_update(self, serializer):
        product = serializer.save()
        # Re-trigger transcription if audio was updated
        if "audio_file" in serializer.validated_data and product.audio_file:
            process_audio_transcription.delay(product.id)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """List farmer's products with low stock."""
        qs = self.get_queryset().filter(
            quantity_available__lte=models.F("low_stock_threshold"),
            is_active=True,
        )
        serializer = ProductListSerializer(qs, many=True)
        return Response(serializer.data)




class AdminProductViewSet(viewsets.ModelViewSet):
    """Admin: full product management."""

    permission_classes = [IsAdmin]
    search_fields = ["title", "farmer__full_name", "farmer__phone"]
    filterset_class = ProductFilter
    ordering_fields = ["price", "created_at", "quantity_available"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductCreateUpdateSerializer
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        return Product.objects.select_related("farmer", "farmer__farmer_profile", "category").all()
