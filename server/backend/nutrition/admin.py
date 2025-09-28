from django.contrib import admin
from django.contrib.admin import actions
from django.contrib import messages
from accounts.models import Account
from .models import NutritionProfile, Food, DailyEntry, Meal, MealFoodEntry


@admin.action(description="Create nutrition profiles for selected accounts")
def create_nutrition_profiles_for_accounts(modeladmin, request, queryset):
    """Admin action to create nutrition profiles for selected accounts"""
    created_count = 0
    skipped_count = 0
    warning_count = 0

    for account in queryset:
        # Check if account already has a nutrition profile
        if hasattr(account, "nutrition_profile"):
            skipped_count += 1
            continue

        try:
            # Create nutrition profile - the save method will handle macro calculation
            nutrition_profile = NutritionProfile.objects.create(account=account)

            # Check if defaults were used (indicates incomplete profile)
            profile = getattr(account, "profile", None)
            if not profile or not nutrition_profile._has_complete_profile_data(profile):
                warning_count += 1
                messages.warning(
                    request,
                    f"Created nutrition profile for {account.email} using default values. "
                    f"User should complete their fitness profile for personalized macros.",
                )

            created_count += 1

        except Exception as e:
            messages.error(
                request,
                f"Error creating nutrition profile for {account.email}: {str(e)}",
            )

    # Show summary messages
    if created_count > 0:
        messages.success(
            request, f"Successfully created {created_count} nutrition profile(s)."
        )

    if skipped_count > 0:
        messages.info(
            request,
            f"Skipped {skipped_count} account(s) that already have nutrition profiles.",
        )

    if warning_count > 0:
        messages.warning(
            request,
            f"{warning_count} profile(s) created with default values due to incomplete user profiles. "
            f"Users should complete their fitness profiles for personalized calculations.",
        )

    if created_count == 0 and skipped_count == 0:
        messages.warning(request, "No nutrition profiles were created.")


