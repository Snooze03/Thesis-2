from rest_framework import serializers
from .models import NutritionProfile, Food, DailyEntry, Meal, MealFoodEntry
from accounts.serializers import AccountSerializer


class NutritionProfileSerializer(serializers.ModelSerializer):
    account_email = serializers.EmailField(source="account.email", read_only=True)
    account_name = serializers.CharField(source="account.get_full_name", read_only=True)

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
            "calories",
            "protein",
            "carbs",
            "fat",
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


class MealFoodEntrySerializer(serializers.ModelSerializer):
    """Serializer for MealFoodEntry model"""

    # Read-only fields for displaying food info
    food_name = serializers.CharField(source="food.food_name", read_only=True)
    food_brand = serializers.CharField(source="food.brand_name", read_only=True)
    serving_description = serializers.SerializerMethodField()
    serving_type_display = serializers.CharField(
        source="get_serving_type_display", read_only=True
    )

    # Calculated nutrition totals (automatically calculated on save)
    total_calories = serializers.FloatField(source="calories", read_only=True)
    total_protein = serializers.FloatField(source="protein", read_only=True)
    total_carbs = serializers.FloatField(source="carbs", read_only=True)
    total_fat = serializers.FloatField(source="fat", read_only=True)

    class Meta:
        model = MealFoodEntry
        fields = [
            "id",
            "meal",
            "food",
            "food_name",
            "food_brand",
            "serving_type",
            "serving_type_display",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "serving_description",
            "quantity",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "calories",
            "protein",
            "carbs",
            "fat",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "food_name",
            "food_brand",
            "serving_type_display",
            "serving_description",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "calories",
            "protein",
            "carbs",
            "fat",
            "created_at",
        ]

    def get_serving_description(self, obj):
        """Get human-readable serving description"""
        if obj.serving_type == "fatsecret":
            # Look up serving description from food's fatsecret_servings
            for serving in obj.food.fatsecret_servings:
                if serving.get("serving_id") == obj.fatsecret_serving_id:
                    return serving.get("serving_description", "Unknown serving")
            return f"FatSecret serving {obj.fatsecret_serving_id}"
        else:
            return f"{obj.custom_serving_amount} {obj.custom_serving_unit}"

    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate(self, data):
        """Validate serving data based on serving type"""
        serving_type = data.get("serving_type", "fatsecret")

        if serving_type == "fatsecret":
            # Validate FatSecret serving
            if not data.get("fatsecret_serving_id"):
                raise serializers.ValidationError(
                    "fatsecret_serving_id is required for FatSecret servings."
                )

            # Validate that the serving exists in the food's available servings
            food = data.get("food")
            if food:
                serving_ids = [s.get("serving_id") for s in food.fatsecret_servings]
                if data.get("fatsecret_serving_id") not in serving_ids:
                    raise serializers.ValidationError(
                        "Selected FatSecret serving is not available for this food."
                    )

        elif serving_type == "custom":
            # Validate custom serving
            if not data.get("custom_serving_unit"):
                raise serializers.ValidationError(
                    "custom_serving_unit is required for custom servings."
                )
            if not data.get("custom_serving_amount"):
                raise serializers.ValidationError(
                    "custom_serving_amount is required for custom servings."
                )
            if data.get("custom_serving_amount") <= 0:
                raise serializers.ValidationError(
                    "custom_serving_amount must be greater than 0."
                )

        return data


class MealSerializer(serializers.ModelSerializer):
    """Serializer for Meal model"""

    food_entries = MealFoodEntrySerializer(many=True, read_only=True)
    food_entries_count = serializers.IntegerField(
        source="food_entries.count", read_only=True
    )
    nutrition_totals = serializers.SerializerMethodField()
    meal_type_display = serializers.CharField(
        source="get_meal_type_display", read_only=True
    )

    class Meta:
        model = Meal
        fields = [
            "id",
            "daily_entry",
            "meal_type",
            "meal_type_display",
            "meal_name",
            "food_entries",
            "food_entries_count",
            "nutrition_totals",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "meal_type_display",
            "food_entries",
            "food_entries_count",
            "nutrition_totals",
            "created_at",
            "updated_at",
        ]

    def get_nutrition_totals(self, obj):
        """Get calculated nutrition totals for this meal"""
        return obj.get_nutrition_totals()


