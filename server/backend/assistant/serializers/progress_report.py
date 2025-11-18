from rest_framework import serializers
from ..models import ProgressReport, ProgressReportSettings


class ProgressReportSettingsSerializer(serializers.ModelSerializer):
    """Serializer for Progress Report Settings"""

    next_generation_display = serializers.SerializerMethodField()
    last_generated_display = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReportSettings
        fields = [
            "id",
            "day_interval",
            "report_type",
            "is_enabled",
            "last_generated_at",
            "last_generated_display",
            "next_generation_date",
            "next_generation_display",
        ]
        read_only_fields = ["id", "last_generated_at", "next_generation_date"]

    def validate_day_interval(self, value):
        """Validate day interval is between 7 and 120 days"""
        if value < 7:
            raise serializers.ValidationError("Day interval must be at least 7 days")
        if value > 120:
            raise serializers.ValidationError("Day interval cannot exceed 120 days")
        return value

    def get_next_generation_display(self, obj):
        if obj.next_generation_date:
            return obj.next_generation_date.strftime("%b %d, %Y")
        return "Not scheduled"

    def get_last_generated_display(self, obj):
        if obj.last_generated_at:
            return obj.last_generated_at.strftime("%b %d, %Y at %I:%M %p")
        return "Never"


class ProgressReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing progress reports"""

    preview_text = serializers.SerializerMethodField()
    period_duration_days = serializers.SerializerMethodField()
    period_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ProgressReport
        fields = [
            "id",
            "period_start",
            "period_end",
            "period_display",
            "period_duration_days",
            "preview_text",
            "report_type",
            "status",
            "status_display",
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

    def get_period_display(self, obj):
        return f"{obj.period_start.strftime('%b %d')} - {obj.period_end.strftime('%b %d, %Y')}"


class ProgressReportDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual progress report view with full content"""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    period_duration_days = serializers.SerializerMethodField()
    period_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = [
            "id",
            "user_email",
            "period_start",
            "period_end",
            "period_display",
            "period_duration_days",
            "progress_summary",
            "workout_feedback",
            "nutrition_feedback",
            "key_takeaways",
            "report_type",
            "status",
            "status_display",
            "generation_error",
            "created_at",
            "created_at_display",
            "is_read",
        ]
        read_only_fields = fields

    def get_period_duration_days(self, obj):
        """Calculate the duration of the reporting period in days"""
        duration = obj.period_end - obj.period_start
        return duration.days

    def get_period_display(self, obj):
        """Get formatted period display string"""
        return f"{obj.period_start.strftime('%b %d')} - {obj.period_end.strftime('%b %d, %Y')}"

    def get_created_at_display(self, obj):
        """Get formatted creation timestamp"""
        return obj.created_at.strftime("%b %d, %Y at %I:%M %p")


class ProgressReportSerializer(serializers.ModelSerializer):
    """Default serializer for Progress Reports"""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    period_duration_days = serializers.SerializerMethodField()
    period_display = serializers.SerializerMethodField()

    class Meta:
        model = ProgressReport
        fields = [
            "id",
            "user",
            "user_email",
            "period_start",
            "period_end",
            "period_display",
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

    def get_period_display(self, obj):
        """Get formatted period display string"""
        return f"{obj.period_start.strftime('%b %d')} - {obj.period_end.strftime('%b %d, %Y')}"
