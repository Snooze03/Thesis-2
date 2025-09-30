from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import Account, Profile
from decimal import Decimal


class NutritionProfile(models.Model):
    """User's nutritional goals and targets - auto-calculated on account creation"""

    account = models.OneToOneField(
        Account, on_delete=models.CASCADE, related_name="nutrition_profile"
    )

    # Daily macro targets (auto-calculated based on profile data)
    daily_calories_goal = models.PositiveIntegerField(
        verbose_name="Daily Calorie Goal",
        help_text="Calculated daily calorie target",
        default=2000,
    )
    daily_protein_goal = models.FloatField(
        verbose_name="Daily Protein Goal (g)",
        help_text="Calculated daily protein target in grams",
        default=125.0,
    )
    daily_carbs_goal = models.FloatField(
        verbose_name="Daily Carbs Goal (g)",
        help_text="Calculated daily carbohydrate target in grams",
        default=225.0,
    )
    daily_fat_goal = models.FloatField(
        verbose_name="Daily Fat Goal (g)",
        help_text="Calculated daily fat target in grams",
        default=67.0,
    )

    # Calculation metadata
    bmr = models.FloatField(
        verbose_name="Basal Metabolic Rate",
        help_text="Calculated BMR used for macro calculations",
        default=1600.0,
    )
    tdee = models.FloatField(
        verbose_name="Total Daily Energy Expenditure",
        help_text="Calculated TDEE used for calorie goal",
        default=2000.0,
    )

    # Tracking
    is_auto_calculated = models.BooleanField(
        default=True, help_text="Whether macros were auto-calculated or manually set"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_profiles"
        verbose_name = "Nutrition Profile"
        verbose_name_plural = "Nutrition Profiles"

    def save(self, *args, **kwargs):
        """Override save to ensure BMR and TDEE are calculated before saving"""
        if not self.pk or not self.bmr or not self.tdee:
            macros = self.calculate_macros()

            self.bmr = macros["bmr"]
            self.tdee = macros["tdee"]
            self.daily_calories_goal = macros["daily_calories_goal"]
            self.daily_protein_goal = macros["daily_protein_goal"]
            self.daily_carbs_goal = macros["daily_carbs_goal"]
            self.daily_fat_goal = macros["daily_fat_goal"]

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.account.email} - Nutrition Profile"

    def calculate_macros(self):
        """Calculate daily macros based on user's profile data"""
        profile = getattr(self.account, "profile", None)

        if not profile or not self._has_complete_profile_data(profile):
            return self._get_default_macros()

        try:
            weight_kg = float(profile.starting_weight)

            # Convert height from feet/inches to cm
            total_inches = (self.account.height_ft * 12) + self.account.height_in
            height_cm = total_inches * 2.54

            estimated_age = 25

            if self.account.gender == "male":
                bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * estimated_age) + 5
            else:
                bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * estimated_age) - 161

            activity_multipliers = {
                "sedentary": 1.2,
                "lightly_active": 1.375,
                "moderately_active": 1.55,
                "very_active": 1.725,
            }

            multiplier = activity_multipliers.get(profile.activity_level, 1.55)
            tdee = bmr * multiplier

            goal_adjustments = {
                "lose_weight": -500,
                "gain_weight": +500,
                "maintain_weight": 0,
                "gain_muscle": +300,
                "build_strength": +200,
            }

            calorie_adjustment = goal_adjustments.get(profile.body_goal, 0)
            daily_calories = int(tdee + calorie_adjustment)

            if profile.body_goal in ["gain_muscle", "build_strength"]:
                protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30
            elif profile.body_goal == "lose_weight":
                protein_ratio, carb_ratio, fat_ratio = 0.35, 0.35, 0.30
            else:
                protein_ratio, carb_ratio, fat_ratio = 0.25, 0.45, 0.30

            daily_protein = (daily_calories * protein_ratio) / 4
            daily_carbs = (daily_calories * carb_ratio) / 4
            daily_fat = (daily_calories * fat_ratio) / 9

            return {
                "bmr": round(bmr, 1),
                "tdee": round(tdee, 1),
                "daily_calories_goal": daily_calories,
                "daily_protein_goal": round(daily_protein, 1),
                "daily_carbs_goal": round(daily_carbs, 1),
                "daily_fat_goal": round(daily_fat, 1),
            }

        except (AttributeError, TypeError, ValueError):
            return self._get_default_macros()

    def _has_complete_profile_data(self, profile):
        """Check if the user profile has all required data"""
        try:
            has_weight = bool(profile.current_weight or profile.starting_weight)
            has_height = bool(
                self.account.height_ft and self.account.height_in is not None
            )
            has_activity = bool(profile.activity_level)
            has_goal = bool(profile.body_goal)

            return has_weight and has_height and has_activity and has_goal
        except AttributeError:
            return False

    def _get_default_macros(self):
        """Default macros when profile data is not available"""
        if hasattr(self.account, "gender") and self.account.gender == "male":
            default_calories = 2200
        else:
            default_calories = 1800

        return {
            "bmr": 1600.0,
            "tdee": default_calories,
            "daily_calories_goal": default_calories,
            "daily_protein_goal": round(default_calories * 0.25 / 4, 1),
            "daily_carbs_goal": round(default_calories * 0.45 / 4, 1),
            "daily_fat_goal": round(default_calories * 0.30 / 9, 1),
        }

    def update_macros(self):
        """Recalculate and update macro goals"""
        macros = self.calculate_macros()
        for key, value in macros.items():
            setattr(self, key, value)
        self.save()


