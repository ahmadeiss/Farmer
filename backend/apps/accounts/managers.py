"""
Custom UserManager for phone-based authentication.
"""
from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):
    """Manager for the custom User model using phone as USERNAME_FIELD."""

    def create_user(self, phone, full_name, password=None, **extra_fields):
        if not phone:
            raise ValueError("رقم الهاتف مطلوب")
        if not full_name:
            raise ValueError("الاسم الكامل مطلوب")

        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        user = self.model(phone=phone, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields["role"] = "admin"

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(phone, full_name, password, **extra_fields)

    def farmers(self):
        return self.filter(role="farmer", is_active=True)

    def buyers(self):
        return self.filter(role="buyer", is_active=True)

    def admins(self):
        return self.filter(role="admin", is_active=True)
