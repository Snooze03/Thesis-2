from rest_framework import serializers
from ..models import NutritionProfile


class NutritionProfileSerializer(serializers.ModelSerializer):
    account_email = serializers.EmailField(source="account.email", read_only=True)
    account_name = serializers.CharField(source="account.get_full_name", read_only=True)
    bmi_category = serializers.CharField(source="get_bmi_category", read_only=True)

    class Meta:
        model = NutritionProfile
        fields = [
            "id",
            "account",
            "account_email",
            "account_name",
            "daily_calories_goal",
            "daily_protein_goal",
            "daily_carbs_goal",
            "daily_fat_goal",
            "bmi",
            "bmi_category",
            "bmr",
            "tdee",
            "is_auto_calculated",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "account",
            "account_email",
            "account_name",
            "bmi",
            "bmi_category",
            "bmr",
            "tdee",
            "created_at",
            "updated_at",
        ]

    def update(self, instance, validated_data):
        """Custom update to handle macro recalculation"""
        # If user manually sets macros, mark as not auto-calculated
        if any(
            field in validated_data
            for field in [
                "daily_calories_goal",
                "daily_protein_goal",
                "daily_carbs_goal",
                "daily_fat_goal",
            ]
        ):
            validated_data["is_auto_calculated"] = False

        return super().update(instance, validated_data)


class NutritionSummarySerializer(serializers.Serializer):
    """Serializer for nutrition summary data"""

    date = serializers.DateField()
    total_calories = serializers.FloatField()
    total_protein = serializers.FloatField()
    total_carbs = serializers.FloatField()
    total_fat = serializers.FloatField()
    calories_goal = serializers.IntegerField()
    protein_goal = serializers.FloatField()
    carbs_goal = serializers.FloatField()
    fat_goal = serializers.FloatField()
    calories_progress = serializers.FloatField()
    protein_progress = serializers.FloatField()
    carbs_progress = serializers.FloatField()
    fat_progress = serializers.FloatField()
