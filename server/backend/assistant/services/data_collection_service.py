from datetime import datetime, timedelta
from django.utils import timezone
from nutrition.models import DailyEntry
from workouts.models import TemplateHistory


class DataCollectionService:
    """
    Service to collect user data for progress reports and chat context.
    Can fetch data for a specific period or all historical data.
    """

    def __init__(self, user, period_start=None, period_end=None):
        """
        Initialize the data collection service.

        Args:
            user: The user instance
            period_start: Start datetime of the reporting period (optional, for progress reports)
            period_end: End datetime of the reporting period (optional, for progress reports)

        If period_start and period_end are None, collects all historical data.
        """
        self.user = user
        self.period_start = self._make_aware(period_start) if period_start else None
        self.period_end = self._make_aware(period_end) if period_end else None
        self.is_full_history = period_start is None and period_end is None

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
        Collect all data needed for progress report generation or chat context.

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
        Fetch nutrition data (daily entries) for the specified period or all history.

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

            # Build query based on whether we're filtering by period
            query = DailyEntry.objects.filter(nutrition_profile=nutrition_profile)

            if not self.is_full_history:
                query = query.filter(
                    date__gte=self.period_start.date(),
                    date__lte=self.period_end.date(),
                )

            daily_entries = query.order_by("date")

            if not daily_entries.exists():
                return {
                    "has_data": False,
                    "message": "No nutrition data found",
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

            # Prepare daily entries summary (limit to last 30 for chat context)
            entries_to_show = (
                daily_entries[:30] if self.is_full_history else daily_entries
            )
            entries_summary = []
            for entry in entries_to_show:
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
                "is_full_history": self.is_full_history,
                "total_days_tracked": total_entries,
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
                "recent_entries": entries_summary,
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
        Fetch workout history data for the specified period or all history.

        Returns:
            dict: Workout statistics and history
        """
        try:
            # Build query based on whether we're filtering by period
            query = TemplateHistory.objects.filter(user_id=self.user)

            if not self.is_full_history:
                query = query.filter(
                    completed_at__gte=self.period_start,
                    completed_at__lte=self.period_end,
                )

            workout_history = query.prefetch_related(
                "performed_exercises__exercise"
            ).order_by("-completed_at")

            if not workout_history.exists():
                return {
                    "has_data": False,
                    "message": "No workout data found",
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

            # Calculate workout frequency
            if self.is_full_history:
                # For full history, calculate based on first and last workout
                first_workout = workout_history.last()
                last_workout = workout_history.first()
                period_duration = (
                    last_workout.completed_at - first_workout.completed_at
                ).days
                weeks = max(period_duration / 7, 1)
            else:
                period_duration = (self.period_end - self.period_start).days
                weeks = max(period_duration / 7, 1)

            workouts_per_week = round(total_workouts / weeks, 1)

            # Prepare workout history summary (limit to last 20 for chat context)
            workouts_to_show = (
                workout_history[:20] if self.is_full_history else workout_history
            )
            workouts_summary = []
            for workout in workouts_to_show:
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
                "is_full_history": self.is_full_history,
                "total_workouts": total_workouts,
                "total_exercises_performed": total_exercises,
                "total_sets_performed": total_sets,
                "total_workout_minutes": total_minutes,
                "average_workout_duration": avg_duration_minutes,
                "workouts_per_week": workouts_per_week,
                "recent_workouts": workouts_summary,
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
        Collects the 10 essential profile fields needed for AI context.

        Returns:
            dict: User profile information
        """
        try:
            user_profile = getattr(self.user, "profile", None)
            nutrition_profile = getattr(self.user, "nutrition_profile", None)

            profile_data = {
                "has_data": False,
                "user_profile": {},
                "nutrition_profile": {},
            }

            # Collect user profile data
            if user_profile:
                profile_data["user_profile"] = {
                    "age": getattr(user_profile, "age", None),
                    "gender": getattr(user_profile, "gender", None),
                    "activity_level": getattr(user_profile, "activity_level", None),
                    "starting_weight": getattr(user_profile, "starting_weight", None),
                    "current_weight": getattr(user_profile, "current_weight", None),
                    "goal_weight": getattr(user_profile, "goal_weight", None),
                    "injuries": getattr(user_profile, "injuries", None),
                    "food_allergies": getattr(user_profile, "food_allergies", None),
                    "workout_frequency": getattr(
                        user_profile, "workout_frequency", None
                    ),
                    "workout_location": getattr(user_profile, "workout_location", None),
                    "body_goal": getattr(user_profile, "body_goal", None),
                }
                profile_data["has_data"] = True

            # Collect nutrition profile data (supplementary info)
            if nutrition_profile:
                profile_data["nutrition_profile"] = {
                    "daily_calories_goal": getattr(
                        nutrition_profile, "daily_calories_goal", None
                    ),
                    "daily_protein_goal": getattr(
                        nutrition_profile, "daily_protein_goal", None
                    ),
                    "daily_carbs_goal": getattr(
                        nutrition_profile, "daily_carbs_goal", None
                    ),
                    "daily_fat_goal": getattr(
                        nutrition_profile, "daily_fat_goal", None
                    ),
                    "bmi": getattr(nutrition_profile, "bmi", None),
                    "bmi_category": (
                        nutrition_profile.get_bmi_category()
                        if hasattr(nutrition_profile, "get_bmi_category")
                        else None
                    ),
                    "bmr": getattr(nutrition_profile, "bmr", None),
                    "tdee": getattr(nutrition_profile, "tdee", None),
                }
                profile_data["has_data"] = True

            return profile_data

        except Exception as e:
            print(f"Error collecting user profile data: {e}")
            return {
                "has_data": False,
                "error": str(e),
                "user_profile": {},
                "nutrition_profile": {},
            }

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
        if self.is_full_history:
            summary_parts.append("=== Complete Historical Data Summary ===")
        else:
            period_duration = (self.period_end - self.period_start).days
            summary_parts.append(
                f"=== Reporting Period: {self.period_start.strftime('%Y-%m-%d')} to {self.period_end.strftime('%Y-%m-%d')} ({period_duration} days) ==="
            )

        # User Profile Summary
        profile_data = data["user_profile"]
        if profile_data["has_data"]:
            summary_parts.append("\n--- User Profile ---")
            up = profile_data["user_profile"]
            if up.get("gender"):
                summary_parts.append(f"Gender: {up['gender']}")
            if up.get("age"):
                summary_parts.append(f"Age: {up['age']} years")
            if up.get("body_goal"):
                summary_parts.append(f"Fitness Goal: {up['body_goal']}")
            if up.get("activity_level"):
                summary_parts.append(f"Activity Level: {up['activity_level']}")
            if up.get("starting_weight"):
                summary_parts.append(f"Starting Weight: {up['starting_weight']} kg")
            if up.get("current_weight"):
                summary_parts.append(f"Current Weight: {up['current_weight']} kg")
            if up.get("goal_weight"):
                summary_parts.append(f"Goal Weight: {up['goal_weight']} kg")
            if up.get("workout_frequency"):
                summary_parts.append(f"Workout Frequency: {up['workout_frequency']}")
            if up.get("workout_location"):
                summary_parts.append(f"Workout Location: {up['workout_location']}")
            if up.get("injuries"):
                summary_parts.append(f"Injuries/Medical Conditions: {up['injuries']}")
            if up.get("food_allergies"):
                summary_parts.append(
                    f"Food Allergies/Restrictions: {up['food_allergies']}"
                )

            # Add nutrition profile goals
            np = profile_data["nutrition_profile"]
            if np:
                summary_parts.append("\n--- Nutrition Goals ---")
                if np.get("daily_calories_goal"):
                    summary_parts.append(
                        f"Daily Calorie Goal: {np['daily_calories_goal']} kcal"
                    )
                if np.get("daily_protein_goal"):
                    summary_parts.append(
                        f"Daily Protein Goal: {np['daily_protein_goal']}g"
                    )
                if np.get("daily_carbs_goal"):
                    summary_parts.append(f"Daily Carbs Goal: {np['daily_carbs_goal']}g")
                if np.get("daily_fat_goal"):
                    summary_parts.append(f"Daily Fat Goal: {np['daily_fat_goal']}g")
                if np.get("bmi"):
                    summary_parts.append(
                        f"BMI: {np['bmi']} ({np.get('bmi_category', 'N/A')})"
                    )
                if np.get("bmr"):
                    summary_parts.append(f"BMR: {np['bmr']} kcal")
                if np.get("tdee"):
                    summary_parts.append(f"TDEE: {np['tdee']} kcal")

        # Nutrition summary
        nutrition = data["nutrition_data"]
        if nutrition["has_data"]:
            summary_parts.append("\n--- Nutrition Summary ---")
            summary_parts.append(
                f"Total days tracked: {nutrition['total_days_tracked']}"
            )
            summary_parts.append(
                f"Average daily calories: {nutrition['averages']['calories']} kcal (Goal: {nutrition['goals']['daily_calories_goal']} kcal)"
            )
            summary_parts.append(
                f"Average daily protein: {nutrition['averages']['protein']}g (Goal: {nutrition['goals']['daily_protein_goal']}g)"
            )
            summary_parts.append(
                f"Average daily carbs: {nutrition['averages']['carbs']}g (Goal: {nutrition['goals']['daily_carbs_goal']}g)"
            )
            summary_parts.append(
                f"Average daily fat: {nutrition['averages']['fat']}g (Goal: {nutrition['goals']['daily_fat_goal']}g)"
            )
            summary_parts.append(
                f"Overall nutrition adherence: {nutrition['adherence']['overall']}%"
            )
        else:
            summary_parts.append(f"\n--- Nutrition Summary ---")
            summary_parts.append(nutrition["message"])

        # Workout summary
        workout = data["workout_data"]
        if workout["has_data"]:
            summary_parts.append("\n--- Workout Summary ---")
            summary_parts.append(
                f"Total workouts completed: {workout['total_workouts']}"
            )
            summary_parts.append(
                f"Average workout frequency: {workout['workouts_per_week']} workouts per week"
            )
            summary_parts.append(
                f"Total exercises performed: {workout['total_exercises_performed']}"
            )
            summary_parts.append(
                f"Total sets completed: {workout['total_sets_performed']}"
            )
            summary_parts.append(
                f"Total workout time: {workout['total_workout_minutes']} minutes"
            )
            summary_parts.append(
                f"Average workout duration: {workout['average_workout_duration']} minutes"
            )
        else:
            summary_parts.append(f"\n--- Workout Summary ---")
            summary_parts.append(workout["message"])

        return "\n".join(summary_parts)
