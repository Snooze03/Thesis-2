from rest_framework.routers import DefaultRouter
from .views import (
    TemplateViewSet,
    ExerciseViewSet,
    TemplateExerciseViewSet,
    TemplateHistoryViewSet,
)

router = DefaultRouter()
router.register(r"templates", TemplateViewSet, basename="template")
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(
    r"template-exercises", TemplateExerciseViewSet, basename="template-exercise"
)
router.register(r"history", TemplateHistoryViewSet, basename="template-history")

urlpatterns = router.urls
