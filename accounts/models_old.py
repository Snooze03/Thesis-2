from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import (
    MaxLengthValidator,
    MinValueValidator,
    MaxValueValidator,
)
from django.contrib.auth.base_user import BaseUserManager
from django.core.exceptions import ValidationError
from datetime import date
from decimal import Decimal


class AccountManager(BaseUserManager):
    """Custom manager for Account model."""

    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        # Defaults for superuser
        extra_fields.setdefault("gender", "male")
        extra_fields.setdefault("height_ft", 5)
        extra_fields.setdefault("height_in", 10)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Account(AbstractUser):
    """Custom user model using email as username."""

    objects = AccountManager()

    username = None
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("prefer_not_to_say", "Prefer not to say"),
    ]

    # Static/rarely changing fields
    gender = models.CharField(
        max_length=20, choices=GENDER_CHOICES, verbose_name="Gender"
    )
    height_ft = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(3), MaxValueValidator(8)],
        verbose_name="Height (feet)",
        help_text="Height in feet (3-8)",
    )
    height_in = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(11)],
        verbose_name="Height (inches)",
        help_text="Additional inches (0-11)",
    )

    class Meta:
        verbose_name = "Account"
        verbose_name_plural = "Accounts"

    def __str__(self):
        return self.email

    @property
    def height_in_cm(self):
        """Convert height to centimeters."""
        total_inches = (self.height_ft * 12) + self.height_in
        return round(total_inches * 2.54, 1)


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
            profile = getattr(self.account, "profile", None)
            if profile:
                profile.current_weight = self.weight
                profile.save(update_fields=["current_weight", "updated_at"])
