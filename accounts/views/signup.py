from ..models import Account, Profile, WeightHistory
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from ..serializers import (
    AccountCreateSerializer,
    ProfileCreateUpdateSerializer,
    WeightHistoryCreateSerializer,
    AccountDetailSerializer,
    CombinedSignupSerializer,
)


class CombinedSignupView(generics.CreateAPIView):
    """
    Create a new user account with profile in a single API call.

    This endpoint handles complete user registration including:
    - Account creation with authentication details
    - Profile creation with fitness/health data
    - Weight history entry creation for starting weight
    - Atomic transaction to ensure data consistency

    POST /accounts/signup/
    """

    permission_classes = [AllowAny]
    serializer_class = CombinedSignupSerializer

    def create(self, request, *args, **kwargs):
        """
        Create account, profile, and initial weight history in a single atomic transaction.
        """

        # First validate the combined data using custom serializer
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Validation failed",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_data = serializer.validated_data

        # Extract account data
        account_fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "gender",
            "height_ft",
            "height_in",
        ]
        account_data = {
            field: validated_data.get(field)
            for field in account_fields
            if field in validated_data
        }

        # Extract profile data
        profile_fields = [
            "starting_weight",
            "current_weight",
            "goal_weight",
            "start_weight_date",
            "activity_level",
            "body_goal",
            "workout_frequency",
            "workout_location",
            "injuries",
            "food_allergies",
        ]
        profile_data = {
            field: validated_data.get(field)
            for field in profile_fields
            if field in validated_data
        }

        # Set default empty strings for optional text fields if not provided
        profile_data.setdefault("injuries", "")
        profile_data.setdefault("food_allergies", "")

        try:
            # Use atomic transaction to ensure account, profile, and weight history are created together
            with transaction.atomic():
                # Step 1: Create account using the existing serializer
                account_serializer = AccountCreateSerializer(data=account_data)
                if not account_serializer.is_valid():
                    return Response(
                        {
                            "success": False,
                            "message": "Account validation failed",
                            "errors": {"account": account_serializer.errors},
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Save the account
                account = account_serializer.save()

                # Step 2: Create profile
                class MockRequest:
                    def __init__(self, user):
                        self.user = user

                mock_request = MockRequest(account)
                profile_serializer = ProfileCreateUpdateSerializer(
                    data=profile_data, context={"request": mock_request}
                )

                if not profile_serializer.is_valid():
                    # This will automatically rollback account creation due to transaction.atomic()
                    return Response(
                        {
                            "success": False,
                            "message": "Profile validation failed",
                            "errors": {"profile": profile_serializer.errors},
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Save the profile
                profile = profile_serializer.save()

                # Step 3: Create initial weight history entry
                # Use the starting weight and start weight date from profile
                weight_history_data = {
                    "weight": profile_data["starting_weight"],
                    "recorded_date": profile_data.get(
                        "start_weight_date", validated_data.get("start_weight_date")
                    ),
                }

                weight_history_serializer = WeightHistoryCreateSerializer(
                    data=weight_history_data, context={"request": mock_request}
                )

                if not weight_history_serializer.is_valid():
                    # This will automatically rollback account and profile creation due to transaction.atomic()
                    return Response(
                        {
                            "success": False,
                            "message": "Weight history validation failed",
                            "errors": {
                                "weight_history": weight_history_serializer.errors
                            },
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Save the weight history entry
                weight_history_entry = weight_history_serializer.save()

                # Step 4: If current weight is different from starting weight, create another entry
                starting_weight = profile_data["starting_weight"]
                current_weight = profile_data["current_weight"]
                start_date = profile_data.get(
                    "start_weight_date", validated_data.get("start_weight_date")
                )

                # Only create a second entry if weights are different and we have a valid date
                if (
                    starting_weight != current_weight
                    and start_date
                    and start_date < validated_data.get("start_weight_date", start_date)
                ):

                    current_weight_data = {
                        "weight": current_weight,
                        "recorded_date": validated_data.get(
                            "start_weight_date", start_date
                        ),
                    }

                    current_weight_serializer = WeightHistoryCreateSerializer(
                        data=current_weight_data, context={"request": mock_request}
                    )

                    if current_weight_serializer.is_valid():
                        current_weight_serializer.save()

                # Step 5: Return complete user data
                response_serializer = AccountDetailSerializer(account)
                return Response(
                    {
                        "success": True,
                        "message": "Account, profile, and weight history created successfully",
                        "data": response_serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            # Handle any unexpected errors
            return Response(
                {
                    "success": False,
                    "message": "An error occurred during registration",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, *args, **kwargs):
        """Handle POST request - alias for create method."""
        return self.create(request, *args, **kwargs)
