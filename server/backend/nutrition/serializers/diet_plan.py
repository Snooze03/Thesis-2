from rest_framework import serializers
from ..models import Food, DietPlan, DietPlanFood
from .food import FoodSerializer


class DietPlanFoodSerializer(serializers.ModelSerializer):
    """Serializer for DietPlanFood model - junction table between diet plan and food"""

    food = FoodSerializer(read_only=True)
    food_id = serializers.IntegerField(write_only=True)
    serving_description = serializers.SerializerMethodField()
    nutrition_totals = serializers.SerializerMethodField()
    meal_type_display = serializers.CharField(
        source="get_meal_type_display", read_only=True
    )

    class Meta:
        model = DietPlanFood
        fields = [
            "id",
            "food",
            "food_id",
            "meal_type",
            "meal_type_display",
            "serving_type",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "quantity",
            "calories",
            "protein",
            "carbs",
            "fat",
            "order",
            "serving_description",
            "nutrition_totals",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "calories",
            "protein",
            "carbs",
            "fat",
            "created_at",
        ]

    def get_serving_description(self, obj):
        """Get human-readable serving description"""
        return obj.get_serving_description()

    def get_nutrition_totals(self, obj):
        """Get nutrition totals for this food item"""
        return obj.get_nutrition_totals()

    def validate_food_id(self, value):
        """Validate food exists"""
        try:
            Food.objects.get(id=value)
        except Food.DoesNotExist:
            raise serializers.ValidationError("Food with this ID does not exist")
        return value

    def validate(self, data):
        """Validate serving information"""
        serving_type = data.get("serving_type")

        if serving_type == "fatsecret":
            if not data.get("fatsecret_serving_id"):
                raise serializers.ValidationError(
                    "fatsecret_serving_id is required when serving_type is 'fatsecret'"
                )
        elif serving_type == "custom":
            if not data.get("custom_serving_unit") or not data.get(
                "custom_serving_amount"
            ):
                raise serializers.ValidationError(
                    "custom_serving_unit and custom_serving_amount are required when serving_type is 'custom'"
                )

        quantity = data.get("quantity", 1.0)
        if quantity <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")

        return data


