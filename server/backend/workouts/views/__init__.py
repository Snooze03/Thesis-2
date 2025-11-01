from .template import (
    TemplateViewSet,
    TemplateExerciseViewSet,
    TemplateHistoryViewSet,
)

from .exercise import (
    ExerciseViewSet,
)


__all__ = [
    # Template
    "TemplateViewSet",
    "TemplateExerciseViewSet",
    "TemplateHistoryViewSet",
    # Exercise
    "ExerciseViewSet",
]
