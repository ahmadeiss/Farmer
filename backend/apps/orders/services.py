"""
Order service layer: checkout, lifecycle transitions, QR confirmation.
All mutations go through this service to ensure business rules are enforced.
"""
import logging
from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.common.exceptions import BusinessLogicError
from apps.inventory.services import InventoryService
from apps.logistics.models import DeliveryAssignment
from .models import Cart, CartItem, Order, OrderItem

logger = logging.getLogger(__name__)

DELIVERY_FEE = Decimal("0.00")  # Free delivery (cash on delivery) - can be made dynamic in v2


class CartService:
    """Manages shopping cart operations."""

    @staticmethod
    def get_or_create_cart(user):
        cart, _ = Cart.objects.get_or_create(buyer=user)
        return cart

    @staticmethod
    @transaction.atomic
    def add_to_cart(user, product, quantity: Decimal):
        """Add or update product in buyer's cart."""
        if not product.is_in_stock:
            raise BusinessLogicError("هذا المنتج غير متاح حالياً.", code="product_unavailable")
        if quantity <= 0:
            raise BusinessLogicError("الكمية يجب أن تكون أكبر من صفر.")
        if quantity > product.quantity_available:
            raise BusinessLogicError(
                f"الكمية المطلوبة ({quantity}) تتجاوز المتاح ({product.quantity_available}).",
                code="insufficient_stock",
            )

        cart = CartService.get_or_create_cart(user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity, "unit_price_snapshot": product.price},
        )
        if not created:
            item.quantity = quantity
            item.unit_price_snapshot = product.price
            item.save(update_fields=["quantity", "unit_price_snapshot", "updated_at"])
        return item

    @staticmethod
    @transaction.atomic
    def remove_from_cart(user, product_id: int):
        cart = CartService.get_or_create_cart(user)
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()

    @staticmethod
    def clear_cart(cart: Cart):
        cart.items.all().delete()


