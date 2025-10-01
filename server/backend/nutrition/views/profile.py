from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date, timedelta
from ..models import NutritionProfile
from ..serializers import NutritionProfileSerializer


class NutritionProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user nutrition profiles.

    Provides CRUD operations for nutrition profiles and custom actions
    for recalculating macros and retrieving profile statistics.
    """

    serializer_class = NutritionProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return nutrition profile for the authenticated user only"""
        return NutritionProfile.objects.filter(account=self.request.user)

    @action(detail=True, methods=["post"])
    def recalculate_macros(self, request, pk=None):
        """
        Recalculate macro goals based on current user profile data.

        This action triggers macro recalculation using the user's current
        weight, activity level, and body goals from their profile.
        """
        nutrition_profile = self.get_object()

        # Trigger macro recalculation
        nutrition_profile.update_macros()

        serializer = self.get_serializer(nutrition_profile)
        return Response(
            {"message": "Macros recalculated successfully", "data": serializer.data}
        )

    @action(detail=True, methods=["get"])
    def weekly_summary(self, request, pk=None):
        """
        Get weekly nutrition summary for the user.

        Returns average daily intake vs goals for the past 7 days.
        """
        nutrition_profile = self.get_object()
        end_date = date.today()
        start_date = end_date - timedelta(days=6)

        # Get daily entries for the past week
        daily_entries = nutrition_profile.daily_entries.filter(
            date__range=[start_date, end_date]
        )

        if not daily_entries.exists():
            return Response(
                {
                    "message": "No nutrition data available for the past week",
                    "data": None,
                }
            )

        # Calculate averages
        total_days = daily_entries.count()
        avg_calories = sum(entry.total_calories for entry in daily_entries) / total_days
        avg_protein = sum(entry.total_protein for entry in daily_entries) / total_days
        avg_carbs = sum(entry.total_carbs for entry in daily_entries) / total_days
        avg_fat = sum(entry.total_fat for entry in daily_entries) / total_days

        summary_data = {
            "period": f"{start_date} to {end_date}",
            "days_tracked": total_days,
            "averages": {
                "calories": round(avg_calories, 1),
                "protein": round(avg_protein, 1),
                "carbs": round(avg_carbs, 1),
                "fat": round(avg_fat, 1),
            },
            "goals": {
                "calories": nutrition_profile.daily_calories_goal,
                "protein": nutrition_profile.daily_protein_goal,
                "carbs": nutrition_profile.daily_carbs_goal,
                "fat": nutrition_profile.daily_fat_goal,
            },
            "progress": {
                "calories": (
                    round(
                        (avg_calories / nutrition_profile.daily_calories_goal) * 100, 1
                    )
                    if nutrition_profile.daily_calories_goal > 0
                    else 0
                ),
                "protein": (
                    round((avg_protein / nutrition_profile.daily_protein_goal) * 100, 1)
                    if nutrition_profile.daily_protein_goal > 0
                    else 0
                ),
                "carbs": (
                    round((avg_carbs / nutrition_profile.daily_carbs_goal) * 100, 1)
                    if nutrition_profile.daily_carbs_goal > 0
                    else 0
                ),
                "fat": (
                    round((avg_fat / nutrition_profile.daily_fat_goal) * 100, 1)
                    if nutrition_profile.daily_fat_goal > 0
                    else 0
                ),
            },
        }

        return Response(summary_data)
