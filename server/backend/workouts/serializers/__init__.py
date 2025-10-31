from .template import (
    TemplateSerializer,
    TemplateExerciseSerializer,
    AddExercisesToTemplateSerializer,
    CreateTemplateWithExercisesSerializer,
    SetManagementSerializer,
    UpdateTemplateWithExercisesSerializer,
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
    "UpdateTemplateWithExercisesSerializer",
    # Exercise
    "ExerciseSerializer",
]
