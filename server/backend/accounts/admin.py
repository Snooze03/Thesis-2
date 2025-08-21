from django.contrib.auth.admin import UserAdmin
from .models import Account
from django.contrib import admin


# Register your models here.
class AccountAdmin(UserAdmin):
    model = Account
    list_display = ("email", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "body_goal", "workout_location")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "gender",
                    "activity_level",
                    "current_weight",
                    "goal_weight",
                    "height_ft",
                    "height_in",
                    "body_goal",
                )
            },
        ),
        (
            "Workout Info",
            {
                "fields": (
                    "workout_frequency",
                    "workout_location",
                    "injuries",
                    "food_allergies",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )
    search_fields = ("email",)
    ordering = ("email",)


admin.site.register(Account, AccountAdmin)
