from django.urls import path, include
from .views import CreateAccountView, AccountProfileViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"profile", AccountProfileViewSet, basename="account_profile")

urlpatterns = [
    path("signup/", CreateAccountView.as_view(), name="signup"),
    path("token/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("", include(router.urls)),
]
