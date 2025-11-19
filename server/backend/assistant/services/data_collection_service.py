from datetime import datetime, timedelta
from django.utils import timezone  # Already imported, use it properly
from nutrition.models import DailyEntry
from workouts.models import TemplateHistory


class DataCollectionService:
    """
    Service to collect user data for progress report generation.
    Fetches nutrition and workout data for a specific time period.
    """

    def __init__(self, user, period_start, period_end):
        """
        Initialize the data collection service.

        Args:
            user: The user instance
            period_start: Start datetime of the reporting period (should be timezone-aware)
            period_end: End datetime of the reporting period (should be timezone-aware)
        """
        self.user = user
        self.period_start = self._make_aware(period_start)
        self.period_end = self._make_aware(period_end)

    def _make_aware(self, dt):
        """
        Convert naive datetime to timezone-aware datetime.

        Args:
            dt: datetime object

        Returns:
            timezone-aware datetime
        """
        if dt and timezone.is_naive(dt):
            return timezone.make_aware(dt)
        return dt

    def collect_all_data(self):
        """
        Collect all data needed for progress report generation and chat context.

        Returns:
            dict: Dictionary containing nutrition and workout data
        """
        return {
            "nutrition_data": self.get_nutrition_data(),
            "workout_data": self.get_workout_data(),
            "user_profile": self.get_user_profile_data(),
        }

    def get_nutrition_data(self):
        """
        Fetch nutrition data (daily entries) for the reporting period.

        Returns:
            dict: Nutrition statistics and daily entries
        """
        try:
            # Get user's nutrition profile
            nutrition_profile = getattr(self.user, "nutrition_profile", None)
            if not nutrition_profile:
                return {
                    "has_data": False,
                    "message": "User does not have a nutrition profile",
                }

            # Fetch daily entries within the period
            daily_entries = DailyEntry.objects.filter(
                nutrition_profile=nutrition_profile,
                date__gte=self.period_start.date(),
                date__lte=self.period_end.date(),
            ).order_by("date")

            if not daily_entries.exists():
                return {
                    "has_data": False,
                    "message": "No nutrition data found for this period",
                }

            # Calculate nutrition statistics
            total_entries = daily_entries.count()
            total_calories = sum(entry.total_calories for entry in daily_entries)
            total_protein = sum(entry.total_protein for entry in daily_entries)
            total_carbs = sum(entry.total_carbs for entry in daily_entries)
            total_fat = sum(entry.total_fat for entry in daily_entries)

            # Calculate averages
            avg_calories = round(total_calories / total_entries, 2)
            avg_protein = round(total_protein / total_entries, 2)
            avg_carbs = round(total_carbs / total_entries, 2)
            avg_fat = round(total_fat / total_entries, 2)

            # Get nutrition goals
            goals = {
                "daily_calories_goal": nutrition_profile.daily_calories_goal,
                "daily_protein_goal": nutrition_profile.daily_protein_goal,
                "daily_carbs_goal": nutrition_profile.daily_carbs_goal,
                "daily_fat_goal": nutrition_profile.daily_fat_goal,
            }

            # Calculate goal adherence
            calories_adherence = self._calculate_adherence(
                avg_calories, goals["daily_calories_goal"]
            )
            protein_adherence = self._calculate_adherence(
                avg_protein, goals["daily_protein_goal"]
            )
            carbs_adherence = self._calculate_adherence(
                avg_carbs, goals["daily_carbs_goal"]
            )
            fat_adherence = self._calculate_adherence(avg_fat, goals["daily_fat_goal"])

            # Prepare daily entries summary
            entries_summary = []
            for entry in daily_entries:
                entries_summary.append(
                    {
                        "date": entry.date.strftime("%Y-%m-%d"),
                        "calories": entry.total_calories,
                        "protein": entry.total_protein,
                        "carbs": entry.total_carbs,
                        "fat": entry.total_fat,
                        "food_entries_count": entry.food_entries.count(),
                    }
                )

            return {
                "has_data": True,
                "period_days": total_entries,
                "goals": goals,
                "averages": {
                    "calories": avg_calories,
                    "protein": avg_protein,
                    "carbs": avg_carbs,
                    "fat": avg_fat,
                },
                "totals": {
                    "calories": round(total_calories, 2),
                    "protein": round(total_protein, 2),
                    "carbs": round(total_carbs, 2),
                    "fat": round(total_fat, 2),
                },
                "adherence": {
                    "calories": calories_adherence,
                    "protein": protein_adherence,
                    "carbs": carbs_adherence,
                    "fat": fat_adherence,
                    "overall": round(
                        (
                            calories_adherence
                            + protein_adherence
                            + carbs_adherence
                            + fat_adherence
                        )
                        / 4,
                        1,
                    ),
                },
                "daily_entries": entries_summary,
            }

        except Exception as e:
            print(f"Error collecting nutrition data: {e}")
            return {
                "has_data": False,
                "error": str(e),
                "message": "Failed to collect nutrition data",
            }

    def get_workout_data(self):
        """
        Fetch workout history data for the reporting period.

        Returns:
            dict: Workout statistics and history
        """
        try:
            # Fetch workout history within the period
            workout_history = (
                TemplateHistory.objects.filter(
                    user_id=self.user,
                    completed_at__gte=self.period_start,
                    completed_at__lte=self.period_end,
                )
                .prefetch_related("performed_exercises__exercise")
                .order_by("completed_at")
            )

            if not workout_history.exists():
                return {
                    "has_data": False,
                    "message": "No workout data found for this period",
                }

            # Calculate workout statistics
            total_workouts = workout_history.count()
            total_exercises = sum(
                workout.total_exercises for workout in workout_history
            )
            total_sets = sum(workout.total_sets for workout in workout_history)

            # Calculate total workout time in minutes
            total_minutes = sum(workout.duration_minutes for workout in workout_history)
            avg_duration_minutes = (
                round(total_minutes / total_workouts, 1) if total_workouts > 0 else 0
            )

            # Get workout frequency (workouts per week)
            period_duration = (self.period_end - self.period_start).days
            weeks = max(period_duration / 7, 1)
            workouts_per_week = round(total_workouts / weeks, 1)

            # Prepare workout history summary
            workouts_summary = []
            for workout in workout_history:
                # Get exercises breakdown
                exercises_performed = []
                for performed_exercise in workout.performed_exercises.all():
                    exercises_performed.append(
                        {
                            "name": performed_exercise.exercise_name,
                            "sets": performed_exercise.total_sets_performed,
                            "volume": performed_exercise.total_volume,
                        }
                    )

                workouts_summary.append(
                    {
                        "date": workout.completed_at.strftime("%Y-%m-%d"),
                        "title": workout.template_title,
                        "duration_minutes": workout.duration_minutes,
                        "total_exercises": workout.total_exercises,
                        "total_sets": workout.total_sets,
                        "exercises": exercises_performed,
                    }
                )

            # Calculate volume trends by exercise
            volume_by_exercise = {}
            for workout in workout_history:
                for performed_exercise in workout.performed_exercises.all():
                    exercise_name = performed_exercise.exercise_name
                    if exercise_name not in volume_by_exercise:
                        volume_by_exercise[exercise_name] = {
                            "total_volume": 0,
                            "total_sets": 0,
                            "occurrences": 0,
                        }

                    volume_by_exercise[exercise_name][
                        "total_volume"
                    ] += performed_exercise.total_volume
                    volume_by_exercise[exercise_name][
                        "total_sets"
                    ] += performed_exercise.total_sets_performed
                    volume_by_exercise[exercise_name]["occurrences"] += 1

            return {
                "has_data": True,
                "total_workouts": total_workouts,
                "total_exercises_performed": total_exercises,
                "total_sets_performed": total_sets,
                "total_workout_minutes": total_minutes,
                "average_workout_duration": avg_duration_minutes,
                "workouts_per_week": workouts_per_week,
                "workout_history": workouts_summary,
                "volume_by_exercise": volume_by_exercise,
            }

        except Exception as e:
            print(f"Error collecting workout data: {e}")
            import traceback

            traceback.print_exc()
            return {
                "has_data": False,
                "error": str(e),
                "message": "Failed to collect workout data",
            }

    def get_user_profile_data(self):
        """
        Get user profile and nutrition profile data.

        Returns:
            dict: User profile information
        """
        try:
            user_profile = getattr(self.user, "profile", None)
            nutrition_profile = getattr(self.user, "nutrition_profile", None)

            profile_data = {}

            # User profile data
            if user_profile:
                profile_data["user_profile"] = {
                    "age": getattr(user_profile, "age", None),
                    "body_goal": getattr(user_profile, "body_goal", None),
                    "activity_level": getattr(user_profile, "activity_level", None),
                    "current_weight": getattr(user_profile, "current_weight", None),
                    "goal_weight": getattr(user_profile, "goal_weight", None),
                    "starting_weight": getattr(user_profile, "starting_weight", None),
                    "workout_frequency": getattr(
                        user_profile, "workout_frequency", None
                    ),
                }

            # Nutrition profile data
            if nutrition_profile:
                profile_data["nutrition_profile"] = {
                    "bmi": getattr(nutrition_profile, "bmi", None),
                    "bmi_category": (
                        nutrition_profile.get_bmi_category()
                        if hasattr(nutrition_profile, "get_bmi_category")
                        else None
                    ),
                    "bmr": getattr(nutrition_profile, "bmr", None),
                    "tdee": getattr(nutrition_profile, "tdee", None),
                }

            return profile_data

        except Exception as e:
            print(f"Error collecting user profile data: {e}")
            return {"error": str(e)}

    def _calculate_adherence(self, actual, goal):
        """
        Calculate adherence percentage (how close actual is to goal).

        Args:
            actual: Actual value achieved
            goal: Target goal value

        Returns:
            float: Adherence percentage (capped at 100%)
        """
        if goal <= 0:
            return 0.0

        adherence = (actual / goal) * 100
        return round(min(adherence, 100.0), 1)

    def get_summary_text(self):
        """
        Generate a text summary of collected data for use in AI prompts.

        Returns:
            str: Formatted text summary
        """
        data = self.collect_all_data()

        summary_parts = []

        # Period info
        period_duration = (self.period_end - self.period_start).days
        summary_parts.append(
            f"Reporting Period: {self.period_start.strftime('%Y-%m-%d')} to {self.period_end.strftime('%Y-%m-%d')} ({period_duration} days)"
        )

        # Nutrition summary
        nutrition = data["nutrition_data"]
        if nutrition["has_data"]:
            summary_parts.append("\nNutrition Summary:")
            summary_parts.append(
                f"- Tracked {nutrition['period_days']} days out of {period_duration} days"
            )
            summary_parts.append(
                f"- Average daily calories: {nutrition['averages']['calories']} kcal (Goal: {nutrition['goals']['daily_calories_goal']} kcal)"
            )
            summary_parts.append(
                f"- Average daily protein: {nutrition['averages']['protein']}g (Goal: {nutrition['goals']['daily_protein_goal']}g)"
            )
            summary_parts.append(
                f"- Overall nutrition adherence: {nutrition['adherence']['overall']}%"
            )
        else:
            summary_parts.append(f"\nNutrition Summary: {nutrition['message']}")

        # Workout summary
        workout = data["workout_data"]
        if workout["has_data"]:
            summary_parts.append("\nWorkout Summary:")
            summary_parts.append(
                f"- Total workouts completed: {workout['total_workouts']}"
            )
            summary_parts.append(
                f"- Average workout frequency: {workout['workouts_per_week']} workouts per week"
            )
            summary_parts.append(
                f"- Total exercises performed: {workout['total_exercises_performed']}"
            )
            summary_parts.append(
                f"- Total sets completed: {workout['total_sets_performed']}"
            )
            summary_parts.append(
                f"- Total workout time: {workout['total_workout_minutes']} minutes"
            )
            summary_parts.append(
                f"- Average workout duration: {workout['average_workout_duration']} minutes"
            )
        else:
            summary_parts.append(f"\nWorkout Summary: {workout['message']}")

        return "\n".join(summary_parts)
