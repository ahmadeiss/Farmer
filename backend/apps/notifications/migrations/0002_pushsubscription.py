import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PushSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("endpoint", models.CharField(
                    max_length=2000, unique=True,
                    verbose_name="Endpoint",
                    help_text="Push service URL provided by the browser",
                )),
                ("p256dh", models.CharField(
                    max_length=512, verbose_name="p256dh Key",
                    help_text="Browser public key for payload encryption",
                )),
                ("auth", models.CharField(
                    max_length=128, verbose_name="Auth Secret",
                    help_text="Auth secret for payload encryption",
                )),
                ("user_agent", models.CharField(
                    blank=True, default="", max_length=500, verbose_name="User Agent",
                )),
                ("is_active", models.BooleanField(
                    default=True, db_index=True, verbose_name="نشط",
                    help_text="Set to False when the push service returns 410 Gone",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="push_subscriptions",
                    to=settings.AUTH_USER_MODEL,
                    verbose_name="المستخدم",
                )),
            ],
            options={
                "verbose_name": "اشتراك Push",
                "verbose_name_plural": "اشتراكات Push",
            },
        ),
        migrations.AddIndex(
            model_name="pushsubscription",
            index=models.Index(fields=["user", "is_active"], name="push_sub_user_active_idx"),
        ),
    ]
