from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MaxLengthValidator
from django.contrib.auth.base_user import BaseUserManager


# Manages Account creation & validation
class AccountManager(BaseUserManager):
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

        # Defaults for super user
        extra_fields.setdefault("gender", "male")
        extra_fields.setdefault("activity_level", "sedentary")
        extra_fields.setdefault("current_weight", 71.0)
        extra_fields.setdefault("goal_weight", 60.0)
        extra_fields.setdefault("height_ft", 5)
        extra_fields.setdefault("height_in", 6)
        extra_fields.setdefault("body_goal", "gain_muscle")
        extra_fields.setdefault("workout_frequency", "1_2")
        extra_fields.setdefault("workout_location", "gym")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


# Create your models here.
class Account(AbstractUser):
    objects = AccountManager()

    # Step 1: Sign Up
    username = None
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Step 2: Basic Info
    GENDER = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    ACTIVITY_LEVEL = [
        ("sedentary", "Sedentary"),
        ("lightly_active", "Lightly Active"),
        ("moderately_active", "Moderately Active"),
        ("very_active", "Very Active"),
    ]

    BODY_GOALS = [
        ("lose_weight", "Lose Weight"),
        ("gain_weight", "Gain Weight"),
        ("maintain_weight", "Maintain Weight"),
        ("gain_muscle", "Gain Muscle"),
        ("build_strength", "Build Strength"),
    ]

    gender = models.CharField(choices=GENDER, verbose_name="Gender")
    activity_level = models.CharField(
        choices=ACTIVITY_LEVEL, verbose_name="Activity Level"
    )
    current_weight = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="Current Weight"
    )
    goal_weight = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="Goal Weight"
    )
    height_ft = models.IntegerField(verbose_name="Height (ft)")
    height_in = models.IntegerField(verbose_name="Height (in)")
    body_goal = models.CharField(choices=BODY_GOALS, verbose_name="Body Goal")

    # Step 3: Additional Info
    WORKOUT_FREQUENCY = [
        ("1_2", "1-2 Days"),
        ("3_4", "3-4 Days"),
        ("5_6", "5-6 Days"),
    ]
    WORKOUT_LOCATION = [
        ("home", "Home"),
        ("gym", "Gym"),
        ("mixed", "Mixed"),
    ]

    injuries = models.TextField(
        validators=[MaxLengthValidator(300)],
        verbose_name="Injuries",
        blank=True,
        null=True,
    )
    food_allergies = models.TextField(
        validators=[MaxLengthValidator(300)],
        verbose_name="Food Allergies",
        blank=True,
        null=True,
    )
    workout_frequency = models.CharField(
        choices=WORKOUT_FREQUENCY, verbose_name="Workout Frequency"
    )
    workout_location = models.CharField(
        choices=WORKOUT_LOCATION, verbose_name="Workout Location"
    )
