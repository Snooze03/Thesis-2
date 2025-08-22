from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Account, Profile, WeightHistory
from datetime import date


class WeightHistorySerializer(serializers.ModelSerializer):
    """Serializer for WeightHistory model."""

    # Read-only field to show weight change from previous entry
    weight_change = serializers.SerializerMethodField()

    class Meta:
        model = WeightHistory
        fields = ["id", "weight", "recorded_date", "weight_change", "created_at"]
        read_only_fields = ["id", "created_at", "weight_change"]

    def get_weight_change(self, obj):
        """Calculate weight change from previous entry."""
        previous = (
            WeightHistory.objects.filter(
                account=obj.account, recorded_date__lt=obj.recorded_date
            )
            .order_by("-recorded_date")
            .first()
        )

        if previous:
            return float(obj.weight - previous.weight)
        return None

    def validate_recorded_date(self, value):
        """Ensure recorded date is not in the future."""
        if value > date.today():
            raise serializers.ValidationError(
                "Weight recording date cannot be in the future."
            )
        return value


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


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for Account model with profile and weight history."""

    # Nested profile (optional - will be None if no profile exists)
    profile = ProfileSerializer(read_only=True)

    # Recent weight history (last 5 entries)
    recent_weight_history = serializers.SerializerMethodField()

    # Calculated fields
    height_in_cm = serializers.ReadOnlyField()

    # Password handling for creation/updates
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "gender",
            "height_ft",
            "height_in",
            "height_in_cm",
            "is_active",
            "date_joined",
            "profile",
            "recent_weight_history",
            "password",
        ]
        read_only_fields = [
            "id",
            "height_in_cm",
            "date_joined",
            "profile",
            "recent_weight_history",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def get_recent_weight_history(self, obj):
        """Get recent weight history entries."""
        recent_entries = obj.weight_history.all()[:5]  # Get last 5 entries
        return WeightHistorySerializer(recent_entries, many=True).data

    def create(self, validated_data):
        """Create account with hashed password."""
        password = validated_data.pop("password")
        account = Account.objects.create_user(password=password, **validated_data)
        return account

    def update(self, instance, validated_data):
        """Update account, handle password separately."""
        password = validated_data.pop("password", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update password if provided
        if password:
            instance.set_password(password)

        instance.save()
        return instance


class AccountCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for account creation."""

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "gender",
            "height_ft",
            "height_in",
        ]

    def validate(self, data):
        """Validate password confirmation."""
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        """Create account with confirmed password."""
        validated_data.pop("password_confirm")  # Remove confirmation field
        password = validated_data.pop("password")
        account = Account.objects.create_user(password=password, **validated_data)
        return account


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


class WeightHistoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating weight history entries."""

    class Meta:
        model = WeightHistory
        fields = ["weight", "recorded_date"]

    def create(self, validated_data):
        """Create weight history entry for authenticated user."""
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["account"] = request.user
        return super().create(validated_data)

    def validate(self, data):
        """Validate unique constraint for account and recorded_date."""
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            # Check if entry already exists for this date
            existing = WeightHistory.objects.filter(
                account=request.user, recorded_date=data["recorded_date"]
            ).exists()

            if existing:
                raise serializers.ValidationError(
                    "Weight entry already exists for this date. You can only record one weight per day."
                )

        return data


class AccountDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for account with all related data."""

    profile = ProfileSerializer(read_only=True)
    weight_history = WeightHistorySerializer(many=True, read_only=True)
    height_in_cm = serializers.ReadOnlyField()

    class Meta:
        model = Account
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "gender",
            "height_ft",
            "height_in",
            "height_in_cm",
            "is_active",
            "date_joined",
            "last_login",
            "profile",
            "weight_history",
        ]
        read_only_fields = [
            "id",
            "height_in_cm",
            "date_joined",
            "last_login",
            "profile",
            "weight_history",
        ]


class CombinedSignupSerializer(serializers.Serializer):
    """Combined serializer for account creation with profile in browsable API."""

    # Account fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=Account.GENDER_CHOICES)
    height_ft = serializers.IntegerField(min_value=3, max_value=8)
    height_in = serializers.IntegerField(min_value=0, max_value=11)

    # Profile fields
    starting_weight = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=20.00, max_value=500.00
    )
    current_weight = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=20.00, max_value=500.00
    )
    goal_weight = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=20.00, max_value=500.00
    )
    start_weight_date = serializers.DateField(required=False, default=date.today)
    activity_level = serializers.ChoiceField(choices=Profile.ACTIVITY_LEVEL_CHOICES)
    body_goal = serializers.ChoiceField(choices=Profile.BODY_GOAL_CHOICES)
    workout_frequency = serializers.ChoiceField(
        choices=Profile.WORKOUT_FREQUENCY_CHOICES
    )
    workout_location = serializers.ChoiceField(choices=Profile.WORKOUT_LOCATION_CHOICES)
    injuries = serializers.CharField(max_length=500, required=False, allow_blank=True)
    food_allergies = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )

    def validate(self, data):
        """Validate password confirmation and dates."""
        if data.get("password") != data.get("password_confirm"):
            raise serializers.ValidationError("Passwords do not match.")

        # Validate start_weight_date
        start_date = data.get("start_weight_date", date.today())
        if start_date > date.today():
            raise serializers.ValidationError(
                "Start weight date cannot be in the future."
            )

        return data
