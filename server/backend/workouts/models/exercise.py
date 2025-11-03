from django.db import models


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
