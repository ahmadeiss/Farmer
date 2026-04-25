"""
Auth serializers: registration, login, profile update, OTP scaffold.
"""
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """User registration — validates and creates account.
    The view generates tokens after saving; this serializer no longer
    includes a `tokens` field so the response stays clean.
    """

    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "id", "full_name", "phone", "email", "role",
            "is_active", "is_verified", "created_at",
            "password", "password_confirm",
        ]
        read_only_fields = ["id", "is_active", "is_verified", "created_at"]
        extra_kwargs = {
            "role": {"required": True},
            "email": {"required": False},
        }

    def validate_role(self, value):
        if value in (User.Role.ADMIN, User.Role.DRIVER):
            raise serializers.ValidationError("لا يمكن التسجيل بهذا الدور.")
        return value

    def validate_phone(self, value):
        # Normalize phone: strip spaces
        normalized = value.strip().replace(" ", "")
        if User.objects.filter(phone=normalized).exists():
            raise serializers.ValidationError("رقم الهاتف مسجّل مسبقاً.")
        return normalized

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "كلمات المرور غير متطابقة."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        role = validated_data.get("role", User.Role.BUYER)
        # Farmers start as inactive — must be approved by admin before they can log in
        if role == User.Role.FARMER:
            validated_data["is_active"] = False
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Phone + password login."""

    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        phone = attrs.get("phone", "").strip()
        password = attrs.get("password")

        # Check if user exists but is inactive (pending farmer approval)
        try:
            raw_user = User.objects.get(phone=phone)
            if not raw_user.is_active:
                if raw_user.role == User.Role.FARMER:
                    raise serializers.ValidationError(
                        "حسابك كمزارع قيد المراجعة من قِبل الإدارة. "
                        "ستتلقى إشعاراً عند تفعيل حسابك."
                    )
                raise serializers.ValidationError("الحساب معطّل. يرجى التواصل مع الدعم.")
        except User.DoesNotExist:
            pass

        user = authenticate(username=phone, password=password)
        if not user:
            raise serializers.ValidationError("رقم الهاتف أو كلمة المرور غير صحيحة.")
        attrs["user"] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Read/update user profile (safe fields only)."""

    class Meta:
        model = User
        fields = [
            "id", "full_name", "phone", "email", "role",
            "is_verified", "is_active", "created_at",
        ]
        read_only_fields = ["id", "phone", "role", "is_verified", "is_active", "created_at"]


class ChangePasswordSerializer(serializers.Serializer):
    """Allow authenticated user to change their password."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("كلمة المرور الحالية غير صحيحة.")
        return value


class TokenResponseSerializer(serializers.Serializer):
    """JWT token pair response shape."""

    access = serializers.CharField()
    refresh = serializers.CharField()


class OTPRequestSerializer(serializers.Serializer):
    """
    OTP request scaffold - used for future phone verification flow.
    Currently returns a mocked OTP for development.
    """

    phone = serializers.CharField()


class OTPVerifySerializer(serializers.Serializer):
    """OTP verification scaffold."""

    phone = serializers.CharField()
    otp_code = serializers.CharField(min_length=4, max_length=6)
