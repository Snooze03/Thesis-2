from rest_framework import serializers
from ..models import Food


class FoodSerializer(serializers.ModelSerializer):
    # Display available serving options count
    available_servings_count = serializers.SerializerMethodField()

    class Meta:
        model = Food
        fields = [
            "id",
            "food_id",
            "food_name",
            "food_type",
            "brand_name",
            "food_description",
            "fatsecret_servings",
            "available_servings_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "available_servings_count",
        ]

    def get_available_servings_count(self, obj):
        """Get count of available serving options from FatSecret"""
        return len(obj.fatsecret_servings) if obj.fatsecret_servings else 0

    def validate_food_id(self, value):
        """Ensure food_id is unique"""
        if self.instance and self.instance.food_id == value:
            return value
        if Food.objects.filter(food_id=value).exists():
            raise serializers.ValidationError("Food with this ID already exists.")
        return value

    def validate_fatsecret_servings(self, value):
        """Validate FatSecret servings JSON structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("FatSecret servings must be a list.")

        # Validate each serving has required fields
        required_fields = ["serving_id", "serving_description"]
        for serving in value:
            if not isinstance(serving, dict):
                raise serializers.ValidationError("Each serving must be a dictionary.")

            for field in required_fields:
                if field not in serving:
                    raise serializers.ValidationError(
                        f"Each serving must have '{field}' field."
                    )

        return value


class FoodServingOptionSerializer(serializers.Serializer):
    """Serializer for individual FatSecret serving options"""

    serving_id = serializers.CharField()
    serving_description = serializers.CharField()
    metric_serving_amount = serializers.CharField(required=False)
    metric_serving_unit = serializers.CharField(required=False)
    calories = serializers.CharField(required=False)
    protein = serializers.CharField(required=False)
    carbohydrate = serializers.CharField(required=False)
    fat = serializers.CharField(required=False)


class FoodWithServingsSerializer(FoodSerializer):
    """Extended Food serializer that includes parsed serving options"""

    parsed_servings = serializers.SerializerMethodField()

    class Meta(FoodSerializer.Meta):
        fields = FoodSerializer.Meta.fields + ["parsed_servings"]

    def get_parsed_servings(self, obj):
        """Parse and return serving options in a structured format"""
        if not obj.fatsecret_servings:
            return []

        return FoodServingOptionSerializer(obj.fatsecret_servings, many=True).data
