"""Order Celery tasks: notifications, QR processing."""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(queue="notifications")
def notify_new_order(order_id: int):
    """Notify farmer of a new order."""
    from apps.orders.models import Order
    from apps.notifications.services import NotificationService

    try:
        order = Order.objects.select_related("buyer", "farmer").get(id=order_id)
    except Order.DoesNotExist:
        return

    # Notify farmer
    NotificationService.notify_user(
        user=order.farmer,
        title="طلب جديد!",
        body=f"تلقيت طلباً جديداً من {order.buyer.full_name} بقيمة {order.total} ₪",
        notification_type="new_order",
    )
    logger.info(f"New order notification sent for order #{order_id}")


@shared_task(queue="notifications")
def notify_order_status_change(order_id: int, new_status: str):
    """Notify buyer when order status changes."""
    from apps.orders.models import Order
    from apps.notifications.services import NotificationService

    try:
        order = Order.objects.select_related("buyer", "farmer").get(id=order_id)
    except Order.DoesNotExist:
        return

    status_messages = {
        "confirmed": "تم تأكيد طلبك",
        "preparing": "المزارع يجهز طلبك",
        "ready_for_pickup": "طلبك جاهز",
        "out_for_delivery": "طلبك في الطريق إليك",
        "delivered": "تم تسليم طلبك بنجاح",
        "cancelled": "تم إلغاء طلبك",
    }

    message = status_messages.get(new_status, f"تم تحديث حالة طلبك إلى: {new_status}")
    NotificationService.notify_user(
        user=order.buyer,
        title="تحديث طلبك",
        body=message,
        notification_type="order_status",
    )
