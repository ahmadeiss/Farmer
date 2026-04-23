"""
JWT WebSocket Middleware for Django Channels.

Usage in asgi.py:
    from apps.notifications.jwt_middleware import JwtAuthMiddlewareStack

Reads the JWT access token from the query string:
    wss://backend/ws/notifications/?token=<access_token>

Attaches the authenticated user to scope["user"] so the consumer
can check user.is_authenticated normally.
"""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _get_user_from_token(token_str: str):
    """Validate JWT access token and return the matching User or AnonymousUser."""
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
        from django.contrib.auth import get_user_model

        User = get_user_model()
        token = AccessToken(token_str)
        user_id = token.get("user_id")
        if user_id is None:
            return AnonymousUser()
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    """
    Channels middleware that authenticates WebSocket connections via JWT.
    Token is expected as a query-string parameter: ?token=<access_jwt>
    """

    async def __call__(self, scope, receive, send):
        # Parse ?token= from query string
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        if token_list:
            scope["user"] = await _get_user_from_token(token_list[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    """Drop-in replacement for AuthMiddlewareStack using JWT."""
    return JwtAuthMiddleware(inner)
