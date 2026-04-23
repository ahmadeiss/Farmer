"""
Management command: generate VAPID keys for Web Push Notifications.

Usage:
    python manage.py generate_vapid_keys

Copy the output lines into your .env file, then restart the server.
Also copy VAPID_PUBLIC_KEY into your frontend .env as NEXT_PUBLIC_VAPID_PUBLIC_KEY.
"""
import base64

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate VAPID public/private key pair for Web Push Notifications"

    def handle(self, *args, **options):
        try:
            from py_vapid import Vapid
            from cryptography.hazmat.primitives.serialization import (
                Encoding, PublicFormat,
            )
        except ImportError:
            self.stderr.write(self.style.ERROR(
                "pywebpush is not installed. Run: pip install pywebpush"
            ))
            return

        self.stdout.write(self.style.MIGRATE_HEADING("\n🔑  Generating VAPID keys...\n"))

        vapid = Vapid()
        vapid.generate_keys()

        # Private key in PEM format (newlines escaped for .env compatibility)
        private_pem = vapid.private_pem().decode("utf-8").strip()
        private_env = private_pem.replace("\n", "\\n")

        # Public key as base64url-encoded uncompressed EC point (what browsers need)
        pub_bytes = vapid.public_key.public_bytes(
            encoding=Encoding.X962,
            format=PublicFormat.UncompressedPoint,
        )
        public_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode("utf-8")

        self.stdout.write(self.style.SUCCESS("✅  Keys generated! Add these to your .env files:\n"))

        self.stdout.write(self.style.WARNING("── backend/.env ──────────────────────────────────"))
        self.stdout.write(f"VAPID_PRIVATE_KEY={private_env}")
        self.stdout.write(f"VAPID_PUBLIC_KEY={public_b64}")
        self.stdout.write(f"VAPID_ADMIN_EMAIL=admin@hasaad.ps\n")

        self.stdout.write(self.style.WARNING("── frontend/.env.local ───────────────────────────"))
        self.stdout.write(f"NEXT_PUBLIC_VAPID_PUBLIC_KEY={public_b64}\n")

        self.stdout.write(self.style.NOTICE(
            "⚠️  Keep VAPID_PRIVATE_KEY secret. "
            "VAPID_PUBLIC_KEY is safe to expose publicly.\n"
        ))
