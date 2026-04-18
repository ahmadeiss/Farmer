"""
Test settings: uses SQLite in-memory DB and disables external services.
Inherits from base but overrides DB, cache, celery to avoid external deps.
"""
from .base import *  # noqa

# ── Override DB: use SQLite for fast tests ─────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# ── Disable Celery (run tasks synchronously in tests) ─────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── Use local memory cache (no Redis needed) ──────────────────────────────
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# ── Channels: use in-memory layer ─────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# ── Email: send to console ────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── Media files: use temp dir ─────────────────────────────────────────────
import tempfile
MEDIA_ROOT = tempfile.mkdtemp()

# ── Speed up password hashing ─────────────────────────────────────────────
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ── Transcription service: stub ───────────────────────────────────────────
TRANSCRIPTION_SERVICE = "stub"

# ── Disable throttling in tests ───────────────────────────────────────────
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}

# ── Analytics cache timeout ───────────────────────────────────────────────
ANALYTICS_CACHE_TIMEOUT_SECONDS = 60

# ── Secret key ───────────────────────────────────────────────────────────
SECRET_KEY = "test-secret-key-not-for-production"
