from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.common.exceptions import BusinessLogicError
from apps.common.permissions import IsDriver, IsFarmerOrAdmin
from apps.notifications.services import NotificationService
from apps.orders.models import Order
from apps.orders.services import OrderService
from .models import DeliveryAssignment
from .serializers import (
    DeliveryAssignmentSerializer,
    DeliveryAssignmentUpdateSerializer,
    DriverDashboardSummarySerializer,
    DriverOptionSerializer,
)


class MyDeliveriesView(generics.ListAPIView):
    """Driver: list deliveries assigned to them."""

    serializer_class = DeliveryAssignmentSerializer
    permission_classes = [IsDriver]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        queryset = (
            DeliveryAssignment.objects.filter(
                assigned_to=self.request.user,
                delivery_mode=DeliveryAssignment.DeliveryMode.DRIVER,
            )
            .select_related("assigned_to", "order__buyer", "order__farmer")
            .prefetch_related("order__items")
            .order_by("-created_at")
        )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class DriverDashboardSummaryView(APIView):
    """Driver: KPI summary for the dashboard."""

    permission_classes = [IsDriver]

    def get(self, request):
        today = timezone.localdate()
        base_queryset = DeliveryAssignment.objects.filter(
            assigned_to=request.user,
            delivery_mode=DeliveryAssignment.DeliveryMode.DRIVER,
        )

        stats = base_queryset.aggregate(
            assigned=Count("id", filter=Q(status=DeliveryAssignment.Status.ASSIGNED)),
            picked_up=Count("id", filter=Q(status=DeliveryAssignment.Status.PICKED_UP)),
            delivered_today=Count("id", filter=Q(delivered_time__date=today)),
            active_deliveries=Count(
                "id",
                filter=Q(status__in=[DeliveryAssignment.Status.ASSIGNED, DeliveryAssignment.Status.PICKED_UP]),
            ),
        )
        return Response(DriverDashboardSummarySerializer(stats).data)


class AvailableDriversView(generics.ListAPIView):
    """Farmer/Admin: search drivers in the system."""

    serializer_class = DriverOptionSerializer
    permission_classes = [IsFarmerOrAdmin]

    def get_queryset(self):
        search = self.request.query_params.get("search", "").strip()
        queryset = User.objects.filter(role=User.Role.DRIVER, is_active=True).order_by("full_name")
        if search:
            queryset = queryset.filter(Q(full_name__icontains=search) | Q(phone__icontains=search))
        return queryset


@api_view(["POST"])
@permission_classes([IsFarmerOrAdmin])
def assign_delivery_view(request, order_id):
    """Farmer/Admin: assign a driver or mark order as self-delivery."""
    try:
        if request.user.role == "farmer":
            order = Order.objects.get(id=order_id, farmer=request.user)
        else:
            order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "الطلب غير موجود."}, status=404)

    serializer = DeliveryAssignmentUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    assignment, _ = DeliveryAssignment.objects.get_or_create(order=order)
    assignment.delivery_mode = serializer.validated_data["delivery_mode"]
    assignment.assigned_to = serializer.validated_data["driver"]
    assignment.notes = serializer.validated_data.get("notes", "")
    assignment.status = DeliveryAssignment.Status.ASSIGNED
    assignment.save()

    if assignment.delivery_mode == DeliveryAssignment.DeliveryMode.DRIVER and assignment.assigned_to:
        try:
            NotificationService.notify_user(
                user=assignment.assigned_to,
                title="تم إسناد طلب جديد لك",
                body=f"لديك طلب جديد للتوصيل رقم #{order.id} من {order.farmer.full_name}",
                notification_type="general",
                data={"order_id": order.id, "assignment_id": assignment.id},
            )
        except Exception:
            pass

    return Response(DeliveryAssignmentSerializer(assignment).data)


@api_view(["POST"])
@permission_classes([IsDriver])
@transaction.atomic
def mark_pickup_view(request, assignment_id):
    """Driver: mark an assigned delivery as picked up from the farmer."""
    try:
        assignment = (
            DeliveryAssignment.objects.select_for_update()
            .select_related("order", "assigned_to")
            .get(id=assignment_id)
        )
    except DeliveryAssignment.DoesNotExist:
        return Response({"error": "مهمة التوصيل غير موجودة."}, status=404)

    if assignment.assigned_to_id != request.user.id:
        return Response({"error": "هذه المهمة غير مكلَّفة لك."}, status=403)

    if assignment.delivery_mode != DeliveryAssignment.DeliveryMode.DRIVER:
        return Response({"error": "هذه المهمة توصيل ذاتي من المزرعة."}, status=400)

    if assignment.status == DeliveryAssignment.Status.PICKED_UP:
        return Response({"error": "سبق تأكيد استلام هذه المهمة."}, status=400)

    order = assignment.order
    if order.status != Order.Status.READY:
        return Response(
            {"error": "يمكن تأكيد الاستلام فقط عندما يكون الطلب جاهزاً للاستلام."},
            status=400,
        )

    try:
        OrderService.update_order_status(
            order,
            Order.Status.OUT_FOR_DELIVERY,
            actor=request.user,
        )
    except BusinessLogicError as exc:
        return Response({"error": str(exc)}, status=400)

    assignment.refresh_from_db()
    assignment.status = DeliveryAssignment.Status.PICKED_UP
    if assignment.pickup_time is None:
        assignment.pickup_time = timezone.now()
    assignment.save(update_fields=["status", "pickup_time", "updated_at"])

    try:
        NotificationService.notify_user(
            user=order.buyer,
            title="طلبك في الطريق 🚚",
            body=f"السائق {request.user.full_name} استلم طلبك #{order.id} من المزرعة.",
            notification_type="general",
            data={"order_id": order.id, "assignment_id": assignment.id},
        )
    except Exception:
        pass

    return Response(DeliveryAssignmentSerializer(assignment).data)
