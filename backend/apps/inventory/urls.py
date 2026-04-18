from django.urls import path
from . import views

urlpatterns = [
    path("products/<int:product_id>/movements/", views.ProductMovementListView.as_view(), name="product-movements"),
    path("products/<int:product_id>/add-stock/", views.add_stock_view, name="product-add-stock"),
    path("low-stock/", views.LowStockAlertView.as_view(), name="low-stock-farmer"),
    path("admin/low-stock/", views.AdminLowStockView.as_view(), name="admin-low-stock"),
    path("admin/movements/", views.AdminMovementListView.as_view(), name="admin-movements"),
]
