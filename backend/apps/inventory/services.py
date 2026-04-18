"""
Inventory service layer: all stock mutations go through here.
Ensures consistency and audit trail via InventoryMovement records.
"""
import logging
from decimal import Decimal
from django.db import models, transaction

from apps.common.exceptions import BusinessLogicError
from apps.catalog.models import Product
from .models import InventoryMovement

logger = logging.getLogger(__name__)


class InventoryService:
    """
    Central service for all inventory operations.
    All methods are transactional and create audit records.
    """

    @staticmethod
    @transaction.atomic
    def add_stock(product: Product, quantity: Decimal, note: str = "") -> InventoryMovement:
        """Farmer adds new stock to a product."""
        if quantity <= 0:
            raise BusinessLogicError("الكمية المضافة يجب أن تكون أكبر من صفر.")

        before = product.quantity_available
        product.quantity_available += quantity
        product.save(update_fields=["quantity_available", "updated_at"])

        movement = InventoryMovement.objects.create(
            product=product,
            movement_type=InventoryMovement.MovementType.ADD,
            quantity=quantity,
            quantity_before=before,
            quantity_after=product.quantity_available,
            note=note or "إضافة مخزون من المزارع",
        )
        logger.info(f"Stock ADD: product={product.id} +{quantity} -> {product.quantity_available}")
        return movement

    @staticmethod
    @transaction.atomic
    def reserve_stock(product: Product, quantity: Decimal, order=None) -> InventoryMovement:
        """
        Reserve stock when an order is placed.
        Raises BusinessLogicError if insufficient stock.
        """
        # Re-fetch with select_for_update to prevent race conditions
        product = Product.objects.select_for_update().get(pk=product.pk)

        if product.quantity_available < quantity:
            raise BusinessLogicError(
                f"الكمية المطلوبة ({quantity}) غير متاحة. المتاح: {product.quantity_available}",
                code="insufficient_stock",
            )

        before = product.quantity_available
        product.quantity_available -= quantity
        product.save(update_fields=["quantity_available", "updated_at"])

        movement = InventoryMovement.objects.create(
            product=product,
            movement_type=InventoryMovement.MovementType.RESERVE,
            quantity=-quantity,
            quantity_before=before,
            quantity_after=product.quantity_available,
            reference_order=order,
            note=f"حجز للطلب #{order.id if order else 'N/A'}",
        )
        logger.info(f"Stock RESERVE: product={product.id} -{quantity} -> {product.quantity_available}")
        return movement

    @staticmethod
    @transaction.atomic
    def release_stock(product: Product, quantity: Decimal, order=None) -> InventoryMovement:
        """Release reserved stock when an order is cancelled."""
        before = product.quantity_available
        product.quantity_available += quantity
        product.save(update_fields=["quantity_available", "updated_at"])

        movement = InventoryMovement.objects.create(
            product=product,
            movement_type=InventoryMovement.MovementType.RELEASE,
            quantity=quantity,
            quantity_before=before,
            quantity_after=product.quantity_available,
            reference_order=order,
            note=f"إلغاء حجز للطلب #{order.id if order else 'N/A'}",
        )
        logger.info(f"Stock RELEASE: product={product.id} +{quantity} -> {product.quantity_available}")
        return movement

    @staticmethod
    @transaction.atomic
    def mark_sold(product: Product, quantity: Decimal, order=None) -> InventoryMovement:
        """Mark stock as sold (order delivered). Stock was already reserved."""
        movement = InventoryMovement.objects.create(
            product=product,
            movement_type=InventoryMovement.MovementType.SOLD,
            quantity=-quantity,
            quantity_before=product.quantity_available,
            quantity_after=product.quantity_available,  # No additional change (already reserved)
            reference_order=order,
            note=f"تم البيع للطلب #{order.id if order else 'N/A'}",
        )
        logger.info(f"Stock SOLD: product={product.id} quantity={quantity}")
        return movement

    @staticmethod
    def check_low_stock_products():
        """Returns products with quantity <= low_stock_threshold."""
        return Product.objects.filter(
            quantity_available__lte=models.F("low_stock_threshold"),
            is_active=True,
        ).select_related("farmer")



