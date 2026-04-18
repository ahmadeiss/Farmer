from datetime import timedelta

import pytest
from django.utils import timezone


@pytest.mark.django_db
class TestDriverDashboard:
    def test_driver_can_view_assigned_deliveries(self, driver_client, driver_user, buyer_user, farmer_user):
        from apps.logistics.models import DeliveryAssignment
        from apps.orders.models import Order

        order = Order.objects.create(
            buyer=buyer_user,
            farmer=farmer_user,
            subtotal="20.00",
            delivery_fee="0.00",
            total="20.00",
            delivery_address="رام الله",
            notes="",
        )
        DeliveryAssignment.objects.create(
            order=order,
            assigned_to=driver_user,
            delivery_mode=DeliveryAssignment.DeliveryMode.DRIVER,
            status=DeliveryAssignment.Status.ASSIGNED,
        )

        resp = driver_client.get("/api/v1/logistics/driver/deliveries/")
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1

    def test_driver_dashboard_summary(self, driver_client, driver_user, buyer_user, farmer_user):
        from apps.logistics.models import DeliveryAssignment
        from apps.orders.models import Order

        now = timezone.now()
        order_one = Order.objects.create(
            buyer=buyer_user,
            farmer=farmer_user,
            subtotal="15.00",
            delivery_fee="0.00",
            total="15.00",
            delivery_address="البيرة",
            notes="",
        )
        order_two = Order.objects.create(
            buyer=buyer_user,
            farmer=farmer_user,
            subtotal="30.00",
            delivery_fee="0.00",
            total="30.00",
            delivery_address="الطيرة",
            notes="",
        )

        DeliveryAssignment.objects.create(
            order=order_one,
            assigned_to=driver_user,
            delivery_mode=DeliveryAssignment.DeliveryMode.DRIVER,
            status=DeliveryAssignment.Status.ASSIGNED,
        )
        DeliveryAssignment.objects.create(
            order=order_two,
            assigned_to=driver_user,
            delivery_mode=DeliveryAssignment.DeliveryMode.DRIVER,
            status=DeliveryAssignment.Status.DELIVERED,
            delivered_time=now - timedelta(hours=1),
        )

        resp = driver_client.get("/api/v1/logistics/driver/dashboard-summary/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["assigned"] == 1
        assert data["delivered_today"] == 1
        assert data["active_deliveries"] == 1


@pytest.mark.django_db
class TestDeliveryAssignmentFlow:
    def _create_ready_order(self, buyer_user, farmer_user):
        from apps.orders.models import Order

        return Order.objects.create(
            buyer=buyer_user,
            farmer=farmer_user,
            status=Order.Status.READY,
            subtotal="25.00",
            delivery_fee="0.00",
            total="25.00",
            delivery_address="رام الله",
            notes="",
        )

    def test_farmer_can_search_drivers(self, farmer_client, driver_user):
        resp = farmer_client.get("/api/v1/logistics/drivers/", {"search": driver_user.full_name.split()[0]})
        assert resp.status_code == 200
        assert resp.json()["results"][0]["id"] == driver_user.id

    def test_farmer_can_assign_driver_to_ready_order(self, farmer_client, buyer_user, farmer_user, driver_user):
        order = self._create_ready_order(buyer_user, farmer_user)

        resp = farmer_client.post(
            f"/api/v1/logistics/orders/{order.id}/assign/",
            {"delivery_mode": "driver", "driver_id": driver_user.id, "notes": "سلم الطلب سريعاً"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["driver_id"] == driver_user.id
        assert data["delivery_mode"] == "driver"

    def test_farmer_can_mark_self_delivery(self, farmer_client, buyer_user, farmer_user):
        order = self._create_ready_order(buyer_user, farmer_user)

        resp = farmer_client.post(
            f"/api/v1/logistics/orders/{order.id}/assign/",
            {"delivery_mode": "self_delivery", "notes": "سيتم التسليم من المزرعة"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["driver_id"] is None
        assert data["delivery_mode"] == "self_delivery"

    def test_order_cannot_go_out_for_delivery_without_assignment(self, farmer_client, buyer_user, farmer_user):
        order = self._create_ready_order(buyer_user, farmer_user)

        resp = farmer_client.patch(
            f"/api/v1/orders/farmer-orders/{order.id}/status/",
            {"status": "out_for_delivery"},
        )
        assert resp.status_code == 400
        assert resp.json()["code"] == "delivery_assignment_required"
