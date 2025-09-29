from django.contrib import admin
from django.contrib.admin import actions
from django.contrib import messages
from accounts.models import Account
from .models import NutritionProfile, Food, DailyEntry, FoodEntry


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
        "food_entries_count",
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

    def food_entries_count(self, obj):
        """Count of food entries for this daily entry"""
        return obj.food_entries.count()

    food_entries_count.short_description = "Food Entries"

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


@admin.register(FoodEntry)
class FoodEntryAdmin(admin.ModelAdmin):
    """Admin for individual food entries - replaces both Meal and MealFoodEntry admins"""

    list_display = [
        "daily_entry_info",
        "meal_type_display",
        "food_name_with_brand",
        "serving_info",
        "quantity",
        "calories",
        "protein",
        "created_at",
    ]
    list_filter = [
        "meal_type",
        "serving_type",
        "created_at",
        "daily_entry__date",
    ]
    search_fields = [
        "daily_entry__nutrition_profile__account__email",
        "food__food_name",
        "food__brand_name",
        "daily_entry__date",
    ]
    readonly_fields = [
        "calories",
        "protein",
        "carbs",
        "fat",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        (
            "Entry Information",
            {"fields": ("daily_entry", "food", "meal_type", "quantity")},
        ),
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
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def daily_entry_info(self, obj):
        """Display daily entry information"""
        email = obj.daily_entry.nutrition_profile.account.email
        date = obj.daily_entry.date
        return f"{email} - {date}"

    daily_entry_info.short_description = "Daily Entry"
    daily_entry_info.admin_order_field = "daily_entry__date"

    def meal_type_display(self, obj):
        """Display meal type with proper formatting"""
        return obj.get_meal_type_display()

    meal_type_display.short_description = "Meal Type"
    meal_type_display.admin_order_field = "meal_type"

    def food_name_with_brand(self, obj):
        """Display food name with brand if available"""
        if obj.food.brand_name:
            return f"{obj.food.food_name} ({obj.food.brand_name})"
        return obj.food.food_name

    food_name_with_brand.short_description = "Food"
    food_name_with_brand.admin_order_field = "food__food_name"

    def serving_info(self, obj):
        """Display serving information based on type"""
        if obj.serving_type == "fatsecret":
            # Try to get serving description from food's fatsecret_servings
            serving = obj.food.get_serving_by_id(obj.fatsecret_serving_id)
            if serving:
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
            .select_related("daily_entry__nutrition_profile__account", "food")
        )

    actions = ["recalculate_nutrition_action"]

    @admin.action(description="Recalculate nutrition for selected food entries")
    def recalculate_nutrition_action(self, request, queryset):
        """Recalculate nutrition values for selected food entries"""
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
class FoodEntryInline(admin.TabularInline):
    """Inline for food entries within daily entries"""

    model = FoodEntry
    extra = 0
    readonly_fields = ["calories", "protein", "carbs", "fat"]
    fields = [
        "food",
        "meal_type",
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


# Re-register DailyEntry with inline
admin.site.unregister(DailyEntry)


@admin.register(DailyEntry)
class DailyEntryAdmin(DailyEntryAdmin):
    """Updated DailyEntry admin with food entry inlines"""

    inlines = [FoodEntryInline]

    def get_queryset(self, request):
        """Optimize queryset for better performance"""
        return (
            super()
            .get_queryset(request)
            .select_related("nutrition_profile__account")
            .prefetch_related("food_entries__food")
        )


# Custom admin actions for bulk operations
@admin.action(description="Recalculate all daily totals for selected entries")
def bulk_recalculate_daily_totals(modeladmin, request, queryset):
    """Bulk action to recalculate daily totals"""
    updated_count = 0
    error_count = 0

    for daily_entry in queryset:
        try:
            daily_entry.calculate_totals()
            updated_count += 1
        except Exception as e:
            error_count += 1
            messages.error(request, f"Error updating {daily_entry}: {str(e)}")

    if updated_count > 0:
        messages.success(
            request,
            f"Successfully recalculated totals for {updated_count} daily entry(ies).",
        )

    if error_count > 0:
        messages.warning(request, f"Failed to update {error_count} daily entry(ies).")


# Add custom admin actions to relevant models
DailyEntryAdmin.actions.append(bulk_recalculate_daily_totals)


# Optional: Admin for viewing meal breakdown (read-only)
class MealBreakdownAdmin(admin.ModelAdmin):
    """Read-only admin view for analyzing meal patterns"""

    list_display = [
        "daily_entry",
        "meal_type",
        "entries_count",
        "total_calories",
        "total_protein",
    ]
    list_filter = ["meal_type", "daily_entry__date"]
    search_fields = ["daily_entry__nutrition_profile__account__email"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        """Generate virtual meal breakdown objects"""
        # This would need custom implementation to show meal breakdowns
        # For now, return empty queryset
        return FoodEntry.objects.none()


# Register the action with Account admin if it exists
try:
    from accounts.admin import AccountAdmin

    # Add the nutrition profile creation action to Account admin
    if hasattr(AccountAdmin, "actions"):
        AccountAdmin.actions.append(create_nutrition_profiles_for_accounts)
    else:
        AccountAdmin.actions = [create_nutrition_profiles_for_accounts]

except ImportError:
    # accounts.admin doesn't exist or AccountAdmin not available
    pass
