"""Order views: cart, checkout, order management, QR confirmation, reviews."""
import logging
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.common.exceptions import BusinessLogicError
from apps.common.permissions import IsBuyer, IsFarmer, IsAdmin, IsFarmerOrAdmin
from .models import Cart, Order, Review
from .serializers import (
    CartSerializer, AddToCartSerializer, CheckoutSerializer,
    CheckoutResultSerializer, OrderSerializer, OrderStatusUpdateSerializer, ReviewSerializer,
)
from .services import CartService, OrderService

logger = logging.getLogger(__name__)


# ── Cart Views ──────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsBuyer])
def cart_view(request):
    """Get current buyer's cart."""
    cart = CartService.get_or_create_cart(request.user)
    return Response(CartSerializer(cart).data)


@api_view(["POST"])
@permission_classes([IsBuyer])
def add_to_cart_view(request):
    """Add or update item in cart."""
    serializer = AddToCartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        product = Product.objects.get(id=serializer.validated_data["product_id"], is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "المنتج غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    try:
        CartService.add_to_cart(request.user, product, serializer.validated_data["quantity"])
    except BusinessLogicError as e:
        return Response({"error": e.message, "code": e.code}, status=status.HTTP_400_BAD_REQUEST)

    cart = CartService.get_or_create_cart(request.user)
    return Response(CartSerializer(cart).data)


@api_view(["DELETE"])
@permission_classes([IsBuyer])
def remove_from_cart_view(request, product_id):
    """Remove a product from cart."""
    CartService.remove_from_cart(request.user, product_id)
    cart = CartService.get_or_create_cart(request.user)
    return Response(CartSerializer(cart).data)


@api_view(["DELETE"])
@permission_classes([IsBuyer])
def clear_cart_view(request):
    """Empty the cart."""
    cart = CartService.get_or_create_cart(request.user)
    CartService.clear_cart(cart)
    return Response({"message": "تم إفراغ السلة."})


# ── Checkout ─────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsBuyer])
def checkout_view(request):
    """Place an order from current cart."""
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        orders = OrderService.checkout(
            user=request.user,
            delivery_address=serializer.validated_data["delivery_address"],
            notes=serializer.validated_data.get("notes", ""),
            governorate=serializer.validated_data.get("governorate", ""),
            latitude=serializer.validated_data.get("latitude"),
            longitude=serializer.validated_data.get("longitude"),
        )
    except BusinessLogicError as e:
        return Response({"error": e.message, "code": e.code}, status=status.HTTP_400_BAD_REQUEST)

    for order in orders:
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                user=order.farmer,
                title="🛒 طلب جديد!",
                body=f"تلقيت طلباً جديداً من {order.buyer.full_name} بقيمة {order.total} ₪",
                notification_type="new_order",
                data={"order_id": order.id, "farmer_order_id": order.id},
            )
        except Exception as exc:
            logger.warning(f"Notification failed for order #{order.id}: {exc}")

    payload = {
        "orders": orders,
        "order_ids": [order.id for order in orders],
        "order_count": len(orders),
        "total": sum(order.total for order in orders),
    }
    return Response(CheckoutResultSerializer(payload).data, status=status.HTTP_201_CREATED)


# ── Order Views (Buyer) ───────────────────────────────────────────────────────

class BuyerOrderListView(generics.ListAPIView):
    """Buyer: list their orders."""
    serializer_class = OrderSerializer
    permission_classes = [IsBuyer]
    filterset_fields = ["status"]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items").select_related("farmer")


class BuyerOrderDetailView(generics.RetrieveAPIView):
    """Buyer: view a specific order."""
    serializer_class = OrderSerializer
    permission_classes = [IsBuyer]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("items")


# ── Order Views (Farmer) ──────────────────────────────────────────────────────

class FarmerOrderListView(generics.ListAPIView):
    """Farmer: list their incoming orders."""
    serializer_class = OrderSerializer
    permission_classes = [IsFarmer]
    filterset_fields = ["status"]

    def get_queryset(self):
        return Order.objects.filter(farmer=self.request.user).prefetch_related("items").select_related("buyer")


class FarmerOrderDetailView(generics.RetrieveAPIView):
    """Farmer: view a specific order."""
    serializer_class = OrderSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        return Order.objects.filter(farmer=self.request.user).prefetch_related("items")


