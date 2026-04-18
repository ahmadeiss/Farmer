from django.urls import path
from . import views

urlpatterns = [
    path("profile/", views.MyBuyerProfileView.as_view(), name="buyer-my-profile"),
    path("subscriptions/plans/", views.SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("subscriptions/", views.MySubscriptionsView.as_view(), name="my-subscriptions"),
    path("admin/list/", views.BuyerListAdminView.as_view(), name="admin-buyer-list"),
]
