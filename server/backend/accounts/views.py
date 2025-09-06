from .models import Account, Profile, WeightHistory
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .serializers import (
    AccountSerializer,
    AccountCreateSerializer,
    ProfileSerializer,
    ProfileCreateUpdateSerializer,
    WeightHistorySerializer,
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
    - Atomic transaction to ensure data consistency

    POST /accounts/signup/
    """

    permission_classes = [AllowAny]
    serializer_class = CombinedSignupSerializer

    def create(self, request, *args, **kwargs):
        """
        Create account and profile in a single atomic transaction.
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
            # Use atomic transaction to ensure both account and profile are created together
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

                # Step 3: Return complete user data
                response_serializer = AccountDetailSerializer(account)
                return Response(
                    {
                        "success": True,
                        "message": "Account and profile created successfully",
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


class AccountProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for user account and profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = AccountDetailSerializer

    def get_queryset(self):
        return Account.objects.filter(id=self.request.user.id).select_related("profile")

    def list(self, request):
        """Return current user's complete profile - GET /accounts/profile/"""
        serializer = AccountDetailSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

    def retrieve(self, request, pk=None):
        """Return current user's profile by ID - GET /accounts/profile/{id}/"""
        if int(pk) != request.user.id:
            return Response(
                {"success": False, "message": "You can only access your own profile"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AccountDetailSerializer(request.user)
        return Response({"success": True, "data": serializer.data})


class ProfileViewSet(viewsets.ModelViewSet):
    """CRUD operations for user profiles."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(account=self.request.user)

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProfileCreateUpdateSerializer
        return ProfileSerializer

    def create(self, request):
        """Create profile for authenticated user - POST /accounts/profiles/"""
        # Check if profile already exists
        if hasattr(request.user, "profile"):
            return Response(
                {
                    "success": False,
                    "message": "Profile already exists. Use PUT/PATCH to update.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProfileCreateUpdateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            profile = serializer.save()
            response_serializer = ProfileSerializer(profile)
            return Response(
                {
                    "success": True,
                    "message": "Profile created successfully",
                    "data": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def update(self, request, pk=None, partial=False):  # Add partial=False parameter
        """Update user's profile - PUT /accounts/profiles/{id}/"""
        try:
            profile = Profile.objects.get(account=request.user, pk=pk)
        except Profile.DoesNotExist:
            return Response(
                {"success": False, "error": "Profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProfileCreateUpdateSerializer(
            profile,
            data=request.data,
            partial=partial,
            context={"request": request},  # Pass partial to serializer
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"success": True, "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WeightHistoryViewSet(viewsets.ModelViewSet):
    """CRUD operations for weight history."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeightHistory.objects.filter(account=self.request.user).order_by(
            "-recorded_date"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return WeightHistoryCreateSerializer
        return WeightHistorySerializer

    def create(self, request):
        """Add new weight entry - POST /accounts/weight-history/"""
        serializer = WeightHistoryCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            weight_entry = serializer.save()
            response_serializer = WeightHistorySerializer(weight_entry)
            return Response(
                {
                    "success": True,
                    "message": "Weight entry added successfully",
                    "data": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def list(self, request):
        """Get all weight history for user - GET /accounts/weight-history/"""
        queryset = self.get_queryset()
        serializer = WeightHistorySerializer(queryset, many=True)
        return Response(
            {"success": True, "count": len(serializer.data), "data": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Get recent weight entries - GET /accounts/weight-history/recent/"""
        recent_entries = self.get_queryset()[:10]  # Last 10 entries
        serializer = WeightHistorySerializer(recent_entries, many=True)
        return Response(
            {"success": True, "count": len(serializer.data), "data": serializer.data}
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get weight statistics - GET /accounts/weight-history/stats/"""
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response(
                {"success": True, "message": "No weight history found", "data": None}
            )

        latest = queryset.first()
        oldest = queryset.last()

        total_change = (
            float(latest.weight - oldest.weight) if queryset.count() > 1 else 0
        )

        # Get profile for goal comparison
        profile = getattr(request.user, "profile", None)

        stats = {
            "total_entries": queryset.count(),
            "current_weight": float(latest.weight),
            "starting_weight": float(oldest.weight),
            "total_weight_change": total_change,
            "goal_weight": float(profile.goal_weight) if profile else None,
            "weight_to_goal": float(profile.weight_to_goal) if profile else None,
            "latest_entry_date": latest.recorded_date,
            "first_entry_date": oldest.recorded_date,
        }

        return Response({"success": True, "data": stats})


class AccountUpdateView(generics.UpdateAPIView):
    """Update account information (not profile)."""

    permission_classes = [IsAuthenticated]
    serializer_class = AccountSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            account = serializer.save()
            response_serializer = AccountDetailSerializer(account)
            return Response(
                {
                    "success": True,
                    "message": "Account updated successfully",
                    "data": response_serializer.data,
                }
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
