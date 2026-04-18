"""Tests for the order lifecycle: cart → checkout → QR confirmation."""
import pytest
from decimal import Decimal


@pytest.mark.django_db
class TestCart:
    def test_buyer_can_view_cart(self, buyer_client):
        resp = buyer_client.get("/api/v1/orders/cart/")
        assert resp.status_code == 200

    def test_add_to_cart(self, buyer_client, product):
        resp = buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id,
            "quantity": "2",
        })
        assert resp.status_code == 200
        assert resp.json()["item_count"] >= 1

    def test_add_unavailable_product_fails(self, buyer_client, farmer_user, category):
        from apps.catalog.models import Product
        p = Product.objects.create(
            farmer=farmer_user, category=category,
            title="نافد", price=Decimal("5"), quantity_available=Decimal("0"),
            unit="kg", is_active=True,
        )
        resp = buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": p.id, "quantity": "1",
        })
        assert resp.status_code in [400, 404]

    def test_remove_from_cart(self, buyer_client, product):
        buyer_client.post("/api/v1/orders/cart/add/", {"product_id": product.id, "quantity": "1"})
        resp = buyer_client.delete(f"/api/v1/orders/cart/remove/{product.id}/")
        assert resp.status_code == 200

    def test_farmer_cannot_add_to_cart(self, farmer_client, product):
        resp = farmer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id, "quantity": "1",
        })
        assert resp.status_code == 403


@pytest.mark.django_db
class TestCheckout:
    def test_checkout_creates_order(self, buyer_client, buyer_user, product):
        buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id, "quantity": "5",
        })
        resp = buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "رام الله، حي البيرة، شارع الاستقلال رقم 5",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert data["buyer"] == buyer_user.id
        assert "qr_token" in data

    def test_checkout_empty_cart_fails(self, buyer_client):
        buyer_client.delete("/api/v1/orders/cart/clear/")
        resp = buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "عنوان التوصيل التجريبي للاختبار",
        })
        assert resp.status_code == 400

    def test_checkout_reduces_stock(self, buyer_client, product):
        original_qty = product.quantity_available
        qty_ordered = Decimal("5")
        buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id, "quantity": str(qty_ordered),
        })
        buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "رام الله، حي البيرة، شارع الاستقلال رقم 5",
        })
        product.refresh_from_db()
        assert product.quantity_available == original_qty - qty_ordered


@pytest.mark.django_db
class TestOrderLifecycle:
    def _place_order(self, buyer_client, product):
        buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id, "quantity": "3",
        })
        resp = buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "رام الله، حي البيرة، شارع الاستقلال رقم 5",
        })
        data = resp.json()
        assert resp.status_code == 201, f"Checkout failed: {data}"
        return data

    def test_farmer_can_confirm_order(self, buyer_client, farmer_client, product):
        order = self._place_order(buyer_client, product)
        resp = farmer_client.patch(
            f"/api/v1/orders/farmer-orders/{order['id']}/status/",
            {"status": "confirmed"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "confirmed"

    def test_invalid_status_transition_rejected(self, buyer_client, farmer_client, product):
        order = self._place_order(buyer_client, product)
        # Can't jump from pending to delivered
        resp = farmer_client.patch(
            f"/api/v1/orders/farmer-orders/{order['id']}/status/",
            {"status": "delivered"}
        )
        assert resp.status_code == 400

    def test_qr_confirmation(self, buyer_client, farmer_client, admin_client, product):
        order = self._place_order(buyer_client, product)
        # Progress to ready state
        for status in ["confirmed", "preparing", "ready_for_pickup"]:
            farmer_client.patch(
                f"/api/v1/orders/farmer-orders/{order['id']}/status/",
                {"status": status}
            )
        qr_token = order["qr_token"]
        # Farmer cannot confirm (not order owner)
        resp = farmer_client.post(f"/api/v1/orders/confirm-qr/{qr_token}/")
        assert resp.status_code == 400
        # Buyer scans QR → confirms delivery
        resp = buyer_client.post(f"/api/v1/orders/confirm-qr/{qr_token}/")
        assert resp.status_code == 200
        # Admin still allowed as a fallback
        resp = admin_client.post(f"/api/v1/orders/confirm-qr/{qr_token}/")
        assert resp.status_code == 400  # already delivered

    def test_cancellation_releases_stock(self, buyer_client, farmer_client, product):
        original_qty = product.quantity_available
        qty = Decimal("5")
        buyer_client.post("/api/v1/orders/cart/add/", {
            "product_id": product.id, "quantity": str(qty),
        })
        resp = buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "رام الله، حي البيرة، شارع الاستقلال رقم 5",
        })
        order = resp.json()
        product.refresh_from_db()
        assert product.quantity_available == original_qty - qty

        farmer_client.patch(
            f"/api/v1/orders/farmer-orders/{order['id']}/status/",
            {"status": "cancelled"}
        )
        product.refresh_from_db()
        assert product.quantity_available == original_qty
