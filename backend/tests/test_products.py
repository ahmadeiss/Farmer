"""Tests for product catalog flows."""
import pytest
from decimal import Decimal


@pytest.mark.django_db
class TestMarketplace:
    def test_public_product_list(self, api_client, product):
        resp = api_client.get("/api/v1/catalog/products/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 1

    def test_product_detail(self, api_client, product):
        resp = api_client.get(f"/api/v1/catalog/products/{product.id}/")
        assert resp.status_code == 200
        assert resp.json()["title"] == product.title

    def test_category_list(self, api_client, category):
        resp = api_client.get("/api/v1/catalog/categories/")
        assert resp.status_code == 200
        data = resp.json()
        # Response may be paginated or a plain list
        results = data.get("results", data) if isinstance(data, dict) else data
        assert len(results) >= 1
        names = [c["name_ar"] for c in results]
        assert category.name_ar in names


@pytest.mark.django_db
class TestFarmerProducts:
    def test_farmer_can_create_product(self, farmer_client, category):
        resp = farmer_client.post("/api/v1/catalog/my-products/", {
            "title": "خيار طازج",
            "category": category.id,
            "price": "5.50",
            "quantity_available": "50",
            "unit": "kg",
        })
        assert resp.status_code == 201

    def test_farmer_list_own_products(self, farmer_client, product):
        resp = farmer_client.get("/api/v1/catalog/my-products/")
        assert resp.status_code == 200

    def test_buyer_cannot_create_product(self, buyer_client, category):
        resp = buyer_client.post("/api/v1/catalog/my-products/", {
            "title": "منتج غير مسموح",
            "category": category.id,
            "price": "5.00",
            "quantity_available": "10",
            "unit": "kg",
        })
        assert resp.status_code == 403

    def test_inactive_product_hidden_from_marketplace(self, api_client, farmer_user, category):
        from apps.catalog.models import Product
        p = Product.objects.create(
            farmer=farmer_user,
            category=category,
            title="منتج غير نشط",
            price=Decimal("5.00"),
            quantity_available=Decimal("10"),
            unit="kg",
            is_active=False,
        )
        resp = api_client.get("/api/v1/catalog/products/")
        ids = [item["id"] for item in resp.json()["results"]]
        assert p.id not in ids
