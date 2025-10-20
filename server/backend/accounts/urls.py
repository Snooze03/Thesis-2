from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    AccountProfileViewSet,
    AccountUpdateView,
    ProfileViewSet,
    WeightHistoryViewSet,
    ProgressPhotoViewSet,
    CombinedSignupView,
)


router = DefaultRouter()
router.register(r"profile", AccountProfileViewSet, basename="account-profile")
router.register(r"profiles", ProfileViewSet, basename="profile")
router.register(r"weight-history", WeightHistoryViewSet, basename="weight-history")
router.register(r"progress-photos", ProgressPhotoViewSet, basename="progress-photos")

urlpatterns = [
    path(
        "signup/",
        CombinedSignupView.as_view(),
        name="signup-with-profile",
    ),
    path("token/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("", include(router.urls)),
    path("update/", AccountUpdateView.as_view(), name="account-update"),
]
