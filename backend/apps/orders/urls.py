from django.urls import path
from . import views

urlpatterns = [
    # Cart
    path("cart/", views.cart_view, name="cart"),
    path("cart/add/", views.add_to_cart_view, name="cart-add"),
    path("cart/remove/<int:product_id>/", views.remove_from_cart_view, name="cart-remove"),
    path("cart/clear/", views.clear_cart_view, name="cart-clear"),

    # Checkout
    path("checkout/", views.checkout_view, name="checkout"),

    # Buyer orders
    path("my-orders/", views.BuyerOrderListView.as_view(), name="buyer-orders"),
    path("my-orders/<int:pk>/", views.BuyerOrderDetailView.as_view(), name="buyer-order-detail"),

    # Farmer orders
    path("farmer-orders/", views.FarmerOrderListView.as_view(), name="farmer-orders"),
    path("farmer-orders/<int:pk>/", views.FarmerOrderDetailView.as_view(), name="farmer-order-detail"),
    path("farmer-orders/<int:order_id>/status/", views.update_order_status_view, name="order-status-update"),

    # QR confirmation (via scanned token)
    path("confirm-qr/<uuid:qr_token>/", views.confirm_qr_view, name="confirm-qr"),

    # Manual receipt confirmation by buyer (fallback when QR scan isn't possible)
    path("my-orders/<int:order_id>/confirm-receipt/", views.buyer_confirm_receipt_view, name="buyer-confirm-receipt"),

    # Reviews
    path("reviews/", views.ReviewCreateView.as_view(), name="review-create"),

    # Admin
    path("admin/orders/", views.AdminOrderListView.as_view(), name="admin-orders"),
    path("admin/orders/<int:pk>/", views.AdminOrderDetailView.as_view(), name="admin-order-detail"),
    path("admin/orders/<int:order_id>/status/", views.update_order_status_view, name="admin-order-status"),
]
