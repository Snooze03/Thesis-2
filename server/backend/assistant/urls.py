from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import chat, progress_report

router = DefaultRouter()
router.register(r"chats", chat.ChatViewSet, basename="chat")
router.register(
    r"progress-reports",
    progress_report.ProgressReportViewSet,
    basename="progress-report",
)
router.register(
    r"progress-report-settings",
    progress_report.ProgressReportSettingsViewSet,
    basename="progress-report-settings",
)

urlpatterns = [
    path("", include(router.urls)),
]
