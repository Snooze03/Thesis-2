from django.db import models
from .account import Account
from django.core.exceptions import ValidationError
import os


def validate_image_file_extension(value):
    """Validate that the uploaded file is an image"""
    ext = os.path.splitext(value.name)[1]
    valid_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]
    if not ext.lower() in valid_extensions:
        raise ValidationError(
            "Unsupported file extension. Please upload an image file."
        )


def progress_photo_upload_path(instance, filename):
    """Generate upload path for progress photos"""
    # Use a timestamp to avoid filename conflicts
    import time

    timestamp = str(int(time.time()))
    name, ext = os.path.splitext(filename)
    # Create path: progress_photos/<account_id>/<timestamp>_<filename>
    return f"progress_photos/{instance.account.id}/{timestamp}_{name}{ext}"


class ProgressPhoto(models.Model):
    """Model to store user's single before and after progress photos"""

    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="progress_photo",
        help_text="The user who uploaded these progress photos",
    )

    before_photo = models.ImageField(
        upload_to=progress_photo_upload_path,
        validators=[validate_image_file_extension],
        help_text="Before photo showing initial state",
        blank=True,
        null=True,
    )

    after_photo = models.ImageField(
        upload_to=progress_photo_upload_path,
        validators=[validate_image_file_extension],
        help_text="After photo showing progress/results",
        blank=True,
        null=True,
    )

    date_before = models.DateField(
        help_text="Date when the before photo was taken", null=True, blank=True
    )

    date_after = models.DateField(
        help_text="Date when the after photo was taken", null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Progress Photo"
        verbose_name_plural = "Progress Photos"

    def __str__(self):
        return f"{self.account.username} - Progress Photos"

    def clean(self):
        """Custom validation to ensure at least one photo is provided"""
        if not self.before_photo and not self.after_photo:
            raise ValidationError(
                "At least one photo (before or after) must be provided."
            )

    @property
    def has_complete_comparison(self):
        """Check if both before and after photos are available"""
        return bool(self.before_photo and self.after_photo)

    @property
    def progress_duration_days(self):
        """Calculate days between before and after photos"""
        if self.date_before and self.date_after:
            return (self.date_after - self.date_before).days
        return None
