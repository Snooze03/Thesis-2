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
