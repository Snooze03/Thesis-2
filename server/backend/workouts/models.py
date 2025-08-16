from django.db import models
from accounts.models import Account


class Template(models.Model):
    user_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="workout_templates",
    )
    title = models.CharField(max_length=50)


class Exercise(models.Model):
    """
    Master exercise database - stores unique exercises from API Ninjas
    """

    name = models.CharField(max_length=150, unique=True)
    type = models.CharField(max_length=50, blank=True)
    muscle = models.CharField(max_length=50, blank=True)
    equipment = models.CharField(max_length=100, blank=True)
    difficulty = models.CharField(max_length=20, blank=True)
    instructions = models.TextField(blank=True)

    # Add this to track when we first saved this exercise
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["muscle"]),
            models.Index(fields=["difficulty"]),
        ]


class TemplateExercise(models.Model):
    """
    Junction table linking templates to exercises
    This allows the same exercise to be used in multiple templates
    """

    template = models.ForeignKey(
        Template, on_delete=models.CASCADE, related_name="template_exercises"
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name="exercise_templates"
    )

    # You can add template-specific fields here like:
    sets = models.IntegerField(default=1, blank=True, null=True)
    reps = models.CharField(max_length=20, blank=True)  # e.g., "8-12" or "to failure"
    weight = models.CharField(max_length=20, blank=True)  # e.g., "bodyweight" or "50kg"
    rest_time = models.CharField(max_length=20, blank=True)  # e.g., "60s" or "2min"
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)  # Order of exercises in template

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("template", "exercise")
        ordering = ["order", "created_at"]