# Register models with admin
@admin.register(NutritionProfile)
class NutritionProfileAdmin(admin.ModelAdmin):
    list_display = [
        "account_email",
        "daily_calories_goal",
        "daily_protein_goal",
        "daily_carbs_goal",
        "daily_fat_goal",
        "is_auto_calculated",
        "created_at",
    ]
    list_filter = ["is_auto_calculated", "created_at"]
    search_fields = ["account__email", "account__first_name", "account__last_name"]
    readonly_fields = ["bmr", "tdee", "created_at", "updated_at"]

    fieldsets = (
        ("Account Information", {"fields": ("account",)}),
        (
            "Daily Goals",
            {
                "fields": (
                    "daily_calories_goal",
                    "daily_protein_goal",
                    "daily_carbs_goal",
                    "daily_fat_goal",
                )
            },
        ),
        (
            "Calculation Data",
            {"fields": ("bmr", "tdee", "is_auto_calculated"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def account_email(self, obj):
        return obj.account.email

    account_email.short_description = "Account Email"
    account_email.admin_order_field = "account__email"

    actions = ["recalculate_macros_action"]

    @admin.action(description="Recalculate macros for selected profiles")
    def recalculate_macros_action(self, request, queryset):
        """Recalculate macros for selected nutrition profiles"""
        updated_count = 0

        for profile in queryset:
            try:
                profile.update_macros()
                updated_count += 1
            except Exception as e:
                messages.error(
                    request,
                    f"Error updating macros for {profile.account.email}: {str(e)}",
                )

        if updated_count > 0:
            messages.success(
                request,
                f"Successfully recalculated macros for {updated_count} profile(s).",
            )

    def save_model(self, request, obj, form, change):
        """
        Override save_model to ensure proper macro calculation when saving from admin
        """
        # The model's save method will handle macro calculation
        super().save_model(request, obj, form, change)


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = [
        "food_name",
        "brand_name",
        "food_type",
        "calories",
        "protein",
        "fatsecret_servings_count",
        "created_at",
    ]
    list_filter = ["food_type", "brand_name", "created_at"]
    search_fields = ["food_name", "brand_name", "food_id"]
    readonly_fields = ["food_id", "created_at", "updated_at"]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("food_id", "food_name", "food_type", "brand_name")},
        ),
        ("Nutrition (per 100g)", {"fields": ("calories", "protein", "carbs", "fat")}),
        ("Description", {"fields": ("food_description",)}),
        (
            "FatSecret Servings",
            {"fields": ("fatsecret_servings",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def fatsecret_servings_count(self, obj):
        """Display count of available FatSecret servings"""
        return len(obj.fatsecret_servings) if obj.fatsecret_servings else 0

    fatsecret_servings_count.short_description = "Available Servings"

    def get_readonly_fields(self, request, obj=None):
        """Make food_id read-only only when editing existing food"""
        if obj:  # Editing existing food
            return self.readonly_fields
        else:  # Creating new food
            return ["created_at", "updated_at"]


@admin.register(DailyEntry)
class DailyEntryAdmin(admin.ModelAdmin):
    list_display = [
        "nutrition_profile_email",
        "date",
        "total_calories",
        "total_protein",
        "total_carbs",
        "total_fat",
        "meals_count",
    ]
    list_filter = ["date", "created_at"]
    search_fields = ["nutrition_profile__account__email"]
    readonly_fields = [
        "total_calories",
        "total_protein",
        "total_carbs",
        "total_fat",
        "created_at",
        "updated_at",
    ]
    date_hierarchy = "date"

    fieldsets = (
        ("Entry Information", {"fields": ("nutrition_profile", "date")}),
        (
            "Daily Totals (Auto-calculated)",
            {
                "fields": (
                    "total_calories",
                    "total_protein",
                    "total_carbs",
                    "total_fat",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def nutrition_profile_email(self, obj):
        return obj.nutrition_profile.account.email

    nutrition_profile_email.short_description = "Account Email"
    nutrition_profile_email.admin_order_field = "nutrition_profile__account__email"

    def meals_count(self, obj):
        return obj.meals.count()

    meals_count.short_description = "Meals Count"

    actions = ["recalculate_totals_action"]

    @admin.action(description="Recalculate daily totals for selected entries")
    def recalculate_totals_action(self, request, queryset):
        """Recalculate daily totals for selected daily entries"""
        updated_count = 0

        for entry in queryset:
            try:
                entry.calculate_totals()
                updated_count += 1
            except Exception as e:
                messages.error(
                    request,
                    f"Error recalculating totals for {entry}: {str(e)}",
                )

        if updated_count > 0:
            messages.success(
                request,
                f"Successfully recalculated totals for {updated_count} daily entry(ies).",
            )


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = [
        "daily_entry_email",
        "daily_entry_date",
        "meal_type",
        "meal_name",
        "food_entries_count",
        "meal_calories",
        "created_at",
    ]
    list_filter = ["meal_type", "created_at", "daily_entry__date"]
    search_fields = [
        "daily_entry__nutrition_profile__account__email",
        "meal_name",
        "daily_entry__date",
    ]

    fieldsets = (
        ("Meal Information", {"fields": ("daily_entry", "meal_type", "meal_name")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ["created_at", "updated_at"]

    def daily_entry_email(self, obj):
        return obj.daily_entry.nutrition_profile.account.email

    daily_entry_email.short_description = "Account Email"
    daily_entry_email.admin_order_field = (
        "daily_entry__nutrition_profile__account__email"
    )

    def daily_entry_date(self, obj):
        return obj.daily_entry.date

    daily_entry_date.short_description = "Date"
    daily_entry_date.admin_order_field = "daily_entry__date"

    def food_entries_count(self, obj):
        return obj.food_entries.count()

    food_entries_count.short_description = "Food Items"

    def meal_calories(self, obj):
        """Display total calories for this meal"""
        nutrition = obj.get_nutrition_totals()
        return round(nutrition.get("calories", 0), 1)

    meal_calories.short_description = "Calories"


@admin.register(MealFoodEntry)
class MealFoodEntryAdmin(admin.ModelAdmin):
    list_display = [
        "meal_info",
        "food_name",
        "serving_type",
        "serving_info",
        "quantity",
        "calories",
        "protein",
        "created_at",
    ]
    list_filter = ["serving_type", "created_at", "meal__meal_type"]
    search_fields = [
        "meal__daily_entry__nutrition_profile__account__email",
        "food__food_name",
        "meal__daily_entry__date",
    ]
    readonly_fields = [
        "calories",
        "protein",
        "carbs",
        "fat",
        "created_at",
    ]

    fieldsets = (
        ("Entry Information", {"fields": ("meal", "food", "quantity")}),
        (
            "Serving Information",
            {
                "fields": (
                    "serving_type",
                    "fatsecret_serving_id",
                    "custom_serving_unit",
                    "custom_serving_amount",
                )
            },
        ),
        (
            "Calculated Nutrition (Auto-calculated)",
            {
                "fields": ("calories", "protein", "carbs", "fat"),
                "classes": ("collapse",),
            },
        ),
        ("Timestamps", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    def meal_info(self, obj):
        """Display meal information"""
        return f"{obj.meal.get_meal_type_display()} ({obj.meal.daily_entry.date})"

    meal_info.short_description = "Meal"
    meal_info.admin_order_field = "meal__daily_entry__date"

    def food_name(self, obj):
        """Display food name with brand if available"""
        if obj.food.brand_name:
            return f"{obj.food.food_name} ({obj.food.brand_name})"
        return obj.food.food_name

    food_name.short_description = "Food"
    food_name.admin_order_field = "food__food_name"

    def serving_info(self, obj):
        """Display serving information based on type"""
        if obj.serving_type == "fatsecret":
            # Try to get serving description from food's fatsecret_servings
            for serving in obj.food.fatsecret_servings:
                if serving.get("serving_id") == obj.fatsecret_serving_id:
                    return serving.get(
                        "serving_description", f"Serving ID: {obj.fatsecret_serving_id}"
                    )
            return f"FatSecret Serving: {obj.fatsecret_serving_id}"
        else:
            return f"{obj.custom_serving_amount} {obj.custom_serving_unit}"

    serving_info.short_description = "Serving"

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return (
            super()
            .get_queryset(request)
            .select_related("meal__daily_entry__nutrition_profile__account", "food")
        )

    actions = ["recalculate_nutrition_action"]

    @admin.action(description="Recalculate nutrition for selected food entries")
    def recalculate_nutrition_action(self, request, queryset):
        """Recalculate nutrition values for selected meal food entries"""
        updated_count = 0

        for entry in queryset:
            try:
                entry.calculate_nutrition()
                entry.save()
                updated_count += 1
            except Exception as e:
                messages.error(
                    request,
                    f"Error recalculating nutrition for {entry}: {str(e)}",
                )

        if updated_count > 0:
            messages.success(
                request,
                f"Successfully recalculated nutrition for {updated_count} food entry(ies).",
            )


# Inline admin classes for better UX
class MealFoodEntryInline(admin.TabularInline):
    """Inline for food entries within meals"""

    model = MealFoodEntry
    extra = 0
    readonly_fields = ["calories", "protein", "carbs", "fat"]
    fields = [
        "food",
        "serving_type",
        "fatsecret_serving_id",
        "custom_serving_unit",
        "custom_serving_amount",
        "quantity",
        "calories",
        "protein",
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("food")


class MealInline(admin.TabularInline):
    """Inline for meals within daily entries"""

    model = Meal
    extra = 0
    fields = ["meal_type", "meal_name"]
    show_change_link = True


# Update existing admin classes to include inlines
# Re-register DailyEntry with inline
admin.site.unregister(DailyEntry)


@admin.register(DailyEntry)
class DailyEntryAdmin(DailyEntryAdmin):
    """Updated DailyEntry admin with meal inlines"""

    inlines = [MealInline]


# Re-register Meal with inline
admin.site.unregister(Meal)


@admin.register(Meal)
class MealAdmin(MealAdmin):
    """Updated Meal admin with food entry inlines"""

    inlines = [MealFoodEntryInline]
