from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.common.permissions import IsFarmer, IsAdmin
from .models import FarmerProfile
from .serializers import FarmerProfileSerializer, FarmerProfileUpdateSerializer, FarmerPublicSerializer


class MyFarmerProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current farmer's profile."""

    permission_classes = [IsFarmer]

    def get_object(self):
        profile, _ = FarmerProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return FarmerProfileUpdateSerializer
        return FarmerProfileSerializer


class FarmerPublicProfileView(generics.RetrieveAPIView):
    """Public profile view - accessible by buyers to see farmer info."""

    serializer_class = FarmerPublicSerializer
    permission_classes = [IsAuthenticated]
    queryset = FarmerProfile.objects.select_related("user").all()
    lookup_field = "id"


@extend_schema(tags=["Admin - Farmers"])
class FarmerListAdminView(generics.ListAPIView):
    """Admin: list all farmers."""

    serializer_class = FarmerProfileSerializer
    permission_classes = [IsAdmin]
    queryset = FarmerProfile.objects.select_related("user").filter(user__is_active=True)
    search_fields = ["farm_name", "user__full_name", "governorate", "city"]
    filterset_fields = ["governorate"]


@extend_schema(tags=["Admin - Farmers"])
class FarmerDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: view/edit/deactivate a specific farmer."""

    serializer_class = FarmerProfileSerializer
    permission_classes = [IsAdmin]
    queryset = FarmerProfile.objects.select_related("user").all()
    lookup_field = "id"
