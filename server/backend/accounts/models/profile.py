from .account import Account
from django.db import models
from django.core.validators import (
    MaxLengthValidator,
    MinValueValidator,
    MaxValueValidator,
)
from datetime import date
from decimal import Decimal


class Profile(models.Model):
    """User profile with dynamic/changeable fitness data."""

    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="profile",
        primary_key=True,
    )

    # Weight tracking
    starting_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("20.00")),
            MaxValueValidator(Decimal("500.00")),
        ],
        verbose_name="Starting Weight (kg)",
        help_text="Weight in kilograms (20-500 kg)",
    )
    current_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("20.00")),
            MaxValueValidator(Decimal("500.00")),
        ],
        verbose_name="Current Weight (kg)",
        help_text="Current weight in kilograms",
    )
    goal_weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("20.00")),
            MaxValueValidator(Decimal("500.00")),
        ],
        verbose_name="Goal Weight (kg)",
        help_text="Target weight in kilograms",
    )

    start_weight_date = models.DateField(
        default=date.today, verbose_name="Starting Weight Date"
    )

    # Activity and goals
    ACTIVITY_LEVEL_CHOICES = [
        ("sedentary", "Sedentary (little/no exercise)"),
        ("lightly_active", "Lightly Active (light exercise 1-3 days/week)"),
        ("moderately_active", "Moderately Active (moderate exercise 3-5 days/week)"),
        ("very_active", "Very Active (hard exercise 6-7 days/week)"),
    ]

    BODY_GOAL_CHOICES = [
        ("lose_weight", "Lose Weight"),
        ("gain_weight", "Gain Weight"),
        ("maintain_weight", "Maintain Weight"),
        ("gain_muscle", "Gain Muscle"),
        ("build_strength", "Build Strength"),
    ]

    WORKOUT_FREQUENCY_CHOICES = [
        ("1_2", "1-2 Days per week"),
        ("3_4", "3-4 Days per week"),
        ("5_6", "5-6 Days per week"),
        ("daily", "Daily"),
    ]

    WORKOUT_LOCATION_CHOICES = [
        ("home", "Home"),
        ("gym", "Gym"),
        ("mixed", "Mixed"),
    ]

    activity_level = models.CharField(
        max_length=20,
        choices=ACTIVITY_LEVEL_CHOICES,
        verbose_name="Activity Level",
    )
    body_goal = models.CharField(
        max_length=20,
        choices=BODY_GOAL_CHOICES,
        verbose_name="Body Goal",
    )
    workout_frequency = models.CharField(
        max_length=10,
        choices=WORKOUT_FREQUENCY_CHOICES,
        verbose_name="Workout Frequency",
    )
    workout_location = models.CharField(
        max_length=10,
        choices=WORKOUT_LOCATION_CHOICES,
        verbose_name="Preferred Workout Location",
    )

    # Health information
    injuries = models.TextField(
        validators=[MaxLengthValidator(500)],
        verbose_name="Current Injuries or Physical Limitations",
        blank=True,
        help_text="Describe any injuries or physical limitations (max 500 characters)",
    )
    food_allergies = models.TextField(
        validators=[MaxLengthValidator(500)],
        verbose_name="Food Allergies and Dietary Restrictions",
        blank=True,
        help_text="List any food allergies or dietary restrictions (max 500 characters)",
    )

    # Tracking
    is_active = models.BooleanField(
        default=True,
        verbose_name="Profile Active",
        help_text="Whether this profile is currently active",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.account.email} - Profile"

    @property
    def weight_progress(self):
        """Calculate weight progress from starting to current weight."""
        if self.current_weight is not None and self.starting_weight is not None:
            return float(self.current_weight - self.starting_weight)
        return None

    @property
    def weight_to_goal(self):
        """Calculate remaining weight to reach goal."""
        if self.goal_weight is not None and self.current_weight is not None:
            return float(self.goal_weight - self.current_weight)
        return None

    @property
    def bmi(self):
        """Calculate BMI using current weight and height."""
        if (
            self.current_weight is not None
            and self.account.height_ft is not None
            and self.account.height_in is not None
        ):
            height_m = self.account.height_in_cm / 100
            return round(float(self.current_weight) / (height_m**2), 1)
        return None
