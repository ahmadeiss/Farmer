from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_approved",
            field=models.BooleanField(
                default=True,
                db_index=True,
                verbose_name="معتمد من الأدمن",
                help_text="منتجات المزارعين غير الموثقين تحتاج موافقة الأدمن قبل الظهور في السوق.",
            ),
        ),
    ]
