from .template import (
    TemplateSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
    CreateTemplateWithExercisesSerializer,
)

from .exercise import (
    ExerciseSerializer,
)


__all__ = [
    # Template
    "TemplateSerializer",
    "TemplateExerciseSerializer",
    "AddExercisesToTemplateSerializer",
    "CreateTemplateWithExercisesSerializer",
    # Exercise
    "ExerciseSerializer",
]
