from django.contrib import admin
from .models import BuyerProfile, SubscriptionPlan, Subscription


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "default_address", "created_at"]
    search_fields = ["user__phone", "user__full_name"]
    raw_id_fields = ["user"]


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ["name_ar", "price", "frequency", "is_active"]
    list_filter = ["is_active", "frequency"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["buyer", "plan", "status", "start_date", "end_date"]
    list_filter = ["status"]
