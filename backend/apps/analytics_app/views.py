"""Analytics views: admin dashboard data endpoints."""
from django.core.cache import cache
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.common.permissions import IsAdmin, IsFarmer
from .services import AnalyticsService


def cached_response(key: str, fn):
    """Helper to cache analytics responses."""
    ttl = settings.ANALYTICS_CACHE_TIMEOUT_SECONDS
    result = cache.get(key)
    if result is None:
        result = fn()
        cache.set(key, result, ttl)
    return result


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_dashboard_summary(request):
    """Admin: high-level operational dashboard."""
    data = cached_response("analytics:dashboard", AnalyticsService.get_dashboard_summary)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdmin])
def top_products(request):
    """Admin: top selling products."""
    limit = int(request.query_params.get("limit", 10))
    data = AnalyticsService.get_top_products(limit=limit)
    return Response({"results": data})


@api_view(["GET"])
@permission_classes([IsAdmin])
def top_farmers(request):
    """Admin: top farmers by revenue."""
    limit = int(request.query_params.get("limit", 10))
    data = AnalyticsService.get_top_farmers(limit=limit)
    return Response({"results": data})


@api_view(["GET"])
@permission_classes([IsAdmin])
def orders_by_status(request):
    """Admin: order count breakdown by status."""
    data = cached_response("analytics:orders_status", AnalyticsService.get_orders_by_status)
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdmin])
def revenue_trend(request):
    """Admin: daily revenue trend."""
    days = int(request.query_params.get("days", 30))
    data = AnalyticsService.get_revenue_trend(days=days)
    return Response({"results": list(data)})


@api_view(["GET"])
@permission_classes([IsAdmin])
def low_stock_summary(request):
    """Admin: all low-stock products."""
    data = AnalyticsService.get_low_stock_summary()
    return Response({"results": data})


@api_view(["GET"])
@permission_classes([IsAdmin])
def category_breakdown(request):
    """Admin: sales by category."""
    data = AnalyticsService.get_category_breakdown()
    return Response({"results": data})


@api_view(["GET"])
@permission_classes([IsFarmer])
def farmer_summary(request):
    """Farmer: personal sales summary."""
    from apps.orders.models import Order
    from django.db.models import Sum, Count

    farmer = request.user
    orders = Order.objects.filter(farmer=farmer, status="delivered")

    return Response({
        "total_orders": orders.count(),
        "total_revenue": float(orders.aggregate(total=Sum("subtotal"))["total"] or 0),
        "pending_orders": Order.objects.filter(farmer=farmer, status="pending").count(),
        "in_progress_orders": Order.objects.filter(
            farmer=farmer, status__in=["confirmed", "preparing", "ready_for_pickup", "out_for_delivery"]
        ).count(),
    })
