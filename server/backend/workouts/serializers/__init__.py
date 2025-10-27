from .template import (
    TemplateSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
)

from .exercise import (
    ExerciseSerializer,
)


__all__ = [
    # Template
    "TemplateSerializer",
    "TemplateExerciseSerializer",
    "AddExercisesToTemplateSerializer",
    # Exercise
    "ExerciseSerializer",
]
