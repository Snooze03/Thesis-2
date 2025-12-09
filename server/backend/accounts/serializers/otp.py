from rest_framework import serializers
from ..models import Account, EmailVerification
from django.utils import timezone


class RequestOTPSerializer(serializers.Serializer):
    """Serializer for requesting OTP code."""

    email = serializers.EmailField()

    def validate_email(self, value):
        """Check if email is already registered."""
        if Account.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP code."""

    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_otp(self, value):
        """Ensure OTP is numeric."""
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain only numbers.")
        return value

    def validate(self, data):
        """Validate OTP against database."""
        email = data.get("email")
        otp = data.get("otp")

        try:
            verification = EmailVerification.objects.get(email=email)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError(
                {"email": "No verification request found for this email."}
            )

        # Check if already verified
        if verification.is_verified:
            raise serializers.ValidationError(
                {"otp": "This email has already been verified."}
            )

        # Check if expired
        if verification.is_expired():
            raise serializers.ValidationError(
                {"otp": "OTP has expired. Please request a new one."}
            )

        # Check max attempts
        if not verification.can_attempt():
            raise serializers.ValidationError(
                {
                    "otp": "Maximum verification attempts exceeded. Please request a new OTP."
                }
            )

        # Verify OTP
        if verification.otp_code != otp:
            verification.increment_attempts()
            remaining = (
                verification._meta.model.OTP_MAX_ATTEMPTS
                if hasattr(verification._meta.model, "OTP_MAX_ATTEMPTS")
                else 5
            ) - verification.attempts
            raise serializers.ValidationError(
                {"otp": f"Invalid OTP code. {remaining} attempts remaining."}
            )

        # Store verification object for view to use
        data["verification"] = verification
        return data


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for resending OTP code."""

    email = serializers.EmailField()

    def validate_email(self, value):
        """Check if verification request exists and isn't already verified."""
        try:
            verification = EmailVerification.objects.get(email=value)
            if verification.is_verified:
                raise serializers.ValidationError(
                    "This email has already been verified."
                )
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError(
                "No verification request found for this email. Please start the signup process."
            )

        return value.lower()


class OTPResponseSerializer(serializers.Serializer):
    """Serializer for standardized OTP responses."""

    success = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
