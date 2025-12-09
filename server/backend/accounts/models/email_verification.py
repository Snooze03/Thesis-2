from django.db import models
from django.utils import timezone
from datetime import timedelta
import secrets
import uuid


class EmailVerification(models.Model):
    """Model to store OTP codes for email verification during signup."""

    email = models.EmailField(unique=True, db_index=True)
    otp_code = models.CharField(max_length=6)
    verification_token = models.CharField(
        max_length=100, unique=True, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Email Verification"
        verbose_name_plural = "Email Verifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} - {'Verified' if self.is_verified else 'Pending'}"

    def save(self, *args, **kwargs):
        """Set expiration time on creation."""
        if not self.pk:  # Only on creation
            expiry_minutes = 10  # TODO: Move to settings
            self.expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        super().save(*args, **kwargs)

    def is_expired(self):
        """Check if OTP has expired."""
        return timezone.now() > self.expires_at

    def can_attempt(self):
        """Check if user can attempt verification (hasn't exceeded max attempts)."""
        max_attempts = 5  # TODO: Move to settings
        return self.attempts < max_attempts

    def increment_attempts(self):
        """Increment failed attempt counter."""
        self.attempts += 1
        self.last_attempt_at = timezone.now()
        self.save(update_fields=["attempts", "last_attempt_at"])

    def generate_verification_token(self):
        """Generate unique token after successful OTP verification."""
        self.verification_token = str(uuid.uuid4())
        self.is_verified = True
        self.save(update_fields=["verification_token", "is_verified"])
        return self.verification_token

    @staticmethod
    def generate_otp():
        """Generate a random 6-digit OTP code."""
        return "".join([str(secrets.randbelow(10)) for _ in range(6)])

    @classmethod
    def create_or_update_otp(cls, email):
        """Create new OTP or update existing one for email."""
        otp_code = cls.generate_otp()

        # Delete or update existing OTP for this email
        try:
            verification = cls.objects.get(email=email)
            # Reset for new OTP request
            verification.otp_code = otp_code
            verification.is_verified = False
            verification.attempts = 0
            verification.verification_token = None
            verification.created_at = timezone.now()
            verification.expires_at = timezone.now() + timedelta(minutes=10)
            verification.save()
        except cls.DoesNotExist:
            verification = cls.objects.create(email=email, otp_code=otp_code)

        return verification
