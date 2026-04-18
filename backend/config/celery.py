"""
Smart Hasaad - Celery Configuration
Handles async tasks: notifications, transcription, stock checks, wallet processing.
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("hasaad")

# Load settings from Django's CELERY_ namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Task routing
app.conf.task_routes = {
    "apps.notifications.tasks.*": {"queue": "notifications"},
    "apps.catalog.tasks.*": {"queue": "transcription"},
    "apps.inventory.tasks.*": {"queue": "default"},
    "apps.orders.tasks.*": {"queue": "default"},
    "apps.wallets.tasks.*": {"queue": "default"},
}

app.conf.task_default_queue = "default"
