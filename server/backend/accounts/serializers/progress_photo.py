from rest_framework import serializers
from ..models import Account, ProgressPhoto


class ProgressPhotoSerializer(serializers.ModelSerializer):
    """Serializer for ProgressPhoto model"""

    # Read-only fields for computed properties
    has_complete_comparison = serializers.ReadOnlyField()
    progress_duration_days = serializers.ReadOnlyField()

    # Custom field to display account username (read-only)
    account_username = serializers.CharField(source="account.username", read_only=True)

    # URL fields for photo access
    before_photo_url = serializers.SerializerMethodField()
    after_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ProgressPhoto
        fields = [
            "id",
            "account",
            "account_username",
            "before_photo",
            "after_photo",
            "before_photo_url",
            "after_photo_url",
            "date_before",
            "date_after",
            "created_at",
            "updated_at",
            "has_complete_comparison",
            "progress_duration_days",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "account_username",
            "account",
        ]

    def get_before_photo_url(self, obj):
        """Get the full URL for before photo"""
        if obj.before_photo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.before_photo.url)
            return obj.before_photo.url
        return None

    def get_after_photo_url(self, obj):
        """Get the full URL for after photo"""
        if obj.after_photo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.after_photo.url)
            return obj.after_photo.url
        return None

    def validate_date_before(self, value):
        """Validate that before date is not in the future"""
        from datetime import date

        if value and value > date.today():
            raise serializers.ValidationError("Before date cannot be in the future.")
        return value

    def validate_date_after(self, value):
        """Validate that after date is not in the future"""
        from datetime import date

        if value and value > date.today():
            raise serializers.ValidationError("After date cannot be in the future.")
        return value

    def validate(self, data):
        """Custom validation for dates and photos"""
        date_before = data.get("date_before")
        date_after = data.get("date_after")
        before_photo = data.get("before_photo")
        after_photo = data.get("after_photo")

        # Get existing values if this is an update
        if self.instance:
            date_before = (
                date_before if date_before is not None else self.instance.date_before
            )
            date_after = (
                date_after if date_after is not None else self.instance.date_after
            )
            before_photo = before_photo or self.instance.before_photo
            after_photo = after_photo or self.instance.after_photo

        # Validate date logic
        if date_before and date_after and date_after < date_before:
            raise serializers.ValidationError(
                {"date_after": "After date cannot be earlier than before date."}
            )

        return data


class ProgressPhotoUpdateSerializer(serializers.ModelSerializer):
    """Simplified serializer for updating progress photos"""

    class Meta:
        model = ProgressPhoto
        fields = [
            "before_photo",
            "after_photo",
            "date_before",
            "date_after",
        ]

    def validate_date_before(self, value):
        """Validate that before date is not in the future"""
        from datetime import date

        if value and value > date.today():
            raise serializers.ValidationError("Before date cannot be in the future.")
        return value

    def validate_date_after(self, value):
        """Validate that after date is not in the future"""
        from datetime import date

        if value and value > date.today():
            raise serializers.ValidationError("After date cannot be in the future.")
        return value