class OrderService:
    """Manages order creation and lifecycle."""

    @staticmethod
    @transaction.atomic
    def checkout(
        user,
        delivery_address: str,
        notes: str = "",
        governorate: str = "",
        latitude=None,
        longitude=None,
    ) -> list[Order]:
        """
        Convert cart to one or more orders.
        - Validates all items are still available
        - Creates one order per farmer with snapshots
        - Reserves inventory for each item
        - Clears cart
        - Persists buyer location on each order and (if provided) updates the buyer profile
        """
        cart = Cart.objects.prefetch_related("items__product__farmer__farmer_profile").get(buyer=user)

        items = list(cart.items.select_related("product").all())
        if not items:
            raise BusinessLogicError("السلة فارغة.", code="empty_cart")

        # Persist location on the buyer profile for next-time prefill + nearest sorting.
        profile = getattr(user, "buyer_profile", None)
        if profile is not None and (latitude is not None or longitude is not None or delivery_address):
            dirty = False
            if latitude is not None and longitude is not None:
                profile.latitude = latitude
                profile.longitude = longitude
                dirty = True
            if delivery_address and not profile.default_address:
                profile.default_address = delivery_address
                dirty = True
            if dirty:
                profile.save(update_fields=["latitude", "longitude", "default_address", "updated_at"])

        items_by_farmer = defaultdict(list)
        for item in items:
            items_by_farmer[item.product.farmer_id].append(item)

        orders = []
        for farmer_items in items_by_farmer.values():
            farmer = farmer_items[0].product.farmer
            subtotal = sum(item.subtotal for item in farmer_items)
            total = subtotal + DELIVERY_FEE

            order = Order.objects.create(
                buyer=user,
                farmer=farmer,
                status=Order.Status.PENDING,
                payment_method=Order.PaymentMethod.CASH,
                payment_status=Order.PaymentStatus.PENDING,
                subtotal=subtotal,
                delivery_fee=DELIVERY_FEE,
                total=total,
                delivery_address=delivery_address,
                delivery_governorate=governorate or "",
                delivery_latitude=latitude,
                delivery_longitude=longitude,
                notes=notes,
            )

            for item in farmer_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    title_snapshot=item.product.title,
                    unit_price=item.unit_price_snapshot,
                    quantity=item.quantity,
                    unit=item.product.unit,
                )
                InventoryService.reserve_stock(item.product, item.quantity, order)

            orders.append(order)

        CartService.clear_cart(cart)

        logger.info(
            "Created %s order(s) for buyer %s total=%s",
            len(orders),
            user.phone,
            sum(order.total for order in orders),
        )
        return orders

    @staticmethod
    @transaction.atomic
    def update_order_status(order: Order, new_status: str, actor=None) -> Order:
        """Transition order to a new status while enforcing business rules."""
        valid_transitions = {
            Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.CANCELLED],
            Order.Status.CONFIRMED: [Order.Status.PREPARING, Order.Status.CANCELLED],
            Order.Status.PREPARING: [Order.Status.READY, Order.Status.CANCELLED],
            Order.Status.READY: [Order.Status.OUT_FOR_DELIVERY, Order.Status.CANCELLED],
            Order.Status.OUT_FOR_DELIVERY: [Order.Status.DELIVERED],
            Order.Status.DELIVERED: [],
            Order.Status.CANCELLED: [],
        }

        allowed = valid_transitions.get(order.status, [])
        if new_status not in allowed:
            raise BusinessLogicError(
                f"لا يمكن تغيير الحالة من '{order.get_status_display()}' إلى '{new_status}'.",
                code="invalid_transition",
            )

        old_status = order.status

        if new_status == Order.Status.OUT_FOR_DELIVERY:
            assignment = getattr(order, "delivery_assignment", None)
            if not assignment or not assignment.is_ready_for_dispatch:
                raise BusinessLogicError(
                    "يجب تعيين سائق محدد أو اختيار التوصيل الذاتي من المزرعة قبل إخراج الطلب للتوصيل.",
                    code="delivery_assignment_required",
                )
            if assignment.status == DeliveryAssignment.Status.UNASSIGNED:
                assignment.status = DeliveryAssignment.Status.ASSIGNED
            if assignment.pickup_time is None:
                assignment.pickup_time = timezone.now()
            assignment.save(update_fields=["status", "pickup_time", "updated_at"])

        order.status = new_status
        order.save(update_fields=["status", "updated_at"])

        if new_status == Order.Status.CANCELLED:
            for item in order.items.select_related("product").all():
                if item.product:
                    InventoryService.release_stock(item.product, item.quantity, order)
            logger.info("Order #%s CANCELLED - stock released", order.id)

        logger.info("Order #%s %s -> %s by %s", order.id, old_status, new_status, actor)
        return order

    @staticmethod
    @transaction.atomic
    def confirm_qr_delivery(qr_token: str, user=None) -> Order:
        """
        Confirm order delivery via QR token scan.
        Only the buyer who owns the order (or an admin) may confirm.
        Marks order delivered, credits farmer wallet.
        """
        try:
            order = Order.objects.select_for_update().get(qr_token=qr_token)
        except Order.DoesNotExist:
            raise BusinessLogicError("رمز QR غير صالح.", code="invalid_qr")

        if user is not None:
            is_admin = getattr(user, "is_staff", False) or getattr(user, "role", None) == "admin"
            if not is_admin and order.buyer_id != user.id:
                raise BusinessLogicError(
                    "لا تملك صلاحية تأكيد هذا الطلب.",
                    code="not_order_owner",
                )

        if order.status == Order.Status.DELIVERED:
            raise BusinessLogicError("هذا الطلب سبق تسليمه.", code="already_delivered")

        if order.status not in [Order.Status.READY, Order.Status.OUT_FOR_DELIVERY]:
            raise BusinessLogicError(
                "لا يمكن تأكيد التسليم في الحالة الحالية للطلب.",
                code="invalid_state_for_qr",
            )

        order.status = Order.Status.DELIVERED
        order.payment_status = Order.PaymentStatus.COLLECTED
        order.qr_confirmed_at = timezone.now()
        order.save(update_fields=["status", "payment_status", "qr_confirmed_at", "updated_at"])

        assignment = getattr(order, "delivery_assignment", None)
        if assignment:
            assignment.status = DeliveryAssignment.Status.DELIVERED
            assignment.delivered_time = timezone.now()
            assignment.save(update_fields=["status", "delivered_time", "updated_at"])

        for item in order.items.select_related("product").all():
            if item.product:
                InventoryService.mark_sold(item.product, item.quantity, order)

        from apps.wallets.services import WalletService

        WalletService.credit_on_delivery(order)

        logger.info("Order #%s delivered via QR at %s", order.id, order.qr_confirmed_at)
        return order
