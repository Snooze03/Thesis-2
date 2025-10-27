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
        if obj.serving_type == "fatsecret" and obj.fatsecret_serving_id:
            serving = obj.food.get_serving_by_id(obj.fatsecret_serving_id)
            if serving:
                return serving.get("serving_description", "Unknown serving")
        elif obj.serving_type == "custom":
            return f"{obj.custom_serving_amount} {obj.custom_serving_unit}"
        return "Unknown serving"

    def get_nutrition_totals(self, obj):
        """Get nutrition totals for this food item"""
        return {
            "calories": obj.calories,
            "protein": obj.protein,
            "carbs": obj.carbs,
            "fat": obj.fat,
        }

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
    """Base serializer for DietPlan model"""

    # All foods (for backward compatibility)
    diet_plan_foods = DietPlanFoodSerializer(many=True, read_only=True)

    # Write-only field for creating foods with the diet plan
    diet_plan_foods_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of foods to create with the diet plan",
    )

    # Additional computed fields
    meals_breakdown = serializers.SerializerMethodField()
    # nutrition_summary = serializers.SerializerMethodField()
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
            # "nutrition_summary",
            "foods_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
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

    def get_foods_count(self, obj):
        """Get total count of foods in this diet plan"""
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


class DietPlanDetailSerializer(DietPlanSerializer):
    """Extended serializer with detailed food information organized by meal type"""

    # Nested foods organized by meal type (similar to daily entry pattern)
    breakfast_foods = serializers.SerializerMethodField()
    lunch_foods = serializers.SerializerMethodField()
    dinner_foods = serializers.SerializerMethodField()
    snack_foods = serializers.SerializerMethodField()

    class Meta(DietPlanSerializer.Meta):
        fields = DietPlanSerializer.Meta.fields + [
            "breakfast_foods",
            "lunch_foods",
            "dinner_foods",
            "snack_foods",
        ]

    def get_breakfast_foods(self, obj):
        """Get breakfast foods for this diet plan"""
        breakfast_foods = obj.diet_plan_foods.filter(meal_type="breakfast").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(breakfast_foods, many=True).data

    def get_lunch_foods(self, obj):
        """Get lunch foods for this diet plan"""
        lunch_foods = obj.diet_plan_foods.filter(meal_type="lunch").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(lunch_foods, many=True).data

    def get_dinner_foods(self, obj):
        """Get dinner foods for this diet plan"""
        dinner_foods = obj.diet_plan_foods.filter(meal_type="dinner").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(dinner_foods, many=True).data

    def get_snack_foods(self, obj):
        """Get snack foods for this diet plan"""
        snack_foods = obj.diet_plan_foods.filter(meal_type="snack").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(snack_foods, many=True).data


class DietPlanListSerializer(serializers.ModelSerializer):
    """Serializer for listing diet plans with actual food items organized by meal type"""

    # Nested foods organized by meal type - actual food items, not just counts
    breakfast_foods = serializers.SerializerMethodField()
    lunch_foods = serializers.SerializerMethodField()
    dinner_foods = serializers.SerializerMethodField()
    snack_foods = serializers.SerializerMethodField()

    # Summary fields
    foods_count = serializers.SerializerMethodField()

    class Meta:
        model = DietPlan
        fields = [
            "id",
            "is_alternative",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "breakfast_foods",
            "lunch_foods",
            "dinner_foods",
            "snack_foods",
            "foods_count",
            # "foods_by_meal_count",
            # "nutrition_summary",
            "created_at",
            "updated_at",
        ]

    def get_breakfast_foods(self, obj):
        """Get breakfast foods for this diet plan"""
        breakfast_foods = obj.diet_plan_foods.filter(meal_type="breakfast").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(breakfast_foods, many=True).data

    def get_lunch_foods(self, obj):
        """Get lunch foods for this diet plan"""
        lunch_foods = obj.diet_plan_foods.filter(meal_type="lunch").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(lunch_foods, many=True).data

    def get_dinner_foods(self, obj):
        """Get dinner foods for this diet plan"""
        dinner_foods = obj.diet_plan_foods.filter(meal_type="dinner").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(dinner_foods, many=True).data

    def get_snack_foods(self, obj):
        """Get snack foods for this diet plan"""
        snack_foods = obj.diet_plan_foods.filter(meal_type="snack").order_by(
            "order", "created_at"
        )
        return DietPlanFoodSerializer(snack_foods, many=True).data

    def get_foods_count(self, obj):
        """Get count of foods in this diet plan"""
        return obj.diet_plan_foods.count()


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


class QuickAddDietPlanFoodSerializer(serializers.ModelSerializer):
    """Quick add serializer for diet plan foods with minimal required fields"""

    class Meta:
        model = DietPlanFood
        fields = [
            "diet_plan",
            "food",
            "meal_type",
            "serving_type",
            "fatsecret_serving_id",
            "quantity",
        ]

    def validate(self, data):
        """Basic validation for quick add"""
        # Set default values
        if "serving_type" not in data:
            data["serving_type"] = "fatsecret"
        if "quantity" not in data:
            data["quantity"] = 1.0

        # Basic serving validation
        if data.get("serving_type") == "fatsecret" and not data.get(
            "fatsecret_serving_id"
        ):
            # Try to get the first available serving from the food
            food = data.get("food")
            if food and hasattr(food, "fatsecret_servings") and food.fatsecret_servings:
                data["fatsecret_serving_id"] = food.fatsecret_servings[0].get(
                    "serving_id"
                )

        return data
