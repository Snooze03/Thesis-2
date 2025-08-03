from django.db import models
from accounts.models import Account


# Create your models here.
class WorkoutTemplate(models.Model):
    user = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="workout_templates",
    )
    title = models.CharField(max_length=50)


class Exercise(models.Model):
    EXERCISE_TYPE = [
        ("strength", "Strength"),
        ("stretching", "Stretching"),
        ("plyometrics", "Plyometrics"),
        ("powerlifting", "Powerlifting"),
        ("cardio", "Cardio"),
    ]
    # should be unique
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    exercise_type = models.CharField(
        choices=EXERCISE_TYPE,
    )


# USE ninja api work on this later bruh
