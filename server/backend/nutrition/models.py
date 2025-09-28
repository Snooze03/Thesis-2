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

    # Basic nutritional information per 100g (for reference)
    calories = models.FloatField(default=0.0)
    protein = models.FloatField(default=0.0)
    carbs = models.FloatField(default=0.0)
    fat = models.FloatField(default=0.0)

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


class DailyEntry(models.Model):
    """Daily nutrition tracking entries"""

    nutrition_profile = models.ForeignKey(
        NutritionProfile, on_delete=models.CASCADE, related_name="daily_entries"
    )
    date = models.DateField()

    # Calculated totals for the day (sum of all meals)
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
        """Calculate total nutrition from all meals for this day"""
        meals = self.meals.all()
        totals = {
            "total_calories": 0.0,
            "total_protein": 0.0,
            "total_carbs": 0.0,
            "total_fat": 0.0,
        }

        for meal in meals:
            meal_nutrition = meal.get_nutrition_totals()
            for key in totals:
                totals[key] += meal_nutrition.get(key.replace("total_", ""), 0.0)

        for key, value in totals.items():
            setattr(self, key, round(value, 2))
        self.save()

        return totals


class Meal(models.Model):
    """Individual meals within a daily entry"""

    MEAL_TYPE_CHOICES = [
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    ]

    daily_entry = models.ForeignKey(
        DailyEntry, on_delete=models.CASCADE, related_name="meals"
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    meal_name = models.CharField(
        max_length=255, blank=True, help_text="Optional custom meal name"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_meals"
        verbose_name = "Meal"
        verbose_name_plural = "Meals"
        ordering = ["daily_entry__date", "meal_type"]

    def __str__(self):
        meal_name = self.meal_name or self.get_meal_type_display()
        return f"{self.daily_entry.nutrition_profile.account.email} - {meal_name} ({self.daily_entry.date})"

    def get_nutrition_totals(self):
        """Calculate total nutrition for this meal"""
        food_entries = self.food_entries.all()
        totals = {
            "calories": 0.0,
            "protein": 0.0,
            "carbs": 0.0,
            "fat": 0.0,
        }

        for entry in food_entries:
            entry_nutrition = entry.get_nutrition_totals()
            for key in totals:
                totals[key] += entry_nutrition[key]

        return {k: round(v, 2) for k, v in totals.items()}


class MealFoodEntry(models.Model):
    """
    Individual food items within a meal
    This is where user-specific serving data is stored
    """

    SERVING_TYPE_CHOICES = [
        ("fatsecret", "FatSecret Predefined Serving"),
        ("custom", "Custom Serving"),
    ]

    meal = models.ForeignKey(
        Meal, on_delete=models.CASCADE, related_name="food_entries"
    )
    food = models.ForeignKey(Food, on_delete=models.CASCADE)

    # Serving information - flexible approach
    serving_type = models.CharField(
        max_length=20, choices=SERVING_TYPE_CHOICES, default="fatsecret"
    )

    # For FatSecret predefined servings
    fatsecret_serving_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="ID of the FatSecret serving from food.fatsecret_servings",
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

    class Meta:
        db_table = "meal_food_entries"
        verbose_name = "Meal Food Entry"
        verbose_name_plural = "Meal Food Entries"

    def __str__(self):
        if self.serving_type == "fatsecret":
            return f"{self.quantity}x FatSecret serving of {self.food.food_name}"
        else:
            return f"{self.quantity}x {self.custom_serving_amount}{self.custom_serving_unit} of {self.food.food_name}"

    def save(self, *args, **kwargs):
        """Override save to calculate nutrition values before saving"""
        self.calculate_nutrition()
        super().save(*args, **kwargs)

    def calculate_nutrition(self):
        """Calculate nutrition based on serving type and quantity"""
        if self.serving_type == "fatsecret":
            self._calculate_from_fatsecret_serving()
        else:
            self._calculate_from_custom_serving()

    def _calculate_from_fatsecret_serving(self):
        """Calculate nutrition from FatSecret predefined serving"""
        if not self.fatsecret_serving_id:
            return

        # Find the serving in food's fatsecret_servings JSON
        for serving in self.food.fatsecret_servings:
            if serving.get("serving_id") == self.fatsecret_serving_id:
                self.calories = serving.get("calories", 0) * self.quantity
                self.protein = serving.get("protein", 0) * self.quantity
                self.carbs = serving.get("carbs", 0) * self.quantity
                self.fat = serving.get("fat", 0) * self.quantity
                break

    def _calculate_from_custom_serving(self):
        """Calculate nutrition from custom serving based on per-100g values"""
        if not self.custom_serving_amount:
            return

        # Convert custom serving to grams
        grams = self._convert_to_grams()

        if grams:
            # Calculate based on per-100g values - fix field names
            multiplier = (grams / 100.0) * self.quantity
            self.calories = self.food.calories * multiplier
            self.protein = self.food.protein * multiplier
            self.carbs = self.food.carbs * multiplier
            self.fat = self.food.fat * multiplier

    def _convert_to_grams(self):
        """Convert custom serving to grams - extend this for more units"""
        unit_conversions = {
            "g": 1.0,
            "gram": 1.0,
            "grams": 1.0,
            "kg": 1000.0,
            "oz": 28.35,
            "lb": 453.59,
            # Add more conversions as needed
        }

        unit = self.custom_serving_unit.lower()
        if unit in unit_conversions:
            return self.custom_serving_amount * unit_conversions[unit]

        # Default: assume it's already in grams
        return self.custom_serving_amount

    def get_nutrition_totals(self):
        """Get calculated nutrition totals"""
        return {
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
        }


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
@receiver(post_save, sender=MealFoodEntry)
@receiver(models.signals.post_delete, sender=MealFoodEntry)
def update_daily_totals(sender, instance, **kwargs):
    """Recalculate daily totals when meal food entries are added/updated/deleted"""
    daily_entry = instance.meal.daily_entry
    daily_entry.calculate_totals()
