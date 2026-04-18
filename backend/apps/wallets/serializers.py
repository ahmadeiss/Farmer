from decimal import Decimal
from rest_framework import serializers
from .models import Wallet, WalletLedger


class WalletSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source="farmer.full_name", read_only=True)
    farmer_phone = serializers.CharField(source="farmer.phone", read_only=True)

    class Meta:
        model = Wallet
        fields = ["id", "farmer", "farmer_name", "farmer_phone", "current_balance", "updated_at"]
        read_only_fields = ["id", "farmer", "current_balance", "updated_at"]


class WalletLedgerSerializer(serializers.ModelSerializer):
    entry_type_display = serializers.CharField(source="get_entry_type_display", read_only=True)

    class Meta:
        model = WalletLedger
        fields = [
            "id", "entry_type", "entry_type_display",
            "amount", "balance_before", "balance_after",
            "reference_type", "reference_id", "description", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SettlementSerializer(serializers.Serializer):
    """Admin: mark a settlement payment."""
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    note = serializers.CharField(max_length=500, required=False, default="")
