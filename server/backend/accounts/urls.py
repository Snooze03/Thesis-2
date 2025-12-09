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
    RequestOTPView,
    VerifyOTPView,
    ResendOTPView,
)


router = DefaultRouter()
router.register(r"profile", AccountProfileViewSet, basename="account-profile")
router.register(r"profiles", ProfileViewSet, basename="profile")
router.register(r"weight-history", WeightHistoryViewSet, basename="weight-history")
router.register(r"progress-photos", ProgressPhotoViewSet, basename="progress-photos")

urlpatterns = [
    # OTP endpoints
    path("request-otp/", RequestOTPView.as_view(), name="request-otp"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    # Signup
    path("signup/", CombinedSignupView.as_view(), name="signup-with-profile"),
    # JWT Token endpoints
    path("token/", TokenObtainPairView.as_view(), name="login-get_token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    # Router URLs
    path("", include(router.urls)),
    # Account update
    path("update/", AccountUpdateView.as_view(), name="account-update"),
]
