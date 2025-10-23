from rest_framework import serializers
from ..models import DailyEntry, FoodEntry


class FoodEntrySerializer(serializers.ModelSerializer):
    """Serializer for FoodEntry model - replaces both Meal and MealFoodEntry serializers"""

    # Read-only fields for displaying food info
    food_name = serializers.CharField(source="food.food_name", read_only=True)
    food_brand = serializers.CharField(source="food.brand_name", read_only=True)
    serving_description = serializers.SerializerMethodField()
    serving_type_display = serializers.CharField(
        source="get_serving_type_display", read_only=True
    )
    meal_type_display = serializers.CharField(
        source="get_meal_type_display", read_only=True
    )

    # Calculated nutrition totals (automatically calculated on save)
    nutrition_totals = serializers.SerializerMethodField()

    class Meta:
        model = FoodEntry
        fields = [
            "id",
            "daily_entry",
            "food",
            "food_name",
            "food_brand",
            "meal_type",
            "meal_type_display",
            "serving_type",
            "serving_type_display",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "serving_description",
            "quantity",
            "calories",
            "protein",
            "carbs",
            "fat",
            "nutrition_totals",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "food_name",
            "food_id",
            "food_brand",
            "serving_type_display",
            "meal_type_display",
            "serving_description",
            "calories",
            "protein",
            "carbs",
            "fat",
            "nutrition_totals",
            "created_at",
            "updated_at",
        ]

    def get_serving_description(self, obj):
        """Get human-readable serving description"""
        return obj.get_serving_description()

    def get_nutrition_totals(self, obj):
        """Get nutrition totals as a dictionary for easier frontend consumption"""
        return obj.get_nutrition_totals()

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
            if food and food.fatsecret_servings:
                serving_ids = [s.get("serving_id") for s in food.fatsecret_servings]
                if str(data.get("fatsecret_serving_id")) not in serving_ids:
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


