"""Tests for authentication flows."""
import pytest


@pytest.mark.django_db
class TestRegistration:
    def test_farmer_registration(self, api_client):
        resp = api_client.post("/api/v1/auth/register/", {
            "phone": "0599999901",
            "full_name": "مزارع جديد",
            "password": "newpass123",
            "role": "farmer",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["role"] == "farmer"
        assert "tokens" in data
        assert "access" in data["tokens"]

    def test_buyer_registration(self, api_client):
        resp = api_client.post("/api/v1/auth/register/", {
            "phone": "0599999902",
            "full_name": "مشتري جديد",
            "password": "newpass123",
            "role": "buyer",
        })
        assert resp.status_code == 201

    def test_admin_registration_blocked(self, api_client):
        resp = api_client.post("/api/v1/auth/register/", {
            "phone": "0599999903",
            "full_name": "هاكر",
            "password": "hack123",
            "role": "admin",
        })
        assert resp.status_code == 400

    def test_duplicate_phone_rejected(self, api_client, farmer_user):
        resp = api_client.post("/api/v1/auth/register/", {
            "phone": farmer_user.phone,
            "full_name": "مكرر",
            "password": "newpass123",
            "role": "buyer",
        })
        assert resp.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_valid_login(self, api_client, farmer_user):
        resp = api_client.post("/api/v1/auth/login/", {
            "phone": farmer_user.phone,
            "password": "testpass123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["role"] == "farmer"

    def test_wrong_password(self, api_client, farmer_user):
        resp = api_client.post("/api/v1/auth/login/", {
            "phone": farmer_user.phone,
            "password": "wrongpassword",
        })
        assert resp.status_code == 400

    def test_nonexistent_user(self, api_client):
        resp = api_client.post("/api/v1/auth/login/", {
            "phone": "0500000000",
            "password": "anypassword",
        })
        assert resp.status_code == 400


@pytest.mark.django_db
class TestProfile:
    def test_get_profile(self, farmer_client, farmer_user):
        resp = farmer_client.get("/api/v1/auth/profile/")
        assert resp.status_code == 200
        assert resp.json()["phone"] == farmer_user.phone

    def test_unauthenticated_profile(self, api_client):
        resp = api_client.get("/api/v1/auth/profile/")
        assert resp.status_code == 401
