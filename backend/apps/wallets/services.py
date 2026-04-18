"""
Wallet service: all financial movements are processed here.
Ensures atomic balance updates and creates immutable ledger entries.
"""
import logging
from decimal import Decimal
from django.db import transaction

from .models import Wallet, WalletLedger

logger = logging.getLogger(__name__)


class WalletService:
    """
    Central service for all wallet operations.
    All methods are transactional and create ledger entries.
    """

    @staticmethod
    def get_or_create_wallet(farmer) -> Wallet:
        wallet, _ = Wallet.objects.get_or_create(farmer=farmer)
        return wallet

    @staticmethod
    @transaction.atomic
    def credit_on_delivery(order) -> WalletLedger:
        """
        Credit farmer's wallet when an order is delivered.
        The amount is the order subtotal (delivery fee not going to farmer).
        Cash flow: buyer pays cash to delivery → admin settles to farmer later.
        """
        wallet = Wallet.objects.select_for_update().get(farmer=order.farmer)

        # Farmer earns subtotal (not the delivery fee)
        amount = order.subtotal
        balance_before = wallet.current_balance
        wallet.current_balance += amount
        wallet.save(update_fields=["current_balance", "updated_at"])

        entry = WalletLedger.objects.create(
            wallet=wallet,
            entry_type=WalletLedger.EntryType.CREDIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.current_balance,
            reference_type="order",
            reference_id=order.id,
            description=f"إيداع من الطلب #{order.id} - {order.buyer.full_name}",
        )
        logger.info(f"Wallet credited: farmer={order.farmer.phone} amount={amount} order={order.id}")
        return entry

    @staticmethod
    @transaction.atomic
    def mark_settled(wallet: Wallet, amount: Decimal, admin_user, note: str = "") -> WalletLedger:
        """
        Admin marks a cash settlement as completed.
        Reduces farmer's pending balance after physical cash payment.
        """
        wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)

        if amount > wallet.current_balance:
            from apps.common.exceptions import BusinessLogicError
            raise BusinessLogicError("المبلغ المطلوب تسويته أكبر من الرصيد المتاح.")

        balance_before = wallet.current_balance
        wallet.current_balance -= amount
        wallet.save(update_fields=["current_balance", "updated_at"])

        entry = WalletLedger.objects.create(
            wallet=wallet,
            entry_type=WalletLedger.EntryType.SETTLEMENT,
            amount=-amount,
            balance_before=balance_before,
            balance_after=wallet.current_balance,
            reference_type="settlement",
            reference_id=admin_user.id,
            description=note or f"تسوية يدوية بواسطة {admin_user.full_name}",
        )
        logger.info(f"Settlement: farmer={wallet.farmer.phone} amount={amount}")
        return entry
