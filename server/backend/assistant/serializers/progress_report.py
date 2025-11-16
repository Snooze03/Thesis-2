from rest_framework import serializers
from ..models import ProgressReport, ProgressReportSettings


class ProgressReportSettingsSerializer(serializers.ModelSerializer):
    """Serializer for Progress Report Settings"""

    class Meta:
        model = ProgressReportSettings
        fields = [
            "id",
            "day_interval",
            "report_time",
            "report_type",
            "is_enabled",
            "last_generated_at",
            "next_generation_date",
        ]
        read_only_fields = ["id", "last_generated_at", "next_generation_date"]

    def validate_day_interval(self, value):
        """Validate day interval is between 7 and 120 days"""
        if value < 7:
            raise serializers.ValidationError("Day interval must be at least 7 days")
        if value > 120:
            raise serializers.ValidationError("Day interval cannot exceed 120 days")
        return value


class ProgressReportSerializer(serializers.ModelSerializer):
    """Serializer for Progress Reports"""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    period_duration_days = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = [
            "id",
            "user",
            "user_email",
            "period_start",
            "period_end",
            "period_duration_days",
            "progress_summary",
            "workout_feedback",
            "nutrition_feedback",
            "key_takeaways",
            "report_type",
            "status",
            "generation_error",
            "created_at",
            "is_read",
        ]
        read_only_fields = [
            "id",
            "user",
            "user_email",
            "status",
            "generation_error",
            "created_at",
        ]

    def get_period_duration_days(self, obj):
        """Calculate the duration of the reporting period in days"""
        duration = obj.period_end - obj.period_start
        return duration.days


class ProgressReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing progress reports"""

    preview_text = serializers.SerializerMethodField()
    period_duration_days = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = [
            "id",
            "period_start",
            "period_end",
            "period_duration_days",
            "preview_text",
            "report_type",
            "status",
            "created_at",
            "is_read",
        ]
        read_only_fields = fields

    def get_preview_text(self, obj):
        """Get a preview of the progress summary"""
        if obj.progress_summary:
            return obj.progress_summary[:100] + (
                "..." if len(obj.progress_summary) > 100 else ""
            )
        return "Report pending generation..."

    def get_period_duration_days(self, obj):
        """Calculate the duration of the reporting period in days"""
        duration = obj.period_end - obj.period_start
        return duration.days
