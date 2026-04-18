"""
Smart Hasaad - Production Settings
Extend base with security hardening and production-ready config.
"""
from .base import *  # noqa: F401, F403
import environ

env = environ.Env()

DEBUG = False

# On Render/Vercel the platform terminates TLS and forwards as HTTP; trust the header.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# Allow Render's *.onrender.com hostnames by default, plus anything in ALLOWED_HOSTS env.
_extra_hosts = env.list("ALLOWED_HOSTS", default=[])
ALLOWED_HOSTS = list({*ALLOWED_HOSTS, *_extra_hosts, ".onrender.com"})  # noqa: F405

# CSRF trusted origins (scheme + host) — required for admin over HTTPS.
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["https://*.onrender.com", "https://*.vercel.app"],
)

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Use in-memory channel layer when Redis isn't provisioned (Render free tier).
# When REDIS_URL is set to a real Redis host the base settings' Redis layer stays.
if not env("REDIS_URL", default=""):
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
    # Run Celery tasks synchronously inside the web process (no worker needed).
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

# Production logging to stdout (for container log aggregation)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"time": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "apps": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
