from rest_framework import serializers
from ..models import WeightHistory
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