class DailyEntrySerializer(serializers.ModelSerializer):
    """Serializer for DailyEntry model with grouped food entries by meal type"""

    # Group food entries by meal type
    meals_breakdown = serializers.SerializerMethodField()
    food_entries = FoodEntrySerializer(many=True, read_only=True)
    food_entries_count = serializers.SerializerMethodField()

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
            "food_entries",
            "food_entries_count",
            "meals_breakdown",
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
            "food_entries",
            "food_entries_count",
            "meals_breakdown",
            "nutrition_goals",
            "calories_progress",
            "protein_progress",
            "carbs_progress",
            "fat_progress",
            "created_at",
            "updated_at",
        ]

    def get_food_entries_count(self, obj):
        """Get count of food entries for this daily entry"""
        return obj.food_entries.count()

    def get_meals_breakdown(self, obj):
        """Get food entries grouped by meal type with totals"""
        # Import here to avoid circular imports
        from ..models import FoodEntry

        meal_breakdown = {}

        # Get all meal type choices
        for meal_type, meal_name in FoodEntry.MEAL_TYPE_CHOICES:
            entries = obj.food_entries.filter(meal_type=meal_type)

            # Calculate totals for this meal type
            totals = {
                "calories": 0.0,
                "protein": 0.0,
                "carbs": 0.0,
                "fat": 0.0,
            }

            # Serialize the entries for this meal type
            serialized_entries = []
            for entry in entries:
                # Get nutrition totals from each entry
                entry_nutrition = entry.get_nutrition_totals()
                for key in totals:
                    totals[key] += entry_nutrition[key]

                # Serialize the entry (but avoid circular serialization)
                entry_data = {
                    "id": entry.id,
                    "food_id": entry.food.food_id,
                    "food_name": entry.food.food_name,
                    "food_brand": entry.food.brand_name or "",
                    "quantity": entry.quantity,
                    "serving_description": entry.get_serving_description(),
                    "calories": entry.calories,
                    "protein": entry.protein,
                    "carbs": entry.carbs,
                    "fat": entry.fat,
                    "meal_type": entry.meal_type,
                    "serving_type": entry.serving_type,
                    "created_at": entry.created_at,
                }
                serialized_entries.append(entry_data)

            meal_breakdown[meal_type] = {
                "name": meal_name,
                "totals": {k: round(v, 2) for k, v in totals.items()},
                "entries": serialized_entries,
                "entries_count": len(serialized_entries),
            }

        return meal_breakdown

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
class FoodEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating food entries"""

    food_id = serializers.CharField(source="food.food_id", read_only=True)

    class Meta:
        model = FoodEntry
        fields = [
            "daily_entry",
            "food",
            "food_id",
            "meal_type",
            "serving_type",
            "fatsecret_serving_id",
            "custom_serving_unit",
            "custom_serving_amount",
            "quantity",
        ]
        read_only_fields = ["food_id"]

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

            # Validate serving exists
            food = data.get("food")
            if food and food.fatsecret_servings:
                serving_ids = [s.get("serving_id") for s in food.fatsecret_servings]
                if str(data.get("fatsecret_serving_id")) not in serving_ids:
                    raise serializers.ValidationError(
                        "Selected FatSecret serving is not available for this food."
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


class QuickAddFoodEntrySerializer(serializers.Serializer):
    """Serializer for quickly adding a food entry to a daily entry"""

    daily_entry_id = serializers.IntegerField()
    food_id = serializers.IntegerField()
    meal_type = serializers.ChoiceField(choices=FoodEntry.MEAL_TYPE_CHOICES)
    serving_type = serializers.ChoiceField(choices=FoodEntry.SERVING_TYPE_CHOICES)
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

    def validate_daily_entry_id(self, value):
        """Validate daily entry exists"""
        try:
            DailyEntry.objects.get(id=value)
        except DailyEntry.DoesNotExist:
            raise serializers.ValidationError("Daily entry does not exist.")
        return value

    def validate_food_id(self, value):
        """Validate food exists"""
        # Changed: Import moved inside method to avoid circular imports
        from ..models import Food

        try:
            Food.objects.get(id=value)
        except Food.DoesNotExist:
            raise serializers.ValidationError("Food does not exist.")
        return value

    def create(self, validated_data):
        """Create a new food entry"""
        # Changed: Import moved inside method to avoid circular imports
        from ..models import Food

        daily_entry = DailyEntry.objects.get(id=validated_data.pop("daily_entry_id"))
        food = Food.objects.get(id=validated_data.pop("food_id"))

        return FoodEntry.objects.create(
            daily_entry=daily_entry, food=food, **validated_data
        )


# Meal-specific serializers for easier frontend consumption
class MealBreakdownSerializer(serializers.Serializer):
    """Serializer for individual meal breakdown within a daily entry"""

    meal_type = serializers.CharField()
    name = serializers.CharField()
    totals = serializers.DictField()
    entries = FoodEntrySerializer(many=True)


class DailyEntryDetailSerializer(DailyEntrySerializer):
    """Detailed daily entry serializer with expanded meal breakdowns"""

    breakfast_entries = serializers.SerializerMethodField()
    lunch_entries = serializers.SerializerMethodField()
    dinner_entries = serializers.SerializerMethodField()
    snack_entries = serializers.SerializerMethodField()

    class Meta(DailyEntrySerializer.Meta):
        fields = DailyEntrySerializer.Meta.fields + [
            "breakfast_entries",
            "lunch_entries",
            "dinner_entries",
            "snack_entries",
        ]

    def get_breakfast_entries(self, obj):
        entries = obj.food_entries.filter(meal_type="breakfast")
        return FoodEntrySerializer(entries, many=True).data

    def get_lunch_entries(self, obj):
        entries = obj.food_entries.filter(meal_type="lunch")
        return FoodEntrySerializer(entries, many=True).data

    def get_dinner_entries(self, obj):
        entries = obj.food_entries.filter(meal_type="dinner")
        return FoodEntrySerializer(entries, many=True).data

    def get_snack_entries(self, obj):
        entries = obj.food_entries.filter(meal_type="snack")
        return FoodEntrySerializer(entries, many=True).data
