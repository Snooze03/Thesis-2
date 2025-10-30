from django.db import models
from django.db.models import JSONField
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

    # Store sets data as JSON array of objects
    # Structure: [{"reps": 12, "weight": 50.5}, {"reps": 10, "weight": 55.0}]
    sets_data = JSONField(
        default=list,
        blank=True,
        help_text="Array of objects containing reps and weight for each set",
    )

    # Keep total sets count for easier querying
    total_sets = models.IntegerField(default=1, help_text="Total number of sets")

    rest_time = models.TimeField(
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

    def save(self, *args, **kwargs):
        """Override save to ensure total_sets matches sets_data length"""
        if self.sets_data:
            self.total_sets = len(self.sets_data)
        super().save(*args, **kwargs)

    def add_set(self, reps=None, weight=None):
        """Add a new set to the exercise"""
        if not self.sets_data:
            self.sets_data = []

        self.sets_data.append(
            {"reps": reps, "weight": float(weight) if weight else None}
        )
        self.total_sets = len(self.sets_data)

    def update_set(self, set_index, reps=None, weight=None):
        """Update a specific set by index"""
        if 0 <= set_index < len(self.sets_data):
            if reps is not None:
                self.sets_data[set_index]["reps"] = reps
            if weight is not None:
                self.sets_data[set_index]["weight"] = float(weight)

    def remove_set(self, set_index):
        """Remove a set by index"""
        if 0 <= set_index < len(self.sets_data):
            self.sets_data.pop(set_index)
            self.total_sets = len(self.sets_data)

    @property
    def formatted_sets_display(self):
        """Return a formatted string representation of sets"""
        if not self.sets_data:
            return "No sets configured"

        sets_display = []
        for i, set_data in enumerate(self.sets_data, 1):
            reps = set_data.get("reps", "N/A")
            weight = set_data.get("weight", "N/A")
            sets_display.append(f"Set {i}: {reps} reps @ {weight}kg")

        return " | ".join(sets_display)
