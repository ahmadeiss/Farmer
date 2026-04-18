"""
Prune old, non-essential rows to keep the Supabase free tier (500 MB) comfortable.

Core business data (users, farmers, products, orders, wallets, deliveries)
is never touched. Only telemetry-like tables are trimmed:

  * Read notifications older than NOTIF_RETENTION_DAYS
  * Expired JWT tokens in the blacklist
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

NOTIF_RETENTION_DAYS = 30


class Command(BaseCommand):
    help = "Delete old read notifications and expired JWT tokens."

    def add_arguments(self, parser):
        parser.add_argument(
            "--notif-days",
            type=int,
            default=NOTIF_RETENTION_DAYS,
            help="Delete read notifications older than N days (default: 30).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without touching the DB.",
        )

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        cutoff = timezone.now() - timedelta(days=opts["notif_days"])

        from apps.notifications.models import Notification

        notif_qs = Notification.objects.filter(is_read=True, created_at__lt=cutoff)
        notif_count = notif_qs.count()

        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        expired_tokens = OutstandingToken.objects.filter(expires_at__lt=timezone.now())
        token_count = expired_tokens.count()

        self.stdout.write(
            f"cutoff={cutoff.isoformat()}  notifications={notif_count}  expired_tokens={token_count}"
        )

        if dry:
            self.stdout.write(self.style.WARNING("[dry-run] nothing deleted."))
            return

        notif_deleted, _ = notif_qs.delete()
        token_deleted, _ = expired_tokens.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {notif_deleted} notifications and {token_deleted} expired tokens."
            )
        )
