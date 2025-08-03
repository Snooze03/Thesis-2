from django.urls import path, include
from .views import CreateAccountView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("signup/", CreateAccountView.as_view(), name="signup"),
    path("login/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("accounts/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    # includes login & logout view
    # REMOVE LATER ON BECAUSE YOU HAVE A CUSTOM LOGIN VIEW
    path("accounts-auth/", include("rest_framework.urls")),
]
