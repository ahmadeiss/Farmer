from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.register_view, name="auth-register"),
    path("login/", views.login_view, name="auth-login"),
    path("logout/", views.logout_view, name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("profile/", views.ProfileView.as_view(), name="auth-profile"),
    path("change-password/", views.change_password_view, name="auth-change-password"),
    path("otp/request/", views.otp_request_view, name="auth-otp-request"),
    path("otp/verify/", views.otp_verify_view, name="auth-otp-verify"),

    # Admin: user management
    path("admin/users/", views.admin_all_users_view, name="admin-users"),
    path("admin/users/create/", views.admin_create_user_view, name="admin-create-user"),
    path("admin/users/<int:user_id>/delete/", views.admin_delete_user_view, name="admin-delete-user"),
    path("admin/users/<int:user_id>/toggle/", views.admin_toggle_user_view, name="admin-toggle-user"),
    path("admin/farmers/pending/", views.admin_pending_farmers_view, name="admin-pending-farmers"),
    path("admin/farmers/<int:user_id>/approve/", views.admin_approve_farmer_view, name="admin-approve-farmer"),
    path("admin/farmers/<int:user_id>/reject/", views.admin_reject_farmer_view, name="admin-reject-farmer"),
]
