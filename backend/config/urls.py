"""
Smart Hasaad - Root URL Configuration
All API routes are versioned under /api/v1/
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

# Admin customization
admin.site.site_header = "حصاد الذكي - Smart Hasaad"
admin.site.site_title = "Smart Hasaad Admin"
admin.site.index_title = "لوحة التحكم"

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/", include([
        path("auth/", include("apps.accounts.urls")),
        path("farmers/", include("apps.farmers.urls")),
        path("buyers/", include("apps.buyers.urls")),
        path("catalog/", include("apps.catalog.urls")),
        path("inventory/", include("apps.inventory.urls")),
        path("orders/", include("apps.orders.urls")),
        path("payments/", include("apps.payments.urls")),
        path("wallets/", include("apps.wallets.urls")),
        path("logistics/", include("apps.logistics.urls")),
        path("analytics/", include("apps.analytics_app.urls")),
        path("notifications/", include("apps.notifications.urls")),
    ])),

    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
