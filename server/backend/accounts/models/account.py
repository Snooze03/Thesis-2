from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import (
    MinValueValidator,
    MaxValueValidator,
)
from django.contrib.auth.base_user import BaseUserManager
from datetime import date


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
        extra_fields.setdefault("birth_date", date(1990, 1, 1))  # Default birth date

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
    birth_date = models.DateField(
        verbose_name="Date of Birth",
        help_text="User's date of birth",
    )
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

    @property
    def age(self):
        """Calculate age from birth date."""
        today = date.today()
        return (
            today.year
            - self.birth_date.year
            - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        )
