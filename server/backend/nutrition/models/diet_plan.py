from django.db import models
from accounts.models import Account
from .food import Food


class DietPlan(models.Model):
    """Diet plan container - similar to Template in workouts app"""

    user_id = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="diet_plans",
    )

    is_alternative = models.BooleanField(default=False)

    # Calculated totals for the entire plan (sum of all meal items)
    total_calories = models.FloatField(default=0.0)
    total_protein = models.FloatField(default=0.0)
    total_carbs = models.FloatField(default=0.0)
    total_fat = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_diet_plans"
        ordering = ["-created_at"]

    def __str__(self):
        alt_text = " (Alternative)" if self.is_alternative else ""
        return f"{self.user_id.email} - Diet Plan{alt_text}"

    def calculate_totals(self):
        """Calculate total nutrition from all meal items in this diet plan"""
        meal_items = self.diet_plan_foods.all()
        totals = {
            "total_calories": 0.0,
            "total_protein": 0.0,
            "total_carbs": 0.0,
            "total_fat": 0.0,
        }

        for item in meal_items:
            item_nutrition = item.get_nutrition_totals()
            for key in totals:
                totals[key] += item_nutrition.get(key.replace("total_", ""), 0.0)

        for key, value in totals.items():
            setattr(self, key, round(value, 2))
        self.save()

        return totals

    def get_meals_breakdown(self):
        """Get nutrition breakdown by meal type"""
        meal_breakdown = {}

        for meal_type, meal_name in DietPlanFood.MEAL_TYPE_CHOICES:
            items = self.diet_plan_foods.filter(meal_type=meal_type)
            totals = {
                "calories": 0.0,
                "protein": 0.0,
                "carbs": 0.0,
                "fat": 0.0,
            }

            for item in items:
                item_nutrition = item.get_nutrition_totals()
                for key in totals:
                    totals[key] += item_nutrition[key]

            meal_breakdown[meal_type] = {
                "name": meal_name,
                "totals": {k: round(v, 2) for k, v in totals.items()},
                "items": items,
            }

        return meal_breakdown


