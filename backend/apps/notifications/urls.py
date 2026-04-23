from django.urls import path
from . import views

urlpatterns = [
    # In-app notifications
    path("", views.MyNotificationsView.as_view(), name="my-notifications"),
    path("unread-count/", views.unread_count_view, name="unread-count"),
    path("mark-all-read/", views.mark_all_read_view, name="mark-all-read"),
    path("<int:pk>/mark-read/", views.mark_read_view, name="mark-read"),

    # Web Push subscription management
    path("push/vapid-public-key/", views.vapid_public_key_view, name="vapid-public-key"),
    path("push/subscribe/", views.push_subscribe_view, name="push-subscribe"),
    path("push/unsubscribe/", views.push_unsubscribe_view, name="push-unsubscribe"),
]
