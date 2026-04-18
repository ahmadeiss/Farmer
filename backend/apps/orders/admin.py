from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem, Review


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["title_snapshot", "unit_price", "quantity", "unit"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "buyer", "farmer", "status", "payment_status", "total", "created_at"]
    list_filter = ["status", "payment_status", "payment_method"]
    search_fields = ["buyer__full_name", "buyer__phone", "farmer__full_name"]
    raw_id_fields = ["buyer", "farmer"]
    readonly_fields = ["qr_token", "qr_confirmed_at", "created_at", "updated_at"]
    inlines = [OrderItemInline]
    ordering = ["-created_at"]

    fieldsets = (
        ("الأطراف", {"fields": ("buyer", "farmer")}),
        ("الحالة", {"fields": ("status", "payment_method", "payment_status")}),
        ("الماليات", {"fields": ("subtotal", "delivery_fee", "total")}),
        ("التوصيل", {"fields": ("delivery_address", "notes")}),
        ("QR", {"fields": ("qr_token", "qr_confirmed_at")}),
        ("التواريخ", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ["buyer", "item_count", "total", "updated_at"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["order", "buyer", "farmer", "rating", "created_at"]
    list_filter = ["rating"]
