from .account import Account
from django.db import models
from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
)
from django.core.exceptions import ValidationError
from datetime import date
from decimal import Decimal


class WeightHistory(models.Model):
    """Track weight changes over time."""

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="weight_history",
        verbose_name="Account",
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("20.00")),
            MaxValueValidator(Decimal("500.00")),
        ],
        verbose_name="Weight (kg)",
        help_text="Weight in kilograms",
    )
    recorded_date = models.DateField(
        verbose_name="Date Recorded", help_text="Date when the weight was recorded"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Weight History"
        verbose_name_plural = "Weight Histories"
        ordering = ["-recorded_date", "-created_at"]
        unique_together = [
            "account",
            "recorded_date",
        ]  # One weight entry per day per user

    def __str__(self):
        return f"{self.account.email} - {self.weight}kg on {self.recorded_date}"

    def clean(self):
        """Custom validation for WeightHistory model."""
        if self.recorded_date > date.today():
            raise ValidationError("Weight recording date cannot be in the future.")

    def save(self, *args, **kwargs):
        """Override save to update current_weight in profile."""
        super().save(*args, **kwargs)
        # Update current weight in profile if this is the most recent entry
        latest_weight = (
            WeightHistory.objects.filter(account=self.account)
            .order_by("-recorded_date", "-created_at")
            .first()
        )

        if latest_weight == self:
            # Use string reference to avoid circular import
            from .profile import Profile

            try:
                profile = self.account.profile
                if profile:
                    profile.current_weight = self.weight
                    profile.save(update_fields=["current_weight", "updated_at"])
            except Profile.DoesNotExist:
                pass
