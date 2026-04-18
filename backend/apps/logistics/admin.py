from django.contrib import admin

from .models import DeliveryAssignment


@admin.register(DeliveryAssignment)
class DeliveryAssignmentAdmin(admin.ModelAdmin):
    list_display = ["order", "delivery_mode", "assigned_to", "status", "pickup_time", "delivered_time"]
    list_filter = ["delivery_mode", "status"]
    raw_id_fields = ["order", "assigned_to"]
