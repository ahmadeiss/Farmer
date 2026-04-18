"""
Smart Hasaad WSGI Configuration
Used for synchronous deployments (gunicorn etc.)
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
application = get_wsgi_application()
