from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Avg
from .models import Account, Profile, WeightHistory


class ProfileInline(admin.StackedInline):
    """Inline admin for Profile model."""

    model = Profile
    can_delete = False
    verbose_name_plural = "Profile Information"
    readonly_fields = [
        "weight_progress",
        "weight_to_goal",
        "bmi",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        (
            "Weight Information",
            {
                "fields": (
                    ("starting_weight", "current_weight", "goal_weight"),
                    "start_weight_date",
                    ("weight_progress", "weight_to_goal", "bmi"),
                )
            },
        ),
        (
            "Fitness Goals & Preferences",
            {
                "fields": (
                    ("activity_level", "body_goal"),
                    ("workout_frequency", "workout_location"),
                )
            },
        ),
        (
            "Health Information",
            {"fields": ("injuries", "food_allergies"), "classes": ("collapse",)},
        ),
        (
            "Status & Timestamps",
            {
                "fields": ("is_active", ("created_at", "updated_at")),
                "classes": ("collapse",),
            },
        ),
    )


class WeightHistoryInline(admin.TabularInline):
    """Inline admin for WeightHistory model."""

    model = WeightHistory
    extra = 0
    max_num = 10  # Show only last 10 entries in inline
    readonly_fields = ["created_at"]
    ordering = ["-recorded_date", "-created_at"]

    fields = ["weight", "recorded_date", "created_at"]


@admin.register(Account)
class AccountAdmin(UserAdmin):
    """Admin configuration for Account model."""

    inlines = [ProfileInline, WeightHistoryInline]

    list_display = [
        "email",
        "first_name",
        "last_name",
        "gender",
        "height_display",
        "current_weight_display",
        "is_active",
        "date_joined",
    ]

    list_filter = [
        "gender",
        "is_active",
        "is_staff",
        "date_joined",
        "profile__activity_level",
        "profile__body_goal",
    ]

    search_fields = ["email", "first_name", "last_name"]

    ordering = ["-date_joined"]

    readonly_fields = ["date_joined", "last_login", "height_display"]

    # Customize fieldsets for Account
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    ("first_name", "last_name"),
                    ("gender"),
                    ("height_ft", "height_in"),
                    ("height_display"),
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Important dates",
            {"fields": ("last_login", "date_joined"), "classes": ("collapse",)},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "gender",
                    "height_ft",
                    "height_in",
                ),
            },
        ),
    )

    def height_display(self, obj):
        """Display height in both ft/in and cm."""
        if obj.height_ft and obj.height_in is not None:
            return f"{obj.height_ft}'{obj.height_in}\" ({obj.height_in_cm} cm)"
        return "Not set"

    height_display.short_description = "Height"

    def current_weight_display(self, obj):
        """Display current weight from profile."""
        if (
            hasattr(obj, "profile")
            and obj.profile
            and obj.profile.current_weight is not None
        ):
            return f"{obj.profile.current_weight} kg"
        return "No weight data"

    current_weight_display.short_description = "Current Weight"

    def get_queryset(self, request):
        """Optimize queryset with prefetch_related."""
        return super().get_queryset(request).select_related("profile")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """Admin configuration for Profile model."""

    list_display = [
        "account_email",
        "current_weight",
        "goal_weight",
        "bmi_display",
        "activity_level",
        "body_goal",
        "workout_frequency",
        "is_active",
    ]

    list_filter = [
        "activity_level",
        "body_goal",
        "workout_frequency",
        "workout_location",
        "is_active",
        "created_at",
    ]

    search_fields = ["account__email", "account__first_name", "account__last_name"]

    readonly_fields = [
        "account",
        "weight_progress",
        "weight_to_goal",
        "bmi",
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        ("Account Information", {"fields": ("account",)}),
        (
            "Weight Information",
            {
                "fields": (
                    ("starting_weight", "current_weight", "goal_weight"),
                    "start_weight_date",
                    ("weight_progress", "weight_to_goal", "bmi"),
                )
            },
        ),
        (
            "Fitness Goals & Preferences",
            {
                "fields": (
                    ("activity_level", "body_goal"),
                    ("workout_frequency", "workout_location"),
                )
            },
        ),
        (
            "Health Information",
            {"fields": ("injuries", "food_allergies"), "classes": ("collapse",)},
        ),
        (
            "Status & Timestamps",
            {"fields": ("is_active", ("created_at", "updated_at"))},
        ),
    )

    def account_email(self, obj):
        """Display account email with link."""
        url = reverse("admin:accounts_account_change", args=[obj.account.id])
        return format_html('<a href="{}">{}</a>', url, obj.account.email)

    account_email.short_description = "Account"
    account_email.admin_order_field = "account__email"

    def bmi_display(self, obj):
        """Display BMI with color coding."""
        bmi = obj.bmi
        if bmi is None:
            return "Not calculated"

        if bmi < 18.5:
            color = "#007cba"  # Blue for underweight
        elif bmi < 25:
            color = "#28a745"  # Green for normal
        elif bmi < 30:
            color = "#ffc107"  # Yellow for overweight
        else:
            color = "#dc3545"  # Red for obese

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>', color, bmi
        )

    bmi_display.short_description = "BMI"

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related("account")


@admin.register(WeightHistory)
class WeightHistoryAdmin(admin.ModelAdmin):
    """Admin configuration for WeightHistory model."""

    list_display = [
        "account_email",
        "weight",
        "recorded_date",
        "weight_change",
        "created_at",
    ]

    list_filter = ["recorded_date", "created_at"]

    search_fields = [
        "account__email",
        "account__first_name",
        "account__last_name",
    ]

    readonly_fields = ["account", "weight_change", "created_at"]

    date_hierarchy = "recorded_date"

    ordering = ["-recorded_date", "-created_at"]

    def account_email(self, obj):
        """Display account email with link."""
        url = reverse("admin:accounts_account_change", args=[obj.account.id])
        return format_html('<a href="{}">{}</a>', url, obj.account.email)

    account_email.short_description = "Account"
    account_email.admin_order_field = "account__email"

    def weight_change(self, obj):
        """Calculate weight change from previous entry."""
        previous = (
            WeightHistory.objects.filter(
                account=obj.account, recorded_date__lt=obj.recorded_date
            )
            .order_by("-recorded_date")
            .first()
        )

        if previous:
            change = float(obj.weight - previous.weight)
            color = "#28a745" if change < 0 else "#dc3545" if change > 0 else "#6c757d"
            sign = "+" if change > 0 else ""
            formatted_change = f"{sign}{change:.1f}"
            return format_html(
                '<span style="color: {}; font-weight: bold;">{} kg</span>',
                color,
                formatted_change,
            )
        return "First entry"

    weight_change.short_description = "Change"

    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related("account")


# Admin site customization
admin.site.site_header = "Fitness Tracker Admin"
admin.site.site_title = "Fitness Tracker"
admin.site.index_title = "Welcome to Fitness Tracker Administration"
