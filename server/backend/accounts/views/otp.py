from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from ..models import EmailVerification
from ..serializers import (
    RequestOTPSerializer,
    VerifyOTPSerializer,
    ResendOTPSerializer,
)
from ..services.email_service import EmailService


class RequestOTPView(generics.CreateAPIView):
    """
    Request OTP code for email verification.

    POST /accounts/request-otp/
    Body: { "email": "user@example.com" }
    """

    permission_classes = [AllowAny]
    serializer_class = RequestOTPSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]

        try:
            # Create or update OTP for this email
            verification = EmailVerification.create_or_update_otp(email)

            # Send OTP email
            email_sent = EmailService.send_otp_email(email, verification.otp_code)

            if not email_sent:
                return Response(
                    {
                        "success": False,
                        "message": "Failed to send verification email. Please try again.",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "success": True,
                    "message": f"Verification code sent to {email}",
                    "data": {
                        "email": email,
                        "expires_in_minutes": verification.expires_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while processing your request.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyOTPView(generics.CreateAPIView):
    """
    Verify OTP code and get verification token.

    POST /accounts/verify-otp/
    Body: { "email": "user@example.com", "otp": "123456" }
    """

    permission_classes = [AllowAny]
    serializer_class = VerifyOTPSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get verification object from serializer validation
        verification = serializer.validated_data["verification"]

        try:
            # Generate verification token
            token = verification.generate_verification_token()

            return Response(
                {
                    "success": True,
                    "message": "Email verified successfully",
                    "data": {
                        "verification_token": token,
                        "email": verification.email,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An error occurred during verification.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResendOTPView(generics.CreateAPIView):
    """
    Resend OTP code to email.

    POST /accounts/resend-otp/
    Body: { "email": "user@example.com" }
    """

    permission_classes = [AllowAny]
    serializer_class = ResendOTPSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]

        try:
            # Create new OTP (will reset the existing one)
            verification = EmailVerification.create_or_update_otp(email)

            # Send new OTP email
            email_sent = EmailService.send_otp_email(email, verification.otp_code)

            if not email_sent:
                return Response(
                    {
                        "success": False,
                        "message": "Failed to resend verification email. Please try again.",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "success": True,
                    "message": f"New verification code sent to {email}",
                    "data": {
                        "email": email,
                        "expires_in_minutes": verification.expires_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "An error occurred while resending OTP.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