class Food(models.Model):
    """
    Master food database - stores unique foods from FatSecret API
    """

    # FatSecret API fields
    food_id = models.CharField(
        max_length=50, unique=True, help_text="FatSecret food ID"
    )
    food_name = models.CharField(max_length=255, help_text="Food name from FatSecret")
    food_type = models.CharField(max_length=50, blank=True, help_text="Type of food")

    # Additional metadata
    brand_name = models.CharField(
        max_length=255, blank=True, help_text="Brand name if applicable"
    )
    food_description = models.TextField(
        blank=True, help_text="Detailed description from FatSecret"
    )

    # Store FatSecret serving options as JSON (predefined servings from API)
    fatsecret_servings = models.JSONField(
        default=list,
        blank=True,
        help_text="Available serving options from FatSecret API",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_foods"
        verbose_name = "Food"
        verbose_name_plural = "Foods"
        ordering = ["food_name"]
        indexes = [
            models.Index(fields=["food_name"]),
            models.Index(fields=["brand_name"]),
        ]

    def __str__(self):
        return (
            f"{self.food_name} ({self.brand_name})"
            if self.brand_name
            else self.food_name
        )

    def get_serving_by_id(self, serving_id):
        """Get specific serving data by serving_id"""
        if not self.fatsecret_servings or not serving_id:
            return None

        for serving in self.fatsecret_servings:
            if serving.get("serving_id") == str(serving_id):
                return serving
        return None

    def get_default_serving(self):
        """Get the first available serving (usually 100g)"""
        if not self.fatsecret_servings:
            return None
        return self.fatsecret_servings[0] if self.fatsecret_servings else None


class DailyEntry(models.Model):
    """Daily nutrition tracking entries"""

    nutrition_profile = models.ForeignKey(
        NutritionProfile, on_delete=models.CASCADE, related_name="daily_entries"
    )
    date = models.DateField()

    # Calculated totals for the day (sum of all food entries)
    total_calories = models.FloatField(default=0.0)
    total_protein = models.FloatField(default=0.0)
    total_carbs = models.FloatField(default=0.0)
    total_fat = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_daily_entries"
        unique_together = ["nutrition_profile", "date"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.nutrition_profile.account.email} - {self.date}"

    def calculate_totals(self):
        """Calculate total nutrition from all food entries for this day"""
        food_entries = self.food_entries.all()
        totals = {
            "total_calories": 0.0,
            "total_protein": 0.0,
            "total_carbs": 0.0,
            "total_fat": 0.0,
        }

        for entry in food_entries:
            entry_nutrition = entry.get_nutrition_totals()
            for key in totals:
                totals[key] += entry_nutrition.get(key.replace("total_", ""), 0.0)

        for key, value in totals.items():
            setattr(self, key, round(value, 2))
        self.save()

        return totals

    # def get_nutrition_totals(self):
    #     """Get nutrition totals as a dictionary for easy consumption"""
    #     return {
    #         "calories": self.total_calories,
    #         "protein": self.total_protein,
    #         "carbs": self.total_carbs,
    #         "fat": self.total_fat,
    #     }

    def get_meals_breakdown(self):
        """Get nutrition breakdown by meal type"""
        meal_breakdown = {}

        for meal_type, meal_name in FoodEntry.MEAL_TYPE_CHOICES:
            entries = self.food_entries.filter(meal_type=meal_type)
            totals = {
                "calories": 0.0,
                "protein": 0.0,
                "carbs": 0.0,
                "fat": 0.0,
            }

            for entry in entries:
                entry_nutrition = entry.get_nutrition_totals()
                for key in totals:
                    totals[key] += entry_nutrition[key]

            meal_breakdown[meal_type] = {
                "name": meal_name,
                "totals": {k: round(v, 2) for k, v in totals.items()},
                "entries": entries,
            }

        return meal_breakdown


class FoodEntry(models.Model):
    """Individual food entries within a daily entry - replaces both Meal and MealFoodEntry"""

    MEAL_TYPE_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]

    SERVING_TYPE_CHOICES = [
        ("fatsecret", "FatSecret Predefined Serving"),
        ("custom", "Custom Serving"),
    ]

    # Direct relationship to daily entry
    daily_entry = models.ForeignKey(
        DailyEntry, on_delete=models.CASCADE, related_name="food_entries"
    )
    food = models.ForeignKey(Food, on_delete=models.CASCADE)

    # Meal categorization
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)

    # Serving information
    serving_type = models.CharField(
        max_length=20, choices=SERVING_TYPE_CHOICES, default="fatsecret"
    )

    # For FatSecret predefined servings - store the serving_id from the JSON array
    fatsecret_serving_id = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Index/ID of the serving in food.fatsecret_servings array (0, 1, 2, etc.)",
    )

    # For custom servings
    custom_serving_unit = models.CharField(
        max_length=50,
        blank=True,
        help_text="Custom unit like 'grams', 'cups', 'pieces'",
    )
    custom_serving_amount = models.FloatField(
        blank=True, null=True, help_text="Amount in the custom unit"
    )

    quantity = models.FloatField(default=1.0, help_text="Number of servings consumed")

    # Calculated nutrition values (stored for performance)
    calories = models.FloatField(default=0.0)
    protein = models.FloatField(default=0.0)
    carbs = models.FloatField(default=0.0)
    fat = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_food_entries"
        verbose_name = "Food Entry"
        verbose_name_plural = "Food Entries"
        ordering = ["daily_entry__date", "meal_type", "created_at"]

    def __str__(self):
        meal_display = self.get_meal_type_display()
        if self.serving_type == "fatsecret":
            return f"{meal_display}: {self.quantity}x FatSecret serving of {self.food.food_name}"
        else:
            return f"{meal_display}: {self.quantity}x {self.custom_serving_amount}{self.custom_serving_unit} of {self.food.food_name}"

    def save(self, *args, **kwargs):
        """Override save to calculate nutrition values before saving"""
        self.calculate_nutrition()
        super().save(*args, **kwargs)

    def get_nutrition_totals(self):
        """Get nutrition totals as a dictionary for easy consumption"""
        return {
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
        }

    def _convert_to_grams(self):
        """
        Convert custom serving to grams for nutrition calculation.
        This is a placeholder - you'll need to implement proper unit conversions.
        """
        if not self.custom_serving_amount or not self.custom_serving_unit:
            return 0

        # Basic unit conversions (extend as needed)
        unit_conversions = {
            "grams": 1,
            "g": 1,
            "kilograms": 1000,
            "kg": 1000,
            "ounces": 28.35,
            "oz": 28.35,
            "pounds": 453.59,
            "lb": 453.59,
            # Add more conversions as needed
            "cups": 240,  # Approximate for liquid
            "tablespoons": 15,
            "teaspoons": 5,
        }

        multiplier = unit_conversions.get(self.custom_serving_unit.lower(), 1)
        return self.custom_serving_amount * multiplier

    def _calculate_from_custom_serving(self):
        """Calculate nutrition from custom serving based on per-100g values"""
        if not self.custom_serving_amount:
            self._set_default_nutrition()
            return

        try:
            # Convert custom serving to grams
            grams = self._convert_to_grams()

            # For now, since Food model doesn't have per-100g values,
            # we'll use the first FatSecret serving as reference
            default_serving = self.food.get_default_serving()
            if not default_serving:
                self._set_default_nutrition()
                return

            # Calculate based on default serving (this is a simplified approach)
            serving_grams = float(default_serving.get("metric_serving_amount", 100))
            multiplier = (grams / serving_grams) * self.quantity

            serving_calories = float(default_serving.get("calories", 0))
            serving_protein = float(default_serving.get("protein", 0))
            serving_carbs = float(default_serving.get("carbohydrate", 0))
            serving_fat = float(default_serving.get("fat", 0))

            self.calories = round(serving_calories * multiplier, 2)
            self.protein = round(serving_protein * multiplier, 2)
            self.carbs = round(serving_carbs * multiplier, 2)
            self.fat = round(serving_fat * multiplier, 2)

        except (ValueError, TypeError):
            self._set_default_nutrition()

    def calculate_nutrition(self):
        """Calculate nutrition values based on serving type and quantity"""
        if self.serving_type == "fatsecret":
            self._calculate_from_fatsecret_serving()
        elif self.serving_type == "custom":
            self._calculate_from_custom_serving()
        else:
            self._set_default_nutrition()

    def _calculate_from_fatsecret_serving(self):
        """Calculate nutrition from selected FatSecret serving"""
        if not self.fatsecret_serving_id:
            self._set_default_nutrition()
            return

        # Get the specific serving data from the food's fatsecret_servings
        serving_data = self.food.get_serving_by_id(self.fatsecret_serving_id)

        if not serving_data:
            # Fallback to default serving if serving_id not found
            serving_data = self.food.get_default_serving()

        if not serving_data:
            self._set_default_nutrition()
            return

        try:
            # Extract nutrition values from serving data
            base_calories = float(serving_data.get("calories", 0))
            base_protein = float(serving_data.get("protein", 0))
            base_carbs = float(
                serving_data.get("carbohydrate", 0)
            )  # Note: FatSecret uses "carbohydrate"
            base_fat = float(serving_data.get("fat", 0))

            # Calculate based on quantity
            self.calories = round(base_calories * self.quantity, 2)
            self.protein = round(base_protein * self.quantity, 2)
            self.carbs = round(base_carbs * self.quantity, 2)
            self.fat = round(base_fat * self.quantity, 2)

        except (ValueError, TypeError, KeyError) as e:
            # Log the error and set defaults
            print(f"Error calculating nutrition from FatSecret serving: {e}")
            self._set_default_nutrition()

    def _calculate_from_custom_serving(self):
        """Calculate nutrition from custom serving based on per-100g values"""
        if not self.custom_serving_amount:
            self._set_default_nutrition()
            return

        try:
            # Convert custom serving to grams
            grams = self._convert_to_grams()

            # Use the 100g serving as reference (usually the second serving in FatSecret data)
            serving_100g = None

            # Look for 100g serving specifically
            for serving in self.food.fatsecret_servings:
                if (
                    serving.get("metric_serving_amount") == "100.000"
                    and serving.get("metric_serving_unit") == "g"
                ):
                    serving_100g = serving
                    break

            # If no 100g serving found, use the first available serving and calculate
            if not serving_100g:
                serving_100g = self.food.get_default_serving()

            if not serving_100g:
                self._set_default_nutrition()
                return

            # Calculate nutrition per gram
            serving_amount = float(serving_100g.get("metric_serving_amount", 100))
            calories_per_gram = float(serving_100g.get("calories", 0)) / serving_amount
            protein_per_gram = float(serving_100g.get("protein", 0)) / serving_amount
            carbs_per_gram = float(serving_100g.get("carbohydrate", 0)) / serving_amount
            fat_per_gram = float(serving_100g.get("fat", 0)) / serving_amount

            # Calculate totals based on custom serving amount and quantity
            total_grams = grams * self.quantity

            self.calories = round(calories_per_gram * total_grams, 2)
            self.protein = round(protein_per_gram * total_grams, 2)
            self.carbs = round(carbs_per_gram * total_grams, 2)
            self.fat = round(fat_per_gram * total_grams, 2)

        except (ValueError, TypeError, KeyError) as e:
            print(f"Error calculating nutrition from custom serving: {e}")
            self._set_default_nutrition()

    def _set_default_nutrition(self):
        """Set default nutrition values when calculation fails"""
        self.calories = 0.0
        self.protein = 0.0
        self.carbs = 0.0
        self.fat = 0.0

    def get_serving_description(self):
        """Get human-readable serving description"""
        if self.serving_type == "fatsecret":
            serving_data = self.food.get_serving_by_id(self.fatsecret_serving_id)
            if serving_data:
                return serving_data.get(
                    "serving_description", f"Serving ID: {self.fatsecret_serving_id}"
                )
            return f"FatSecret Serving: {self.fatsecret_serving_id}"
        elif self.serving_type == "custom":
            return f"{self.custom_serving_amount} {self.custom_serving_unit}"
        return "Unknown serving"

    def __str__(self):
        meal_display = self.get_meal_type_display()
        serving_desc = self.get_serving_description()
        return f"{meal_display}: {serving_desc} of {self.food.food_name}"


# Signals for auto-creating and updating nutrition profile
@receiver(post_save, sender=Account)
def create_nutrition_profile(sender, instance, created, **kwargs):
    """Create nutrition profile when user account is created"""
    if created:
        NutritionProfile.objects.create(account=instance)


@receiver(post_save, sender=Profile)
def update_nutrition_profile(sender, instance, **kwargs):
    """Update nutrition profile when user profile changes"""
    nutrition_profile = getattr(instance.account, "nutrition_profile", None)
    if nutrition_profile:
        nutrition_profile.update_macros()


# Signal to recalculate daily totals when meals change
@receiver(post_save, sender=FoodEntry)
@receiver(models.signals.post_delete, sender=FoodEntry)
def update_daily_totals(sender, instance, **kwargs):
    """Recalculate daily totals when food entries are added/updated/deleted"""
    daily_entry = instance.daily_entry
    daily_entry.calculate_totals()
