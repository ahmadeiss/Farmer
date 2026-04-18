"""
Shared pytest fixtures for Smart Hasaad tests.
"""
import pytest
from decimal import Decimal
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def farmer_user(db):
    from apps.accounts.models import User
    user = User.objects.create_user(
        phone="0599100001",
        full_name="أحمد المزارع",
        password="testpass123",
        role=User.Role.FARMER,
        is_verified=True,
    )
    return user


@pytest.fixture
def buyer_user(db):
    from apps.accounts.models import User
    user = User.objects.create_user(
        phone="0599200001",
        full_name="سمير المشتري",
        password="testpass123",
        role=User.Role.BUYER,
        is_verified=True,
    )
    return user


@pytest.fixture
def admin_user(db):
    from apps.accounts.models import User
    user = User.objects.create_superuser(
        phone="0599300001",
        full_name="مدير النظام",
        password="adminpass123",
    )
    return user


@pytest.fixture
def driver_user(db):
    from apps.accounts.models import User
    user = User.objects.create_user(
        phone="0599400001",
        full_name="سائق التوصيل",
        password="driverpass123",
        role=User.Role.DRIVER,
        is_verified=True,
    )
    return user


@pytest.fixture
def farmer_client(farmer_user):
    client = APIClient()
    client.force_authenticate(user=farmer_user)
    return client


@pytest.fixture
def buyer_client(buyer_user):
    client = APIClient()
    client.force_authenticate(user=buyer_user)
    return client


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def driver_client(driver_user):
    client = APIClient()
    client.force_authenticate(user=driver_user)
    return client


@pytest.fixture
def category(db):
    from apps.catalog.models import Category
    return Category.objects.create(name_ar="خضروات", name_en="vegetables", slug="vegetables")


@pytest.fixture
def product(db, farmer_user, category):
    from apps.catalog.models import Product
    return Product.objects.create(
        farmer=farmer_user,
        category=category,
        title="طماطم طازجة",
        price=Decimal("8.50"),
        quantity_available=Decimal("100"),
        unit=Product.Unit.KG,
        is_active=True,
    )
