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
    template_id = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=150)
    type = models.CharField()
    muscle = models.CharField()
    equipment = models.CharField()
    difficulty = models.CharField()
    instructions = models.TextField()
