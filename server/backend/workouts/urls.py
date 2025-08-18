from rest_framework.routers import DefaultRouter
from .views import TemplateViewSet, ExerciseViewSet, TemplateExerciseViewSet

router = DefaultRouter()
router.register(r"templates", TemplateViewSet, basename="template")
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(
    r"template-exercises", TemplateExerciseViewSet, basename="template-exercise"
)

urlpatterns = router.urls
