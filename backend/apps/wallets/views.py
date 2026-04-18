from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.common.exceptions import BusinessLogicError
from apps.common.permissions import IsFarmer, IsAdmin
from .models import Wallet, WalletLedger
from .serializers import WalletSerializer, WalletLedgerSerializer, SettlementSerializer
from .services import WalletService


class MyWalletView(generics.RetrieveAPIView):
    """Farmer: view their wallet balance."""

    serializer_class = WalletSerializer
    permission_classes = [IsFarmer]

    def get_object(self):
        return WalletService.get_or_create_wallet(self.request.user)


class MyWalletLedgerView(generics.ListAPIView):
    """Farmer: view their ledger history."""

    serializer_class = WalletLedgerSerializer
    permission_classes = [IsFarmer]

    def get_queryset(self):
        return WalletLedger.objects.filter(
            wallet__farmer=self.request.user
        ).order_by("-created_at")


class AdminWalletListView(generics.ListAPIView):
    """Admin: list all farmer wallets."""

    serializer_class = WalletSerializer
    permission_classes = [IsAdmin]
    search_fields = ["farmer__full_name", "farmer__phone"]

    def get_queryset(self):
        return Wallet.objects.select_related("farmer").all()


class AdminWalletLedgerView(generics.ListAPIView):
    """Admin: view ledger for a specific farmer."""

    serializer_class = WalletLedgerSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["entry_type"]

    def get_queryset(self):
        return WalletLedger.objects.filter(
            wallet__farmer_id=self.kwargs["farmer_id"]
        ).order_by("-created_at")


@api_view(["POST"])
@permission_classes([IsAdmin])
def settle_wallet_view(request, farmer_id):
    """Admin: mark a cash settlement for a farmer."""
    try:
        wallet = Wallet.objects.get(farmer_id=farmer_id)
    except Wallet.DoesNotExist:
        return Response({"error": "المحفظة غير موجودة."}, status=status.HTTP_404_NOT_FOUND)

    serializer = SettlementSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        entry = WalletService.mark_settled(
            wallet=wallet,
            amount=serializer.validated_data["amount"],
            admin_user=request.user,
            note=serializer.validated_data.get("note", ""),
        )
    except BusinessLogicError as e:
        return Response({"error": e.message}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        "message": "تمت التسوية بنجاح.",
        "entry": WalletLedgerSerializer(entry).data,
    })
