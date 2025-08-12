from django.urls import path
from .views import CreateAccountView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("signup/", CreateAccountView.as_view(), name="signup"),
    path("token/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
]
