from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["phone", "full_name", "role", "is_active", "is_verified", "created_at"]
    list_filter = ["role", "is_active", "is_verified", "is_staff"]
    search_fields = ["phone", "full_name", "email"]
    ordering = ["-created_at"]
    readonly_fields = ["created_at", "updated_at", "last_login"]

    fieldsets = (
        (_("بيانات الحساب"), {"fields": ("phone", "password")}),
        (_("المعلومات الشخصية"), {"fields": ("full_name", "email")}),
        (_("الصلاحيات"), {"fields": ("role", "is_active", "is_verified", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("التواريخ"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "full_name", "role", "password1", "password2"),
        }),
    )