class DietPlanFood(models.Model):
    """
    Junction table linking diet plans to foods - similar to TemplateExercise
    This allows the same food to be used in multiple diet plans
    """

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

    diet_plan = models.ForeignKey(
        DietPlan,
        on_delete=models.CASCADE,
        related_name="diet_plan_foods",
    )
    food = models.ForeignKey(
        Food,
        on_delete=models.CASCADE,
        related_name="food_diet_plans",
    )

    # Meal categorization - this is where meal type lives now
    meal_type = models.CharField(
        max_length=20,
        choices=MEAL_TYPE_CHOICES,
        help_text="Which meal this food belongs to",
    )

    # Serving information
    serving_type = models.CharField(
        max_length=20, choices=SERVING_TYPE_CHOICES, default="fatsecret"
    )

    # For FatSecret predefined servings
    fatsecret_serving_id = models.CharField(
        blank=True,
        null=True,
        max_length=10,
        help_text="Index/ID of the serving in food.fatsecret_servings array",
    )

    # For custom servings
    custom_serving_unit = models.CharField(
        blank=True,
        null=True,
        max_length=50,
        help_text="Custom unit like 'grams', 'cups', 'pieces'",
    )
    custom_serving_amount = models.FloatField(
        blank=True, null=True, help_text="Amount in the custom unit"
    )

    quantity = models.FloatField(default=1.0, help_text="Number of servings planned")

    # Calculated nutrition values (stored for performance)
    calories = models.FloatField(default=0.0)
    protein = models.FloatField(default=0.0)
    carbs = models.FloatField(default=0.0)
    fat = models.FloatField(default=0.0)

    # Additional planning fields
    order = models.PositiveIntegerField(
        default=0, help_text="Order of foods in the plan"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "nutrition_diet_plan_foods"
        verbose_name = "Diet Plan Food"
        verbose_name_plural = "Diet Plan Foods"
        unique_together = (
            "diet_plan",
            "food",
            "meal_type",
        )  # Prevent duplicate foods in same meal
        ordering = ["meal_type", "order", "created_at"]

    def save(self, *args, **kwargs):
        """Override save to calculate nutrition values before saving"""
        self.calculate_nutrition()
        super().save(*args, **kwargs)
        # Recalculate diet plan totals after saving
        self.diet_plan.calculate_totals()

    def delete(self, *args, **kwargs):
        """Override delete to recalculate diet plan totals after deletion"""
        diet_plan = self.diet_plan
        super().delete(*args, **kwargs)
        diet_plan.calculate_totals()

    def get_nutrition_totals(self):
        """Get nutrition totals as a dictionary"""
        return {
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
        }

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

        serving_data = self.food.get_serving_by_id(self.fatsecret_serving_id)

        if not serving_data:
            serving_data = self.food.get_default_serving()

        if not serving_data:
            self._set_default_nutrition()
            return

        try:
            base_calories = float(serving_data.get("calories", 0))
            base_protein = float(serving_data.get("protein", 0))
            base_carbs = float(serving_data.get("carbohydrate", 0))
            base_fat = float(serving_data.get("fat", 0))

            self.calories = round(base_calories * self.quantity, 2)
            self.protein = round(base_protein * self.quantity, 2)
            self.carbs = round(base_carbs * self.quantity, 2)
            self.fat = round(base_fat * self.quantity, 2)

        except (ValueError, TypeError, KeyError) as e:
            print(f"Error calculating nutrition from FatSecret serving: {e}")
            self._set_default_nutrition()

    def _calculate_from_custom_serving(self):
        """Calculate nutrition from custom serving"""
        if not self.custom_serving_amount:
            self._set_default_nutrition()
            return

        try:
            grams = self._convert_to_grams()
            serving_100g = self._get_100g_serving()

            if not serving_100g:
                self._set_default_nutrition()
                return

            serving_amount = float(serving_100g.get("metric_serving_amount", 100))
            calories_per_gram = float(serving_100g.get("calories", 0)) / serving_amount
            protein_per_gram = float(serving_100g.get("protein", 0)) / serving_amount
            carbs_per_gram = float(serving_100g.get("carbohydrate", 0)) / serving_amount
            fat_per_gram = float(serving_100g.get("fat", 0)) / serving_amount

            total_grams = grams * self.quantity

            self.calories = round(calories_per_gram * total_grams, 2)
            self.protein = round(protein_per_gram * total_grams, 2)
            self.carbs = round(carbs_per_gram * total_grams, 2)
            self.fat = round(fat_per_gram * total_grams, 2)

        except (ValueError, TypeError, KeyError) as e:
            print(f"Error calculating nutrition from custom serving: {e}")
            self._set_default_nutrition()

    def _convert_to_grams(self):
        """Convert custom serving to grams for nutrition calculation"""
        if not self.custom_serving_amount or not self.custom_serving_unit:
            return 0

        unit_conversions = {
            "grams": 1,
            "g": 1,
            "kilograms": 1000,
            "kg": 1000,
            "ounces": 28.35,
            "oz": 28.35,
            "pounds": 453.59,
            "lb": 453.59,
            "cups": 240,
            "tablespoons": 15,
            "teaspoons": 5,
        }

        multiplier = unit_conversions.get(self.custom_serving_unit.lower(), 1)
        return self.custom_serving_amount * multiplier

    def _get_100g_serving(self):
        """Get the 100g serving from FatSecret data"""
        for serving in self.food.fatsecret_servings:
            if (
                serving.get("metric_serving_amount") == "100.000"
                and serving.get("metric_serving_unit") == "g"
            ):
                return serving
        return self.food.get_default_serving()

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
        return f"{self.diet_plan.title} - {meal_display}: {serving_desc} of {self.food.food_name}"
