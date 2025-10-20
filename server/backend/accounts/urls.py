from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views.account import AccountProfileViewSet, AccountUpdateView
from .views.profile import ProfileViewSet
from .views.weight_history import WeightHistoryViewSet
from .views.signup import CombinedSignupView


router = DefaultRouter()
router.register(r"profile", AccountProfileViewSet, basename="account-profile")
router.register(r"profiles", ProfileViewSet, basename="profile")
router.register(r"weight-history", WeightHistoryViewSet, basename="weight-history")

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
