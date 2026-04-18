from django.contrib import admin
from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ["order", "provider", "status", "amount", "created_at"]
    list_filter = ["status", "provider"]
    search_fields = ["order__id", "gateway_reference"]
    raw_id_fields = ["order", "recorded_by"]
    readonly_fields = ["created_at", "updated_at"]
