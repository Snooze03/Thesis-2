from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import models

from accounts.models import Account, Profile
from .profile import NutritionProfile
from .daily_entry import FoodEntry


@receiver(post_save, sender=Account)
def create_nutrition_profile(sender, instance, created, **kwargs):
    """Create nutrition profile when user account is created"""
    if created:
        NutritionProfile.objects.create(account=instance)


@receiver(post_save, sender=Profile)
def update_nutrition_profile(sender, instance, **kwargs):
    """Update nutrition profile when user profile changes"""
    nutrition_profile = getattr(instance.account, "nutrition_profile", None)
    if nutrition_profile:
        nutrition_profile.update_macros()


@receiver(post_save, sender=FoodEntry)
@receiver(models.signals.post_delete, sender=FoodEntry)
def update_daily_totals(sender, instance, **kwargs):
    """Recalculate daily totals when food entries are added/updated/deleted"""
    daily_entry = instance.daily_entry
    daily_entry.calculate_totals()
