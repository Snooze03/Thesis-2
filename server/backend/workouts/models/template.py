from django.db import models
from accounts.models import Account
from .exercise import Exercise


class Template(models.Model):
    user_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="workout_templates",
    )
    isAlternative = models.BooleanField(default=False)
    title = models.CharField(max_length=50)


class TemplateExercise(models.Model):
    """
    Junction table linking templates to exercises
    This allows the same exercise to be used in multiple templates
    """

    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="template_exercises",
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name="exercise_templates",
    )

    sets = models.IntegerField(
        default=1,
        blank=True,
        null=True,
    )
    reps = models.IntegerField(
        blank=True,
        null=True,
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
    )
    rest_time = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)  # Order of exercises in template

    # Automatically adds current date
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("template", "exercise")
        ordering = ["order", "created_at"]
