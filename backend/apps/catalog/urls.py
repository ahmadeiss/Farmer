from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"my-products", views.FarmerProductViewSet, basename="farmer-product")
router.register(r"admin/products", views.AdminProductViewSet, basename="admin-product")

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("products/", views.MarketplaceProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("", include(router.urls)),
]
