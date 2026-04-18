"""
Auth serializers: registration, login, profile update, OTP scaffold.
"""
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """User registration - creates account and returns JWT tokens."""

    password = serializers.CharField(write_only=True, min_length=8)
    tokens = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "full_name", "phone", "email", "role",
            "is_active", "is_verified", "created_at",
            "password", "tokens",
        ]
        read_only_fields = ["id", "is_active", "is_verified", "created_at"]
        extra_kwargs = {
            "role": {"required": True},
            "email": {"required": False},
        }

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("لا يمكن التسجيل كمسؤول.")
        return value

    def validate_phone(self, value):
        # Normalize phone: strip spaces
        return value.strip().replace(" ", "")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class LoginSerializer(serializers.Serializer):
    """Phone + password login."""

    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        phone = attrs.get("phone", "").strip()
        password = attrs.get("password")
        user = authenticate(username=phone, password=password)
        if not user:
            raise serializers.ValidationError("رقم الهاتف أو كلمة المرور غير صحيحة.")
        if not user.is_active:
            raise serializers.ValidationError("الحساب معطّل. يرجى التواصل مع الدعم.")
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
