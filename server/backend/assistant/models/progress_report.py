from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class ProgressReportSettings(models.Model):
    REPORT_TYPE_CHOICES = [
        ("short", "Short"),
        ("detailed", "Detailed"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="progress_report_settings"
    )
    day_interval = models.PositiveIntegerField(
        default=7, help_text="Days between reports"
    )
    report_type = models.CharField(
        max_length=10, choices=REPORT_TYPE_CHOICES, default="short"
    )
    is_enabled = models.BooleanField(default=True)
    last_generated_at = models.DateTimeField(null=True, blank=True)
    next_generation_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "assistant_progress_report_settings"
        verbose_name_plural = "Progress Report Settings"

    def __str__(self):
        return f"Settings for {self.user.username} - Every {self.day_interval} days"

    def update_next_generation_date(self):
        """Update the next generation date based on day_interval"""
        if self.last_generated_at:
            next_date = self.last_generated_at.date() + timedelta(
                days=self.day_interval
            )
        else:
            # First time - schedule for tomorrow
            next_date = timezone.now().date() + timedelta(days=1)

        self.next_generation_date = next_date
        self.save(update_fields=["next_generation_date"])

    def is_due_for_generation(self):
        """Check if report is due for generation"""
        if not self.is_enabled:
            return False

        if not self.next_generation_date:
            return True  # First time generation

        return timezone.now().date() >= self.next_generation_date


class ProgressReport(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("generated", "Generated"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="progress_reports"
    )
    period_start = models.DateTimeField(help_text="Start of the reporting period")
    period_end = models.DateTimeField(help_text="End of the reporting period")

    # Report Sections
    progress_summary = models.TextField(
        blank=True, help_text="Overall progress towards fitness goals"
    )

    # Workout Section
    workout_feedback = models.TextField(
        blank=True, help_text="Workout consistency and performance feedback"
    )
    workout_frequency = models.TextField(
        blank=True, help_text="Workout frequency analysis"
    )
    workout_duration = models.TextField(
        blank=True, help_text="Average workout duration analysis"
    )
    workout_recommendations = models.TextField(
        blank=True, help_text="Workout recommendations"
    )

    # Nutrition Section
    nutrition_feedback = models.TextField(
        blank=True, help_text="Nutrition adherence and quality feedback"
    )
    nutrition_adherence = models.TextField(
        blank=True, help_text="Adherence rate analysis"
    )
    nutrition_intake = models.TextField(
        blank=True, help_text="Average daily intake analysis"
    )
    nutrition_recommendations = models.TextField(
        blank=True, help_text="Nutrition recommendations"
    )

    # Key Takeaways
    key_takeaways = models.TextField(
        blank=True, help_text="Main insights and action items"
    )

    # Metadata
    report_type = models.CharField(max_length=10, default="short")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    generation_error = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    auto_generated = models.BooleanField(
        default=False, help_text="Was this report auto-generated?"
    )

    class Meta:
        ordering = ["-created_at"]
        db_table = "assistant_progress_reports"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Progress Report for {self.user.username} ({self.period_start.date()} - {self.period_end.date()})"

    def mark_as_read(self):
        self.is_read = True
        self.save(update_fields=["is_read"])
