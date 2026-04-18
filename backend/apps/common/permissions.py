"""
Role-based permission classes used across the API.
"""
from rest_framework.permissions import BasePermission


class IsFarmer(BasePermission):
    """Allows access only to users with role='farmer'."""

    message = "هذه الصفحة مخصصة للمزارعين فقط."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "farmer")


class IsBuyer(BasePermission):
    """Allows access only to users with role='buyer'."""

    message = "هذه الصفحة مخصصة للمشترين فقط."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "buyer")


class IsAdmin(BasePermission):
    """Allows access only to users with role='admin' or is_staff."""

    message = "هذه الصفحة مخصصة للمسؤولين فقط."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == "admin" or request.user.is_staff)
        )


class IsDriver(BasePermission):
    """Allows access only to users with role='driver'."""

    message = "هذه الصفحة مخصصة للسائقين فقط."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "driver")


class IsFarmerOrAdmin(BasePermission):
    """Allows farmers and admins."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("farmer", "admin")
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner of the object or admin."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin" or request.user.is_staff:
            return True
        # Try common ownership patterns
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "buyer") and hasattr(obj.buyer, "user"):
            return obj.buyer.user == request.user
        if hasattr(obj, "farmer") and hasattr(obj.farmer, "user"):
            return obj.farmer.user == request.user
        return False
