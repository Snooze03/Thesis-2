from rest_framework import serializers
from ..models import Account, Profile
from .profile import ProfileSerializer
from datetime import date
from decimal import Decimal


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
        from .weight_history import WeightHistorySerializer

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


class AccountDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for account with all related data."""

    profile = ProfileSerializer(read_only=True)
    # weight_history = WeightHistorySerializer(many=True, read_only=True)
    weight_history = serializers.SerializerMethodField()
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

    def get_weight_history(self, obj):
        """Get all weight history entries."""
        from .weight_history import WeightHistorySerializer

        all_entries = obj.weight_history.all()
        return WeightHistorySerializer(all_entries, many=True).data


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
        max_digits=5,
        decimal_places=2,
        min_value=Decimal("20.00"),
        max_value=Decimal("500.00"),
    )
    current_weight = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal("20.00"),
        max_value=Decimal("500.00"),
    )
    goal_weight = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=Decimal("20.00"),
        max_value=Decimal("500.00"),
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
