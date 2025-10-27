from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import models

from accounts.models import Account, Profile
from .profile import NutritionProfile
from .daily_entry import FoodEntry
from .diet_plan import DietPlan


@receiver(post_save, sender=Account)
def create_nutrition_profile(sender, instance, created, **kwargs):
    """Create nutrition profile when user account is created"""
    if created:
        NutritionProfile.objects.create(account=instance)


@receiver(post_save, sender=Profile)
def update_nutrition_profile(sender, instance, update_fields=None, **kwargs):
    """Update nutrition profile when user profile changes"""
    nutrition_profile = getattr(instance.account, "nutrition_profile", None)

    if update_fields is not None and update_fields == {"current_weight"}:
        return
    if nutrition_profile:
        nutrition_profile.update_macros()


@receiver(post_save, sender=FoodEntry)
@receiver(models.signals.post_delete, sender=FoodEntry)
def update_daily_totals(sender, instance, **kwargs):
    """Recalculate daily totals when food entries are added/updated/deleted"""
    daily_entry = instance.daily_entry
    daily_entry.calculate_totals()


@receiver(post_save, sender=Account)
def create_user_diet_plans(sender, instance, created, **kwargs):
    """
    Create two diet plans for each new user:
    - One main diet plan (is_alternative=False)
    - One alternative diet plan (is_alternative=True)
    """
    if created:
        # Create main diet plan
        DietPlan.objects.create(user_id=instance, is_alternative=False)

        # Create alternative diet plan
        DietPlan.objects.create(user_id=instance, is_alternative=True)

        print(f"Created diet plans for user: {instance.email}")
