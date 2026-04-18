from django.urls import path
from . import views

urlpatterns = [
    path("", views.MyNotificationsView.as_view(), name="my-notifications"),
    path("unread-count/", views.unread_count_view, name="unread-count"),
    path("mark-all-read/", views.mark_all_read_view, name="mark-all-read"),
    path("<int:pk>/mark-read/", views.mark_read_view, name="mark-read"),
]
