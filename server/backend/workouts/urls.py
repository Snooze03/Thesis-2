from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TemplateViewSet, ExerciseViewSet

router = DefaultRouter()
router.register("templates", TemplateViewSet, basename="template")
router.register("exercises", ExerciseViewSet, basename="exercises")

urlpatterns = [
    path("", include(router.urls)),
]
