from django.urls import path
from . import views

urlpatterns = [
    path("my-wallet/", views.MyWalletView.as_view(), name="my-wallet"),
    path("my-wallet/ledger/", views.MyWalletLedgerView.as_view(), name="my-wallet-ledger"),
    path("admin/wallets/", views.AdminWalletListView.as_view(), name="admin-wallets"),
    path("admin/wallets/<int:farmer_id>/ledger/", views.AdminWalletLedgerView.as_view(), name="admin-wallet-ledger"),
    path("admin/wallets/<int:farmer_id>/settle/", views.settle_wallet_view, name="admin-wallet-settle"),
]