@api_view(["PATCH"])
@permission_classes([IsFarmerOrAdmin])
def update_order_status_view(request, order_id):
    """Farmer/Admin: advance order status."""
    try:
        if request.user.role == "farmer":
            order = Order.objects.get(id=order_id, farmer=request.user)
        else:
            order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "الطلب غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    new_status = serializer.validated_data["status"]
    try:
        order = OrderService.update_order_status(order, new_status, actor=request.user)
    except BusinessLogicError as e:
        return Response({"error": e.message, "code": e.code}, status=status.HTTP_400_BAD_REQUEST)

    # Notify buyer of status change (synchronous, guaranteed)
    STATUS_MESSAGES = {
        "confirmed":        ("✅ تم تأكيد طلبك",     "المزارع تلقى طلبك وسيبدأ التحضير قريباً"),
        "preparing":        ("👨‍🍳 طلبك قيد التحضير", "المزارع يجهّز طلبك الآن"),
        "ready_for_pickup": ("📦 طلبك جاهز",          "طلبك جاهز وسيُرسل إليك قريباً"),
        "out_for_delivery": ("🚚 طلبك في الطريق",     "طلبك خرج للتوصيل، تتبّع وضعه في التطبيق"),
        "delivered":        ("🎉 تم تسليم طلبك",      "تم استلام طلبك بنجاح. شكراً لثقتك بنا!"),
        "cancelled":        ("❌ تم إلغاء طلبك",      "تم إلغاء طلبك. تواصل معنا إن احتجت مساعدة"),
    }
    if new_status in STATUS_MESSAGES:
        title, body = STATUS_MESSAGES[new_status]
        try:
            from apps.notifications.services import NotificationService
            NotificationService.notify_user(
                user=order.buyer,
                title=title,
                body=body,
                notification_type="order_status",
                data={"order_id": order.id, "status": new_status},
            )
        except Exception as exc:
            logger.warning(f"Status notification failed for order #{order.id}: {exc}")

    return Response(OrderSerializer(order).data)


# ── QR Confirmation ───────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_qr_view(request, qr_token):
    """Confirm delivery via QR token scan (buyer or admin only)."""
    try:
        order = OrderService.confirm_qr_delivery(str(qr_token), user=request.user)
    except BusinessLogicError as e:
        return Response({"error": e.message, "code": e.code}, status=status.HTTP_400_BAD_REQUEST)

    _notify_farmer_delivered(order)
    return Response({"message": "تم تأكيد التسليم بنجاح.", "order_id": order.id})


@api_view(["POST"])
@permission_classes([IsBuyer])
def buyer_confirm_receipt_view(request, order_id):
    """
    Manual delivery confirmation by the buyer (fallback when QR scanning fails).
    Uses the same service logic as QR confirmation — just finds the order by ID
    instead of qr_token so the buyer doesn't need to scan anything.
    """
    try:
        order = Order.objects.select_related("buyer", "farmer").get(
            id=order_id, buyer=request.user
        )
    except Order.DoesNotExist:
        return Response({"error": "الطلب غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    try:
        confirmed_order = OrderService.confirm_qr_delivery(str(order.qr_token), user=request.user)
    except BusinessLogicError as e:
        return Response({"error": e.message, "code": e.code}, status=status.HTTP_400_BAD_REQUEST)

    _notify_farmer_delivered(confirmed_order)
    return Response({"message": "تم تأكيد الاستلام بنجاح.", "order_id": confirmed_order.id})


def _notify_farmer_delivered(order: Order):
    """Fire a non-blocking notification to the farmer when delivery is confirmed."""
    try:
        from apps.notifications.services import NotificationService
        NotificationService.notify_user(
            user=order.farmer,
            title="🎉 تم تأكيد التسليم!",
            body=f"أكّد {order.buyer.full_name} استلام طلبه #{order.id} بنجاح.",
            notification_type="order_status",
            data={"order_id": order.id},
        )
    except Exception as exc:
        logger.warning("Farmer delivery notification failed for order #%s: %s", order.id, exc)


# ── Admin Order Views ─────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    """Admin: all orders with filtering."""
    serializer_class = OrderSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["status", "payment_status", "farmer", "buyer"]
    search_fields = ["buyer__full_name", "farmer__full_name", "buyer__phone"]
    ordering_fields = ["created_at", "total"]

    def get_queryset(self):
        return Order.objects.all().prefetch_related("items").select_related("buyer", "farmer")


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    """Admin: view or update an order."""
    serializer_class = OrderSerializer
    permission_classes = [IsAdmin]
    queryset = Order.objects.all().prefetch_related("items")


# ── Reviews ───────────────────────────────────────────────────────────────────

class ReviewCreateView(generics.CreateAPIView):
    """Buyer submits a review after delivery."""
    serializer_class = ReviewSerializer
    permission_classes = [IsBuyer]

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user, farmer=serializer.validated_data["order"].farmer)
