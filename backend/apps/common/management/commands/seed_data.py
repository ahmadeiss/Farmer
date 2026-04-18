"""
Seed data management command.
Creates sample farmers, buyers, admin, categories, products, and orders.

Usage: python manage.py seed_data
       python manage.py seed_data --reset  (clear and re-seed)
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Seed the database with sample data for development/demo"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Clear all data before seeding")

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("🗑️  Resetting database...")
            self._reset()

        self.stdout.write("🌱 Seeding Smart Hasaad database...")
        with transaction.atomic():
            admin = self._create_admin()
            farmers = self._create_farmers()
            buyers = self._create_buyers()
            categories = self._create_categories()
            products = self._create_products(farmers, categories)
            self._create_orders(buyers, products)

        self.stdout.write(self.style.SUCCESS("""
✅ Seed complete! Sample credentials:

👑 Admin:
   Phone: 0599000000  Password: admin123456

🌾 Farmers:
   Phone: 0599111111  Password: farmer123
   Phone: 0599222222  Password: farmer123
   Phone: 0599333333  Password: farmer123

🛒 Buyers:
   Phone: 0599444444  Password: buyer123
   Phone: 0599555555  Password: buyer123

📖 API Docs: http://localhost:8000/api/docs/
🔧 Django Admin: http://localhost:8000/admin/
        """))

    def _reset(self):
        from apps.orders.models import Order, Cart
        from apps.catalog.models import Product, Category
        from apps.accounts.models import User
        Order.objects.all().delete()
        Cart.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write("✅ Reset complete")

    def _create_admin(self):
        from apps.accounts.models import User
        admin, created = User.objects.get_or_create(
            phone="0599000000",
            defaults={
                "full_name": "مدير النظام",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
            }
        )
        if created:
            admin.set_password("admin123456")
            admin.save()
            self.stdout.write(f"✅ Admin created: {admin.phone}")
        return admin

    def _create_farmers(self):
        from apps.accounts.models import User
        from apps.farmers.models import FarmerProfile

        farmer_data = [
            {"phone": "0599111111", "full_name": "أبو محمد الفلاح", "farm": "مزرعة الزيتون", "gov": "رام الله", "city": "بيرزيت"},
            {"phone": "0599222222", "full_name": "حسين العمر", "farm": "مزرعة الأمل", "gov": "الخليل", "city": "دورا"},
            {"phone": "0599333333", "full_name": "فاطمة الناصر", "farm": "أرض البركة", "gov": "نابلس", "city": "عصيرة"},
        ]

        farmers = []
        for fd in farmer_data:
            user, created = User.objects.get_or_create(
                phone=fd["phone"],
                defaults={
                    "full_name": fd["full_name"],
                    "role": User.Role.FARMER,
                    "is_verified": True,
                }
            )
            if created:
                user.set_password("farmer123")
                user.save()
            FarmerProfile.objects.filter(user=user).update(
                farm_name=fd["farm"],
                governorate=fd["gov"],
                city=fd["city"],
                bio=f"مزرعة عريقة في {fd['city']} تنتج أجود المنتجات الطازجة.",
            )
            farmers.append(user)
            self.stdout.write(f"✅ Farmer: {user.phone}")
        return farmers

    def _create_buyers(self):
        from apps.accounts.models import User

        buyer_data = [
            {"phone": "0599444444", "full_name": "سارة الحسن", "address": "رام الله، حي البيرة"},
            {"phone": "0599555555", "full_name": "خالد العمري", "address": "نابلس، حي الشمال"},
        ]

        buyers = []
        for bd in buyer_data:
            user, created = User.objects.get_or_create(
                phone=bd["phone"],
                defaults={
                    "full_name": bd["full_name"],
                    "role": User.Role.BUYER,
                    "is_verified": True,
                }
            )
            if created:
                user.set_password("buyer123")
                user.save()
            buyers.append(user)
            self.stdout.write(f"✅ Buyer: {user.phone}")
        return buyers

    def _create_categories(self):
        from apps.catalog.models import Category

        cats = [
            {"name_ar": "خضروات", "name_en": "vegetables", "icon": "🥦"},
            {"name_ar": "فواكه", "name_en": "fruits", "icon": "🍊"},
            {"name_ar": "حبوب وبقوليات", "name_en": "grains", "icon": "🌾"},
            {"name_ar": "زيوت وتوابل", "name_en": "oils", "icon": "🫒"},
            {"name_ar": "منتجات الألبان", "name_en": "dairy", "icon": "🥛"},
        ]

        categories = []
        for c in cats:
            cat, _ = Category.objects.get_or_create(
                slug=c["name_en"],
                defaults={"name_ar": c["name_ar"], "name_en": c["name_en"], "icon": c["icon"]},
            )
            categories.append(cat)
        self.stdout.write(f"✅ {len(categories)} categories created")
        return categories

    def _create_products(self, farmers, categories):
        from apps.catalog.models import Product
        import datetime

        products_data = [
            {"title": "طماطم طازجة", "cat_idx": 0, "price": "8.50", "qty": 200, "unit": "kg"},
            {"title": "خيار بلدي", "cat_idx": 0, "price": "5.00", "qty": 150, "unit": "kg"},
            {"title": "بندورة كرزية", "cat_idx": 0, "price": "12.00", "qty": 80, "unit": "kg"},
            {"title": "برتقال شموطي", "cat_idx": 1, "price": "6.00", "qty": 500, "unit": "kg"},
            {"title": "عنب أخضر", "cat_idx": 1, "price": "15.00", "qty": 100, "unit": "kg"},
            {"title": "تفاح أحمر", "cat_idx": 1, "price": "10.00", "qty": 300, "unit": "kg"},
            {"title": "حمص جاف", "cat_idx": 2, "price": "12.00", "qty": 50, "unit": "kg"},
            {"title": "عدس أحمر", "cat_idx": 2, "price": "9.00", "qty": 40, "unit": "kg"},
            {"title": "زيت زيتون بكر", "cat_idx": 3, "price": "45.00", "qty": 30, "unit": "liter"},
            {"title": "جبنة بيضاء", "cat_idx": 4, "price": "25.00", "qty": 20, "unit": "kg"},
        ]

        products = []
        harvest_date = datetime.date.today()
        for i, pd in enumerate(products_data):
            farmer = farmers[i % len(farmers)]
            product, _ = Product.objects.get_or_create(
                title=pd["title"],
                farmer=farmer,
                defaults={
                    "category": categories[pd["cat_idx"]],
                    "price": Decimal(pd["price"]),
                    "quantity_available": Decimal(pd["qty"]),
                    "unit": pd["unit"],
                    "harvest_date": harvest_date,
                    "description": f"منتج طازج من {farmer.farmer_profile.farm_name}",
                    "is_active": True,
                    "is_featured": i < 3,
                }
            )
            products.append(product)
        self.stdout.write(f"✅ {len(products)} products created")
        return products

    def _create_orders(self, buyers, products):
        from apps.orders.models import Order, OrderItem
        from apps.wallets.models import Wallet

        if not buyers or not products:
            return

        buyer = buyers[0]
        product = products[0]
        farmer = product.farmer

        order, created = Order.objects.get_or_create(
            buyer=buyer,
            farmer=farmer,
            status=Order.Status.DELIVERED,
            defaults={
                "payment_method": Order.PaymentMethod.CASH,
                "payment_status": Order.PaymentStatus.COLLECTED,
                "subtotal": Decimal("85.00"),
                "delivery_fee": Decimal("5.00"),
                "total": Decimal("90.00"),
                "delivery_address": "رام الله، حي البيرة، شارع الاستقلال",
            }
        )

        if created:
            OrderItem.objects.create(
                order=order,
                product=product,
                title_snapshot=product.title,
                unit_price=Decimal("8.50"),
                quantity=Decimal("10"),
                unit=product.unit,
            )
            # Credit farmer wallet
            wallet, _ = Wallet.objects.get_or_create(farmer=farmer)
            wallet.current_balance += Decimal("85.00")
            wallet.save()
            self.stdout.write("✅ Sample order + wallet entry created")
