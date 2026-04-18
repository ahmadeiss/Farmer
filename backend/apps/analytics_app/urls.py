from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.admin_dashboard_summary, name="analytics-dashboard"),
    path("top-products/", views.top_products, name="analytics-top-products"),
    path("top-farmers/", views.top_farmers, name="analytics-top-farmers"),
    path("orders-by-status/", views.orders_by_status, name="analytics-orders-status"),
    path("revenue-trend/", views.revenue_trend, name="analytics-revenue-trend"),
    path("low-stock/", views.low_stock_summary, name="analytics-low-stock"),
    path("categories/", views.category_breakdown, name="analytics-categories"),
    path("farmer-summary/", views.farmer_summary, name="analytics-farmer-summary"),
]
