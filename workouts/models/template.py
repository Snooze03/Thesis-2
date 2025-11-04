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


class TemplateHistory(models.Model):
    """
    Model to store completed workout sessions
    Simple snapshot of what was actually performed
    """

    user_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="workout_history",
    )

    # Reference to the original template (nullable in case template gets deleted)
    original_template = models.ForeignKey(
        Template,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workout_history",
        help_text="Reference to the original template used",
    )

    # Workout session data (snapshot at completion)
    template_title = models.CharField(
        max_length=50, help_text="Title of the workout when it was performed"
    )

    # Timing
    started_at = models.DateTimeField(help_text="When the workout session started")
    completed_at = models.DateTimeField(
        help_text="When the workout session was completed"
    )

    # Calculated duration
    total_duration = models.DurationField(
        help_text="Total workout duration (completed_at - started_at)"
    )

    # Summary statistics for easy querying
    total_exercises = models.PositiveIntegerField(
        default=0, help_text="Total number of exercises performed"
    )
    total_sets = models.PositiveIntegerField(
        default=0, help_text="Total number of sets performed across all exercises"
    )

    # Optional workout notes
    workout_notes = models.TextField(
        blank=True, help_text="User notes about the completed workout"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]
        verbose_name = "Workout History"
        verbose_name_plural = "Workout Histories"

    def __str__(self):
        return f"{self.template_title} - {self.completed_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        """Override save to calculate duration"""
        if self.started_at and self.completed_at:
            self.total_duration = self.completed_at - self.started_at
        super().save(*args, **kwargs)

    @property
    def duration_minutes(self):
        """Get duration in minutes for easier display"""
        if self.total_duration:
            return round(self.total_duration.total_seconds() / 60, 1)
        return 0


class TemplateHistoryExercise(models.Model):
    """
    Model to store individual exercises within a completed workout
    Simple snapshot of what was actually performed for each exercise
    """

    workout_history = models.ForeignKey(
        TemplateHistory,
        on_delete=models.CASCADE,
        related_name="performed_exercises",
    )

    # Reference to the original exercise
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name="exercise_history",
    )

    # Snapshot of exercise data at completion
    exercise_name = models.CharField(
        max_length=100, help_text="Exercise name when workout was performed"
    )

    # What was actually performed
    performed_sets_data = JSONField(
        default=list,
        help_text="Actual sets performed: [{'reps': 12, 'weight': 50.5}, {'reps': 10, 'weight': 52.5}]",
    )

    # Keep count for easy querying
    total_sets_performed = models.PositiveIntegerField(
        default=0, help_text="Total number of sets performed for this exercise"
    )

    # Optional exercise-specific notes
    exercise_notes = models.TextField(
        blank=True, help_text="Notes specific to this exercise during the workout"
    )

    # Exercise order in the workout
    order = models.PositiveIntegerField(
        default=0, help_text="Order of this exercise in the workout"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        unique_together = ("workout_history", "exercise", "order")

    def __str__(self):
        return f"{self.exercise_name} - {self.workout_history.template_title}"

    def save(self, *args, **kwargs):
        """Override save to calculate total sets performed"""
        if self.performed_sets_data:
            self.total_sets_performed = len(self.performed_sets_data)
        super().save(*args, **kwargs)

    @property
    def formatted_sets_display(self):
        """Return a formatted string representation of performed sets"""
        if not self.performed_sets_data:
            return "No sets performed"

        sets_display = []
        for i, set_data in enumerate(self.performed_sets_data, 1):
            reps = set_data.get("reps", "N/A")
            weight = set_data.get("weight", "N/A")
            sets_display.append(f"Set {i}: {reps} reps @ {weight}kg")

        return " | ".join(sets_display)

    @property
    def total_volume(self):
        """Calculate total volume (reps × weight) for this exercise"""
        if not self.performed_sets_data:
            return 0

        total = 0
        for set_data in self.performed_sets_data:
            reps = set_data.get("reps", 0) or 0
            weight = set_data.get("weight", 0) or 0
            total += reps * weight

        return round(total, 2)
