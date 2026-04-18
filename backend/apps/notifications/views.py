from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
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
