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

from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    ChangePasswordSerializer, OTPRequestSerializer, OTPVerifySerializer,
)

logger = logging.getLogger(__name__)


@extend_schema(request=RegisterSerializer, responses={201: RegisterSerializer}, tags=["Auth"])
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new farmer or buyer account.
    Returns the same shape as login: { user, access, refresh }
    """
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    user.update_last_login()
    logger.info(f"New user registered: {user.phone} role={user.role}")

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
