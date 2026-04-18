"""Inventory Celery tasks: periodic low-stock checks and alerts."""
import logging
from celery import shared_task
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task(queue="default")
def check_low_stock():
    """
    Periodic task: check for low stock products and send notifications to farmers.
    Scheduled via Celery Beat.
    """
    from apps.catalog.models import Product
    from apps.notifications.services import NotificationService

    low_stock_products = Product.objects.filter(
        quantity_available__lte=F("low_stock_threshold"),
        is_active=True,
    ).select_related("farmer")

    count = 0
    for product in low_stock_products:
        NotificationService.notify_user(
            user=product.farmer,
            title="تنبيه: مخزون منخفض",
            body=f"المنتج '{product.title}' وصل إلى مستوى منخفض ({product.quantity_available} {product.unit})",
            notification_type="low_stock",
        )
        count += 1

    logger.info(f"Low stock check complete: {count} alerts sent")
    return {"alerts_sent": count}
