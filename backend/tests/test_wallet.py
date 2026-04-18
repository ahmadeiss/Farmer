"""Tests for wallet and ledger flows."""
import pytest
from decimal import Decimal


@pytest.mark.django_db
class TestWallet:
    def test_farmer_can_view_wallet(self, farmer_client, farmer_user):
        from apps.wallets.models import Wallet

        Wallet.objects.get_or_create(farmer=farmer_user)
        resp = farmer_client.get("/api/v1/wallets/my-wallet/")
        assert resp.status_code == 200

    def test_wallet_credited_on_delivery(self, buyer_client, farmer_client, admin_client, product, farmer_user):
        from apps.wallets.models import Wallet

        wallet, _ = Wallet.objects.get_or_create(farmer=farmer_user)
        initial_balance = wallet.current_balance

        buyer_client.post("/api/v1/orders/cart/add/", {"product_id": product.id, "quantity": "5"})
        resp = buyer_client.post("/api/v1/orders/checkout/", {
            "delivery_address": "رام الله، حي البيرة، شارع الاستقلال رقم 5",
        })
        order = resp.json()["orders"][0]

        for status in ["confirmed", "preparing", "ready_for_pickup"]:
            farmer_client.patch(
                f"/api/v1/orders/farmer-orders/{order['id']}/status/",
                {"status": status}
            )

        admin_client.post(f"/api/v1/orders/confirm-qr/{order['qr_token']}/")

        wallet.refresh_from_db()
        assert wallet.current_balance > initial_balance

    def test_admin_can_settle_wallet(self, admin_client, farmer_user):
        from apps.wallets.models import Wallet

        wallet, _ = Wallet.objects.get_or_create(farmer=farmer_user)
        wallet.current_balance = Decimal("100.00")
        wallet.save()

        resp = admin_client.post(
            f"/api/v1/wallets/admin/wallets/{farmer_user.id}/settle/",
            {"amount": "50.00", "note": "تسوية شهرية"}
        )
        assert resp.status_code == 200
        wallet.refresh_from_db()
        assert wallet.current_balance == Decimal("50.00")

    def test_settle_exceeding_balance_fails(self, admin_client, farmer_user):
        from apps.wallets.models import Wallet

        wallet, _ = Wallet.objects.get_or_create(farmer=farmer_user)
        wallet.current_balance = Decimal("10.00")
        wallet.save()

        resp = admin_client.post(
            f"/api/v1/wallets/admin/wallets/{farmer_user.id}/settle/",
            {"amount": "1000.00"}
        )
        assert resp.status_code == 400
