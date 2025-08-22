from django.urls import path, include
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"profile", views.AccountProfileViewSet, basename="account-profile")
router.register(r"profiles", views.ProfileViewSet, basename="profile")
router.register(
    r"weight-history", views.WeightHistoryViewSet, basename="weight-history"
)

urlpatterns = [
    path(
        "signup/",
        views.CombinedSignupView.as_view(),
        name="signup-with-profile",
    ),
    path("token/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("", include(router.urls)),
    path("update/", views.AccountUpdateView.as_view(), name="account-update"),
]
