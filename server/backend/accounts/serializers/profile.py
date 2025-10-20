from rest_framework import serializers
from ..models import Profile
from datetime import date


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model."""

    # Read-only calculated fields
    weight_progress = serializers.ReadOnlyField()
    weight_to_goal = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()

    # Include account email for reference (read-only)
    account_email = serializers.EmailField(source="account.email", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "account_email",
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
            "is_active",
            "weight_progress",
            "weight_to_goal",
            "bmi",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "account_email",
            "weight_progress",
            "weight_to_goal",
            "bmi",
            "created_at",
            "updated_at",
        ]

    def validate_start_weight_date(self, value):
        """Ensure start weight date is not in the future."""
        if value > date.today():
            raise serializers.ValidationError(
                "Start weight date cannot be in the future."
            )
        return value


class ProfileCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating profiles."""

    class Meta:
        model = Profile
        fields = [
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
            "is_active",
        ]

    def create(self, validated_data):
        """Create profile for authenticated user."""
        # Get the account from the request context
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["account"] = request.user
        return super().create(validated_data)
