from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer


class MyNotificationsView(generics.ListAPIView):
    """List user's notifications."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        unread_only = self.request.query_params.get("unread_only")
        if unread_only == "true":
            qs = qs.filter(is_read=False)
        return qs


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_read_view(request):
    """Mark all of current user's notifications as read."""
    count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"message": f"تم تعليم {count} إشعار كمقروء."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read_view(request, pk):
    """Mark a single notification as read."""
    try:
        notification = Notification.objects.get(id=pk, user=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"message": "تم تعليمه كمقروء."})
    except Notification.DoesNotExist:
        return Response({"error": "الإشعار غير موجود."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count_view(request):
    """Get unread notification count for badge display."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({"unread_count": count})


# ── Web Push API ──────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def vapid_public_key_view(request):
    """Return the VAPID public key so the frontend can subscribe to push."""
    public_key = settings.VAPID_PUBLIC_KEY
    if not public_key:
        return Response(
            {"error": "Web Push not configured on this server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response({"vapid_public_key": public_key})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def push_subscribe_view(request):
    """
    Save (or reactivate) a browser push subscription for the current user.

    Expected body:
      {
        "endpoint": "https://fcm.googleapis.com/...",
        "keys": { "p256dh": "...", "auth": "..." }
      }
    """
    endpoint = request.data.get("endpoint", "").strip()
    keys = request.data.get("keys", {})
    p256dh = keys.get("p256dh", "").strip()
    auth = keys.get("auth", "").strip()

    if not endpoint or not p256dh or not auth:
        return Response(
            {"error": "endpoint, keys.p256dh, and keys.auth are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            "user": request.user,
            "p256dh": p256dh,
            "auth": auth,
            "user_agent": user_agent,
            "is_active": True,
        },
    )

    return Response(
        {"subscribed": True, "created": created},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def push_unsubscribe_view(request):
    """Remove a browser push subscription."""
    endpoint = request.data.get("endpoint", "").strip()
    if not endpoint:
        return Response(
            {"error": "endpoint is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    deleted, _ = PushSubscription.objects.filter(
        user=request.user, endpoint=endpoint
    ).delete()

    return Response({"unsubscribed": True, "deleted": deleted > 0})
