"""
Custom User model - the foundation of all authentication in Smart Hasaad.
Phone-first, role-based. Architecture is OTP-ready even if currently using password auth.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Core user model for Smart Hasaad.
    Supports roles: farmer, buyer, admin, driver (future).
    Phone is the primary identifier; email is optional.
    """

    class Role(models.TextChoices):
        FARMER = "farmer", "مزارع"
        BUYER = "buyer", "مشتري"
        ADMIN = "admin", "مسؤول"
        DRIVER = "driver", "سائق"  # Future-ready

    # Identity
    full_name = models.CharField(max_length=150, verbose_name="الاسم الكامل")
    phone = models.CharField(max_length=20, unique=True, db_index=True, verbose_name="رقم الهاتف")
    email = models.EmailField(blank=True, null=True, unique=True, verbose_name="البريد الإلكتروني")

    # Role
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.BUYER,
        db_index=True,
        verbose_name="الدور",
    )

    # Status
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    is_verified = models.BooleanField(default=False, verbose_name="موثق", db_index=True)
    is_staff = models.BooleanField(default=False, verbose_name="موظف")

    # OTP scaffold: stores hashed OTP + expiry for phone verification
    otp_secret = models.CharField(max_length=128, blank=True, null=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "مستخدم"
        verbose_name_plural = "المستخدمون"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["phone", "role"]),
            models.Index(fields=["role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.phone}) [{self.role}]"

    @property
    def is_farmer(self):
        return self.role == self.Role.FARMER

    @property
    def is_buyer(self):
        return self.role == self.Role.BUYER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_staff

    def update_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=["last_login"])
