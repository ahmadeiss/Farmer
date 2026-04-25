"""
Auth views: register, login, logout, profile, OTP scaffold.
"""
import logging
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.common.permissions import IsAdmin
from .models import User
from .serializers import (
    RegisterSerializer, AdminUserCreateSerializer, LoginSerializer,
    UserProfileSerializer, ChangePasswordSerializer,
    OTPRequestSerializer, OTPVerifySerializer,
)

logger = logging.getLogger(__name__)


@extend_schema(request=RegisterSerializer, responses={201: RegisterSerializer}, tags=["Auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new farmer or buyer account.
    Buyers: auto-activated, returns { user, access, refresh }
    Farmers: pending admin approval, returns { pending: true, message }
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    logger.info(f"New user registered: {user.phone} role={user.role}")

    # Farmers require admin approval before accessing the platform
    if user.role == "farmer":
        # Notify admins about the pending registration
        try:
            from apps.notifications.services import NotificationService
            from .models import User as UserModel
            admin_users = UserModel.objects.filter(role="admin", is_active=True)
            for admin in admin_users:
                NotificationService.notify_user(
                    user=admin,
                    title="🌾 طلب تسجيل مزارع جديد",
                    body=f"تسجّل {user.full_name} ({user.phone}) كمزارع ويحتاج لمراجعة وتفعيل.",
                    notification_type="general",
                    data={"farmer_user_id": user.id, "action": "farmer_approval"},
                )
        except Exception as exc:
            logger.warning(f"Could not notify admins of new farmer registration: {exc}")

        return Response(
            {
                "pending": True,
                "message": (
                    "تم استلام طلب تسجيلك كمزارع بنجاح! "
                    "سيقوم فريقنا بمراجعة بياناتك وتفعيل حسابك خلال 24 ساعة. "
                    "ستتلقى إشعاراً عند تفعيل الحساب."
                ),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # Buyers: auto-activate and return tokens
    user.update_last_login()
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@extend_schema(request=LoginSerializer, tags=["Auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate with phone + password, returns JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    user.update_last_login()

    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserProfileSerializer(user).data,
    })


@extend_schema(tags=["Auth"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Blacklist the refresh token (logout)."""
    try:
        token = RefreshToken(request.data.get("refresh"))
        token.blacklist()
        return Response({"message": "تم تسجيل الخروج بنجاح."})
    except Exception:
        return Response({"error": "رمز غير صالح."}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(request=ChangePasswordSerializer, tags=["Auth"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change the authenticated user's password."""
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save(update_fields=["password", "updated_at"])
    return Response({"message": "تم تغيير كلمة المرور بنجاح."})


@extend_schema(request=OTPRequestSerializer, tags=["Auth - OTP"])
@api_view(["POST"])
@permission_classes([AllowAny])
def otp_request_view(request):
    """
    OTP Request (Scaffold).
    In production: sends real SMS via OTP provider.
    In mock mode: returns OTP in response for testing.
    """
    from django.conf import settings
    import random, hashlib

    serializer = OTPRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data["phone"]

    otp_code = str(random.randint(1000, 9999))
    expires_at = timezone.now() + timezone.timedelta(minutes=10)

    try:
        user = User.objects.get(phone=phone)
        user.otp_secret = hashlib.sha256(otp_code.encode()).hexdigest()
        user.otp_expires_at = expires_at
        user.save(update_fields=["otp_secret", "otp_expires_at"])
    except User.DoesNotExist:
        pass  # Don't reveal if user exists

    response_data = {"message": "تم إرسال رمز التحقق."}
    if settings.OTP_PROVIDER == "mock":
        response_data["otp_code"] = otp_code  # Only in mock/dev mode!

    return Response(response_data)


@extend_schema(request=OTPVerifySerializer, tags=["Auth - OTP"])
@api_view(["POST"])
@permission_classes([AllowAny])
def otp_verify_view(request):
    """Verify OTP and mark user as verified."""
    import hashlib

    serializer = OTPVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    phone = serializer.validated_data["phone"]
    otp_code = serializer.validated_data["otp_code"]

    try:
        user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        return Response({"error": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    if not user.otp_secret or not user.otp_expires_at:
        return Response({"error": "لم يتم طلب رمز تحقق."}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > user.otp_expires_at:
        return Response({"error": "انتهت صلاحية رمز التحقق."}, status=status.HTTP_400_BAD_REQUEST)

    hashed = hashlib.sha256(otp_code.encode()).hexdigest()
    if hashed != user.otp_secret:
        return Response({"error": "رمز التحقق غير صحيح."}, status=status.HTTP_400_BAD_REQUEST)

    user.is_verified = True
    user.otp_secret = None
    user.otp_expires_at = None
    user.save(update_fields=["is_verified", "otp_secret", "otp_expires_at"])

    refresh = RefreshToken.for_user(user)
    return Response({
        "message": "تم التحقق بنجاح.",
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    })


# ── Admin: User Management ─────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_pending_farmers_view(request):
    """Admin: list all farmers pending approval (is_active=False)."""
    farmers = User.objects.filter(role=User.Role.FARMER, is_active=False).order_by("-created_at")
    data = [UserProfileSerializer(u).data for u in farmers]
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_all_users_view(request):
    """Admin: list all users with optional role/status filters."""
    role = request.query_params.get("role")
    is_active = request.query_params.get("is_active")
    search = request.query_params.get("search", "").strip()

    qs = User.objects.all().order_by("-created_at")
    if role:
        qs = qs.filter(role=role)
    if is_active is not None:
        qs = qs.filter(is_active=(is_active.lower() == "true"))
    if search:
        from django.db.models import Q
        qs = qs.filter(Q(full_name__icontains=search) | Q(phone__icontains=search))

    data = [UserProfileSerializer(u).data for u in qs[:100]]
    return Response({"count": qs.count(), "results": data})


@api_view(["POST"])
@permission_classes([IsAdmin])
def admin_approve_farmer_view(request, user_id):
    """Admin: approve a pending farmer account."""
    try:
        farmer = User.objects.get(id=user_id, role=User.Role.FARMER)
    except User.DoesNotExist:
        return Response({"error": "المزارع غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    farmer.is_active = True
    farmer.is_verified = True
    farmer.save(update_fields=["is_active", "is_verified", "updated_at"])

    # Notify the farmer their account has been approved
    try:
        from apps.notifications.services import NotificationService
        NotificationService.notify_user(
            user=farmer,
            title="🎉 تم تفعيل حسابك!",
            body="تهانينا! تمت الموافقة على حسابك كمزارع في منصة حصاد. يمكنك الآن تسجيل الدخول وإضافة منتجاتك.",
            notification_type="general",
            data={"action": "farmer_approved"},
        )
    except Exception as exc:
        logger.warning(f"Could not notify farmer #{farmer.id} of approval: {exc}")

    logger.info(f"Farmer {farmer.phone} approved by admin {request.user.phone}")
    return Response({
        "message": f"تم تفعيل حساب المزارع {farmer.full_name} بنجاح.",
        "user": UserProfileSerializer(farmer).data,
    })


@api_view(["POST"])
@permission_classes([IsAdmin])
def admin_reject_farmer_view(request, user_id):
    """Admin: reject/delete a pending farmer account."""
    try:
        farmer = User.objects.get(id=user_id, role=User.Role.FARMER)
    except User.DoesNotExist:
        return Response({"error": "المزارع غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    reason = request.data.get("reason", "لم تستوفِ بياناتك شروط التسجيل.")
    farmer_name = farmer.full_name
    farmer_phone = farmer.phone

    # Hard delete the account (or you could soft-delete by setting is_active=False permanently)
    farmer.delete()

    logger.info(f"Farmer {farmer_phone} registration rejected by admin {request.user.phone}. Reason: {reason}")
    return Response({
        "message": f"تم رفض وحذف طلب تسجيل المزارع {farmer_name}.",
        "reason": reason,
    })


@api_view(["POST"])
@permission_classes([IsAdmin])
def admin_create_user_view(request):
    """Admin: create a user with any role (including admin/driver)."""
    serializer = AdminUserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    logger.info(f"Admin {request.user.phone} created user {user.phone} role={user.role}")
    return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAdmin])
def admin_delete_user_view(request, user_id):
    """Admin: permanently delete a user account."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    if user.role == "admin" and not request.user.is_staff:
        return Response({"error": "لا يمكن حذف حساب مسؤول آخر."}, status=status.HTTP_403_FORBIDDEN)
    if user.id == request.user.id:
        return Response({"error": "لا يمكنك حذف حسابك الخاص."}, status=status.HTTP_400_BAD_REQUEST)

    user_name = user.full_name
    user.delete()
    logger.info(f"Admin {request.user.phone} deleted user {user_id} ({user_name})")
    return Response({"message": f"تم حذف المستخدم {user_name} بنجاح."})


@api_view(["PATCH"])
@permission_classes([IsAdmin])
def admin_toggle_user_view(request, user_id):
    """Admin: activate or deactivate any user account."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)

    if user.role == "admin" and not request.user.is_staff:
        return Response({"error": "لا يمكن تعطيل حساب مسؤول آخر."}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get("action", "toggle")
    if action == "activate":
        user.is_active = True
    elif action == "deactivate":
        user.is_active = False
    else:
        user.is_active = not user.is_active

    user.save(update_fields=["is_active", "updated_at"])
    state = "مفعّل" if user.is_active else "معطّل"
    logger.info(f"User {user.phone} {state} by admin {request.user.phone}")
    return Response({
        "message": f"تم تغيير حالة الحساب. الحساب الآن {state}.",
        "user": UserProfileSerializer(user).data,
    })
