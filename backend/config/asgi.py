"""
Smart Hasaad ASGI Configuration
Handles both HTTP (Django) and WebSocket (Django Channels) connections.

WebSocket authentication: JWT token passed as query param ?token=<access_jwt>
AllowedHostsOriginValidator is intentionally omitted so that cross-origin
WebSocket connections from Vercel frontends are not blocked (CORS is handled
at the HTTP layer by django-cors-headers).
"""
import os

import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

# Import after setup to avoid AppRegistryNotReady
from apps.notifications.routing import websocket_urlpatterns  # noqa: E402
from apps.notifications.jwt_middleware import JwtAuthMiddlewareStack  # noqa: E402

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JwtAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
