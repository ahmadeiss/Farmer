from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from apps.common.permissions import IsFarmer, IsAdmin
from .models import InventoryMovement
from .serializers import InventoryMovementSerializer, StockAdjustSerializer
from .services import InventoryService


class ProductMovementListView(generics.ListAPIView):
    """Farmer: view inventory movements for a specific product."""

    serializer_class = InventoryMovementSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        return InventoryMovement.objects.filter(
            product__farmer=self.request.user,
            product_id=self.kwargs["product_id"],
        ).select_related("product")


@api_view(["POST"])
@permission_classes([IsFarmer])
def add_stock_view(request, product_id):
    """Farmer manually adds more stock to a product."""
    try:
        product = Product.objects.get(id=product_id, farmer=request.user)
    except Product.DoesNotExist:
        return Response({"error": "المنتج غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    serializer = StockAdjustSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    InventoryService.add_stock(
        product=product,
        quantity=serializer.validated_data["quantity"],
        note=serializer.validated_data.get("note", ""),
    )
    return Response({"message": "تم إضافة المخزون بنجاح.", "quantity_available": float(product.quantity_available)})


class LowStockAlertView(generics.ListAPIView):
    """Farmer: view their products with low stock."""

    serializer_class = ProductListSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        from django.db.models import F
        return Product.objects.filter(
            farmer=self.request.user,
            quantity_available__lte=F("low_stock_threshold"),
            is_active=True,
        )


class AdminLowStockView(generics.ListAPIView):
    """Admin: view all low-stock products across all farmers."""

    serializer_class = ProductListSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        from django.db.models import F
        return Product.objects.filter(
            quantity_available__lte=F("low_stock_threshold"),
            is_active=True,
        ).select_related("farmer", "farmer__farmer_profile", "category")


class AdminMovementListView(generics.ListAPIView):
    """Admin: view all inventory movements."""

    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["movement_type", "product"]

    def get_queryset(self):
        return InventoryMovement.objects.select_related("product", "reference_order").all()