class DailyEntrySerializer(serializers.ModelSerializer):
    """Serializer for DailyEntry model"""

    meals = MealSerializer(many=True, read_only=True)
    meals_count = serializers.IntegerField(source="meals.count", read_only=True)

    # Nutrition profile goals for comparison
    nutrition_goals = serializers.SerializerMethodField()

    # Progress percentages
    calories_progress = serializers.SerializerMethodField()
    protein_progress = serializers.SerializerMethodField()
    carbs_progress = serializers.SerializerMethodField()
    fat_progress = serializers.SerializerMethodField()

    class Meta:
        model = DailyEntry
        fields = [
            "id",
            "nutrition_profile",
            "date",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "meals",
            "meals_count",
            "nutrition_goals",
            "calories_progress",
            "protein_progress",
            "carbs_progress",
            "fat_progress",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_calories",
            "total_protein",
            "total_carbs",
            "total_fat",
            "meals",
            "meals_count",
            "nutrition_goals",
            "calories_progress",
            "protein_progress",
            "carbs_progress",
            "fat_progress",
            "created_at",
            "updated_at",
        ]

    def get_nutrition_goals(self, obj):
        """Get nutrition goals from the profile"""
        profile = obj.nutrition_profile
        return {
            "daily_calories_goal": profile.daily_calories_goal,
            "daily_protein_goal": profile.daily_protein_goal,
            "daily_carbs_goal": profile.daily_carbs_goal,
            "daily_fat_goal": profile.daily_fat_goal,
        }

    def get_calories_progress(self, obj):
        """Calculate calories progress percentage"""
        if obj.nutrition_profile.daily_calories_goal > 0:
            return round(
                (obj.total_calories / obj.nutrition_profile.daily_calories_goal) * 100,
                1,
            )
        return 0.0

    def get_protein_progress(self, obj):
        """Calculate protein progress percentage"""
        if obj.nutrition_profile.daily_protein_goal > 0:
            return round(
                (obj.total_protein / obj.nutrition_profile.daily_protein_goal) * 100, 1
            )
        return 0.0

    def get_carbs_progress(self, obj):
        """Calculate carbs progress percentage"""
        if obj.nutrition_profile.daily_carbs_goal > 0:
            return round(
                (obj.total_carbs / obj.nutrition_profile.daily_carbs_goal) * 100, 1
            )
        return 0.0

    def get_fat_progress(self, obj):
        """Calculate fat progress percentage"""
        if obj.nutrition_profile.daily_fat_goal > 0:
            return round(
                (obj.total_fat / obj.nutrition_profile.daily_fat_goal) * 100, 1
            )
        return 0.0

    def validate(self, data):
        """Validate unique daily entry per nutrition profile per date"""
        nutrition_profile = data.get("nutrition_profile")
        date = data.get("date")

        if self.instance:
            # For updates, exclude current instance
            if (
                self.instance.nutrition_profile == nutrition_profile
                and self.instance.date == date
            ):
                return data

        if DailyEntry.objects.filter(
            nutrition_profile=nutrition_profile, date=date
        ).exists():
            raise serializers.ValidationError(
                "A daily entry for this date already exists."
            )
        return data


# Create/Update serializers
class MealFoodEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating meal food entries"""

    class Meta:
        model = MealFoodEntry
        fields = [
            "food",
            "serving_type",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "quantity",
        ]

    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate(self, data):
        """Validate serving data based on serving type"""
        serving_type = data.get("serving_type", "fatsecret")

        if serving_type == "fatsecret":
            if not data.get("fatsecret_serving_id"):
                raise serializers.ValidationError(
                    "fatsecret_serving_id is required for FatSecret servings."
                )
        elif serving_type == "custom":
            if not data.get("custom_serving_unit") or not data.get(
                "custom_serving_amount"
            ):
                raise serializers.ValidationError(
                    "Both custom_serving_unit and custom_serving_amount are required for custom servings."
                )
            if data.get("custom_serving_amount") <= 0:
                raise serializers.ValidationError(
                    "custom_serving_amount must be greater than 0."
                )

        return data


class MealCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating meals with optional food entries"""

    food_entries = MealFoodEntryCreateSerializer(many=True, required=False)

    class Meta:
        model = Meal
        fields = ["meal_type", "meal_name", "food_entries"]

    def create(self, validated_data):
        """Create meal and associated food entries"""
        food_entries_data = validated_data.pop("food_entries", [])
        meal = Meal.objects.create(**validated_data)

        # Create food entries for this meal
        for entry_data in food_entries_data:
            MealFoodEntry.objects.create(meal=meal, **entry_data)

        return meal


# Summary and utility serializers
class NutritionSummarySerializer(serializers.Serializer):
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


class FoodServingOptionSerializer(serializers.Serializer):
    serving_id = serializers.CharField()
    serving_description = serializers.CharField()
    metric_serving_amount = serializers.FloatField(required=False)
    metric_serving_unit = serializers.CharField(required=False)
    calories = serializers.FloatField(required=False)
    protein = serializers.FloatField(required=False)
    carbs = serializers.FloatField(required=False)
    fat = serializers.FloatField(required=False)


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


class QuickAddFoodEntrySerializer(serializers.Serializer):
    """Serializer for quickly adding a food entry to a meal"""

    food_id = serializers.IntegerField()
    serving_type = serializers.ChoiceField(choices=MealFoodEntry.SERVING_TYPE_CHOICES)
    fatsecret_serving_id = serializers.CharField(required=False, allow_blank=True)
    custom_serving_unit = serializers.CharField(required=False, allow_blank=True)
    custom_serving_amount = serializers.FloatField(required=False, allow_null=True)
    quantity = serializers.FloatField(min_value=0.1)

    def validate(self, data):
        """Validate serving data based on type"""
        serving_type = data.get("serving_type")

        if serving_type == "fatsecret":
            if not data.get("fatsecret_serving_id"):
                raise serializers.ValidationError(
                    "fatsecret_serving_id is required for FatSecret servings."
                )
        elif serving_type == "custom":
            if not data.get("custom_serving_unit") or not data.get(
                "custom_serving_amount"
            ):
                raise serializers.ValidationError(
                    "Both custom_serving_unit and custom_serving_amount are required for custom servings."
                )

        return data
