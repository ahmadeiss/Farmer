"""
Account signals: auto-create profiles after user registration.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_role_profile(sender, instance, created, **kwargs):
    """Auto-create FarmerProfile or BuyerProfile when a user is created."""
    if not created:
        return

    if instance.role == User.Role.FARMER:
        from apps.farmers.models import FarmerProfile
        FarmerProfile.objects.get_or_create(user=instance)
        # Also create a wallet for the farmer
        from apps.wallets.models import Wallet
        Wallet.objects.get_or_create(farmer=instance)
        logger.info(f"Created FarmerProfile + Wallet for {instance.phone}")

    elif instance.role == User.Role.BUYER:
        from apps.buyers.models import BuyerProfile
        BuyerProfile.objects.get_or_create(user=instance)
        logger.info(f"Created BuyerProfile for {instance.phone}")
