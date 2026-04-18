from django.contrib import admin
from .models import FarmerProfile


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "farm_name", "governorate", "city", "preferred_payout_method", "created_at"]
    search_fields = ["user__phone", "user__full_name", "farm_name", "governorate"]
    list_filter = ["governorate", "preferred_payout_method"]
    raw_id_fields = ["user"]
