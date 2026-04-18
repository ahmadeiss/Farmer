from django.urls import path
from . import views

urlpatterns = [
    path("profile/", views.MyFarmerProfileView.as_view(), name="farmer-my-profile"),
    path("public/<int:id>/", views.FarmerPublicProfileView.as_view(), name="farmer-public-profile"),
    path("admin/list/", views.FarmerListAdminView.as_view(), name="admin-farmer-list"),
    path("admin/<int:id>/", views.FarmerDetailAdminView.as_view(), name="admin-farmer-detail"),
]
