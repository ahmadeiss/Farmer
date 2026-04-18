from django.contrib import admin
from .models import Wallet, WalletLedger


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ["farmer", "current_balance", "updated_at"]
    search_fields = ["farmer__full_name", "farmer__phone"]
    readonly_fields = ["current_balance", "created_at", "updated_at"]


@admin.register(WalletLedger)
class WalletLedgerAdmin(admin.ModelAdmin):
    list_display = ["wallet", "entry_type", "amount", "balance_before", "balance_after", "created_at"]
    list_filter = ["entry_type"]
    search_fields = ["wallet__farmer__full_name", "description"]
    readonly_fields = ["balance_before", "balance_after", "created_at"]
    ordering = ["-created_at"]
