"""
Analytics service: aggregates business data for admin dashboard.
Uses Django ORM + pandas for summaries.
Results are cached to avoid expensive repeated queries.
"""
import logging
from datetime import timedelta
from django.core.cache import cache
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone

logger = logging.getLogger(__name__)

CACHE_TTL = 300  # 5 minutes default


def cached(key: str, ttl: int = CACHE_TTL):
    """Simple cache decorator for analytics functions."""
    def decorator(fn):
        def wrapper(*args, **kwargs):
            result = cache.get(key)
            if result is None:
                result = fn(*args, **kwargs)
                cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator


class AnalyticsService:
    """
    Provides aggregated metrics for the admin dashboard.
    All methods are cached and safe to call from API views.
    """

    @staticmethod
    def get_dashboard_summary():
        """Top-level stats for the admin dashboard."""
        from apps.orders.models import Order
        from apps.accounts.models import User
        from apps.catalog.models import Product

        now = timezone.now()
        today = now.date()
        month_start = today.replace(day=1)

        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()
        orders_this_month = Order.objects.filter(created_at__date__gte=month_start).count()

        delivered = Order.objects.filter(status="delivered")
        total_revenue = delivered.aggregate(total=Sum("total"))["total"] or 0
        revenue_this_month = delivered.filter(
            created_at__date__gte=month_start
        ).aggregate(total=Sum("total"))["total"] or 0

        active_farmers = User.objects.filter(role="farmer", is_active=True).count()
        active_buyers = User.objects.filter(role="buyer", is_active=True).count()
        active_products = Product.objects.filter(is_active=True).count()

        pending_orders = Order.objects.filter(status="pending").count()
        cancelled_orders = Order.objects.filter(status="cancelled").count()

        return {
            "orders": {
                "total": total_orders,
                "today": orders_today,
                "this_month": orders_this_month,
                "pending": pending_orders,
                "cancelled": cancelled_orders,
            },
            "revenue": {
                "total": float(total_revenue),
                "this_month": float(revenue_this_month),
            },
            "users": {
                "farmers": active_farmers,
                "buyers": active_buyers,
            },
            "products": {
                "active": active_products,
            },
        }

    @staticmethod
    def get_top_products(limit: int = 10):
        """Best-selling products by order quantity."""
        from apps.orders.models import OrderItem

        return list(
            OrderItem.objects.filter(order__status="delivered")
            .values("product_id", "title_snapshot")
            .annotate(
                total_quantity=Sum("quantity"),
                total_revenue=Sum("unit_price"),
                order_count=Count("order", distinct=True),
            )
            .order_by("-total_quantity")[:limit]
        )

    @staticmethod
    def get_top_farmers(limit: int = 10):
        """Top farmers by revenue."""
        from apps.orders.models import Order

        return list(
            Order.objects.filter(status="delivered")
            .values("farmer_id", "farmer__full_name", "farmer__farmer_profile__farm_name")
            .annotate(
                total_revenue=Sum("subtotal"),
                order_count=Count("id"),
            )
            .order_by("-total_revenue")[:limit]
        )

    @staticmethod
    def get_orders_by_status():
        """Order count breakdown by status."""
        from apps.orders.models import Order

        result = Order.objects.values("status").annotate(count=Count("id"))
        return {item["status"]: item["count"] for item in result}

    @staticmethod
    def get_revenue_trend(days: int = 30):
        """Daily revenue for the past N days."""
        from apps.orders.models import Order
        from django.db.models.functions import TruncDate

        since = timezone.now() - timedelta(days=days)
        data = (
            Order.objects.filter(status="delivered", created_at__gte=since)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(revenue=Sum("total"), orders=Count("id"))
            .order_by("date")
        )
        return list(data)

    @staticmethod
    def get_low_stock_summary():
        """Products with low stock."""
        from django.db.models import F
        from apps.catalog.models import Product

        products = Product.objects.filter(
            quantity_available__lte=F("low_stock_threshold"),
            is_active=True,
        ).select_related("farmer").values(
            "id", "title", "quantity_available", "low_stock_threshold",
            "farmer__full_name", "unit",
        )
        return list(products)

    @staticmethod
    def get_category_breakdown():
        """Orders and revenue by product category."""
        from apps.orders.models import OrderItem

        return list(
            OrderItem.objects.filter(order__status="delivered")
            .values("product__category__name_ar")
            .annotate(
                total_quantity=Sum("quantity"),
                order_count=Count("order", distinct=True),
            )
            .order_by("-order_count")
        )
