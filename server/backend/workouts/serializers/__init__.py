from .template import (
    TemplateSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
    CreateTemplateWithExercisesSerializer,
    SetManagementSerializer,
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
    "SetManagementSerializer",
    # Exercise
    "ExerciseSerializer",
]
