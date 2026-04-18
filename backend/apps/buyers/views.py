from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsBuyer, IsAdmin
from .models import BuyerProfile, SubscriptionPlan, Subscription
from .serializers import (
    BuyerProfileSerializer, BuyerProfileUpdateSerializer,
    SubscriptionPlanSerializer, SubscriptionSerializer,
)


class MyBuyerProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current buyer's profile."""

    permission_classes = [IsBuyer]

    def get_object(self):
        profile, _ = BuyerProfile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return BuyerProfileUpdateSerializer
        return BuyerProfileSerializer


class SubscriptionPlanListView(generics.ListAPIView):
    """List available subscription plans (scaffold for future basket feature)."""

    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]
    queryset = SubscriptionPlan.objects.filter(is_active=True)


class MySubscriptionsView(generics.ListCreateAPIView):
    """Buyer's subscriptions (scaffold)."""

    serializer_class = SubscriptionSerializer
    permission_classes = [IsBuyer]

    def get_queryset(self):
        return Subscription.objects.filter(
            buyer__user=self.request.user
        ).select_related("plan")

    def perform_create(self, serializer):
        buyer_profile = BuyerProfile.objects.get(user=self.request.user)
        serializer.save(buyer=buyer_profile)


class BuyerListAdminView(generics.ListAPIView):
    """Admin: list all buyers."""

    serializer_class = BuyerProfileSerializer
    permission_classes = [IsAdmin]
    queryset = BuyerProfile.objects.select_related("user").filter(user__is_active=True)
    search_fields = ["user__full_name", "user__phone"]
