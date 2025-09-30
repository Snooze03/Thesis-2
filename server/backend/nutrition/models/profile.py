from django.db import models
from accounts.models import Account


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
