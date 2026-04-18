from django.urls import path

from . import views

urlpatterns = [
    path("driver/deliveries/", views.MyDeliveriesView.as_view(), name="driver-deliveries"),
    path("driver/deliveries/<int:assignment_id>/pickup/", views.mark_pickup_view, name="driver-mark-pickup"),
    path("driver/dashboard-summary/", views.DriverDashboardSummaryView.as_view(), name="driver-dashboard-summary"),
    path("drivers/", views.AvailableDriversView.as_view(), name="available-drivers"),
    path("orders/<int:order_id>/assign/", views.assign_delivery_view, name="assign-delivery"),
]