class DietPlanSerializer(serializers.ModelSerializer):
    """Serializer for DietPlan model with nested foods"""

    diet_plan_foods = DietPlanFoodSerializer(many=True, read_only=True)
    diet_plan_foods_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of foods to create with the diet plan",
    )
    meals_breakdown = serializers.SerializerMethodField()
    nutrition_summary = serializers.SerializerMethodField()
    foods_count = serializers.SerializerMethodField()

    class Meta:
        model = DietPlan
        fields = [
            "id",
            "user_id",
            "is_alternative",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "diet_plan_foods",
            "diet_plan_foods_data",
            "meals_breakdown",
            "nutrition_summary",
            "foods_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "created_at",
            "updated_at",
        ]

    def get_meals_breakdown(self, obj):
        """Get nutrition breakdown by meal type"""
        return obj.get_meals_breakdown()

    def get_nutrition_summary(self, obj):
        """Get overall nutrition summary"""
        return {
            "total_calories": obj.total_calories,
            "total_protein": obj.total_protein,
            "total_carbs": obj.total_carbs,
            "total_fat": obj.total_fat,
        }

    def get_foods_count(self, obj):
        """Get count of foods in this diet plan"""
        return obj.diet_plan_foods.count()

    def validate_diet_plan_foods_data(self, value):
        """Validate diet plan foods data structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("diet_plan_foods_data must be a list")

        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each food item must be a dictionary")

            # Required fields
            required_fields = ["food_id", "meal_type"]
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(
                        f"Each food item must have a {field}"
                    )

            # Validate food_id is integer
            if not isinstance(item["food_id"], int):
                raise serializers.ValidationError("food_id must be an integer")

            # Validate meal_type
            valid_meal_types = [choice[0] for choice in DietPlanFood.MEAL_TYPE_CHOICES]
            if item["meal_type"] not in valid_meal_types:
                raise serializers.ValidationError(
                    f"Invalid meal_type. Must be one of: {', '.join(valid_meal_types)}"
                )

            # Validate serving information if provided
            serving_type = item.get("serving_type", "fatsecret")
            if serving_type == "fatsecret":
                if "fatsecret_serving_id" not in item:
                    raise serializers.ValidationError(
                        "fatsecret_serving_id is required when serving_type is 'fatsecret'"
                    )
            elif serving_type == "custom":
                if (
                    "custom_serving_unit" not in item
                    or "custom_serving_amount" not in item
                ):
                    raise serializers.ValidationError(
                        "custom_serving_unit and custom_serving_amount are required when serving_type is 'custom'"
                    )

        return value

    def create(self, validated_data):
        """Create diet plan with foods"""
        diet_plan_foods_data = validated_data.pop("diet_plan_foods_data", [])
        diet_plan = DietPlan.objects.create(**validated_data)

        # Create diet plan foods
        for food_data in diet_plan_foods_data:
            DietPlanFood.objects.create(
                diet_plan=diet_plan,
                food_id=food_data["food_id"],
                meal_type=food_data["meal_type"],
                serving_type=food_data.get("serving_type", "fatsecret"),
                fatsecret_serving_id=food_data.get("fatsecret_serving_id"),
                custom_serving_unit=food_data.get("custom_serving_unit"),
                custom_serving_amount=food_data.get("custom_serving_amount"),
                quantity=food_data.get("quantity", 1.0),
                order=food_data.get("order", 0),
            )

        return diet_plan

    def update(self, instance, validated_data):
        """Update diet plan and foods"""
        diet_plan_foods_data = validated_data.pop("diet_plan_foods_data", None)

        # Update diet plan fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update foods if provided
        if diet_plan_foods_data is not None:
            # Delete existing foods
            instance.diet_plan_foods.all().delete()

            # Create new foods
            for food_data in diet_plan_foods_data:
                DietPlanFood.objects.create(
                    diet_plan=instance,
                    food_id=food_data["food_id"],
                    meal_type=food_data["meal_type"],
                    serving_type=food_data.get("serving_type", "fatsecret"),
                    fatsecret_serving_id=food_data.get("fatsecret_serving_id"),
                    custom_serving_unit=food_data.get("custom_serving_unit"),
                    custom_serving_amount=food_data.get("custom_serving_amount"),
                    quantity=food_data.get("quantity", 1.0),
                    order=food_data.get("order", 0),
                )

        return instance


class DietPlanListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing diet plans"""

    foods_count = serializers.SerializerMethodField()
    nutrition_summary = serializers.SerializerMethodField()

    class Meta:
        model = DietPlan
        fields = [
            "id",
            "is_alternative",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "foods_count",
            "nutrition_summary",
            "created_at",
            "updated_at",
        ]

    def get_foods_count(self, obj):
        """Get count of foods in this diet plan"""
        return obj.diet_plan_foods.count()

    def get_nutrition_summary(self, obj):
        """Get nutrition summary"""
        return {
            "total_calories": obj.total_calories,
            "total_protein": obj.total_protein,
            "total_carbs": obj.total_carbs,
            "total_fat": obj.total_fat,
        }


class DietPlanFoodCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating individual diet plan foods"""

    diet_plan = serializers.PrimaryKeyRelatedField(
        queryset=DietPlan.objects.none(),  # Will be set dynamically
        help_text="Select the diet plan to add this food to",
    )

    class Meta:
        model = DietPlanFood
        fields = [
            "diet_plan",
            "food",
            "meal_type",
            "serving_type",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "quantity",
            "order",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            # Limit diet plan choices to current user's plans
            self.fields["diet_plan"].queryset = DietPlan.objects.filter(
                user_id=request.user
            )

    def validate(self, data):
        """Validate serving information"""
        serving_type = data.get("serving_type", "fatsecret")

        if serving_type == "fatsecret":
            if not data.get("fatsecret_serving_id"):
                raise serializers.ValidationError(
                    "fatsecret_serving_id is required when serving_type is 'fatsecret'"
                )
        elif serving_type == "custom":
            if not data.get("custom_serving_unit") or not data.get(
                "custom_serving_amount"
            ):
                raise serializers.ValidationError(
                    "custom_serving_unit and custom_serving_amount are required when serving_type is 'custom'"
                )

        return data
