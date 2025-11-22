from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from services.data_collection_service import DataCollectionService
from datetime import timedelta
import json

User = get_user_model()


class Command(BaseCommand):
    help = "Test data collection service without generating a progress report"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            help="User ID to collect data for",
        )
        parser.add_argument(
            "--user-email",
            type=str,
            help="User email to collect data for",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days to include in collection (default: 7)",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Output data in JSON format",
        )
        parser.add_argument(
            "--summary-only",
            action="store_true",
            help="Show only summary text (used for AI prompts)",
        )

    def handle(self, *args, **options):
        # Get all options first
        user_id = options.get("user_id")
        user_email = options.get("user_email")
        days = options.get("days")  # Moved before it's used
        json_output = options.get("json")
        summary_only = options.get("summary_only")

        # Initialize period with timezone-aware datetimes
        period_end = timezone.now()
        period_start = period_end - timedelta(days=days)

        # Get user
        try:
            if user_id:
                user = User.objects.get(id=user_id)
            elif user_email:
                user = User.objects.get(email=user_email)
            else:
                # Get first user if no ID or email specified
                user = User.objects.first()
                if not user:
                    self.stdout.write(self.style.ERROR("No users found in database"))
                    return
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f"User not found with {'ID ' + str(user_id) if user_id else 'email ' + user_email}"
                )
            )
            return

        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS(f"Testing Data Collection Service"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))
        self.stdout.write(f"User: {user.email} (ID: {user.id})")

        self.stdout.write(
            f"Period: {period_start.strftime('%Y-%m-%d %H:%M')} to {period_end.strftime('%Y-%m-%d %H:%M')}"
        )
        self.stdout.write(f"Duration: {days} days\n")

        try:
            service = DataCollectionService(user, period_start, period_end)

            if summary_only:
                # Show only summary text
                self.stdout.write(self.style.SUCCESS("\n=== SUMMARY TEXT ===\n"))
                summary = service.get_summary_text()
                self.stdout.write(summary)
                return

            # Collect all data
            self.stdout.write("Collecting data...\n")
            collected_data = service.collect_all_data()

            if json_output:
                # Output as JSON
                self.stdout.write(json.dumps(collected_data, indent=2))
                return

            # Display formatted output
            self._display_user_profile(collected_data["user_profile"])
            self._display_nutrition_data(collected_data["nutrition_data"])
            self._display_workout_data(collected_data["workout_data"])

            # Show summary text at the end
            self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
            self.stdout.write(self.style.SUCCESS("SUMMARY TEXT (for AI prompts)"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}\n"))
            summary = service.get_summary_text()
            self.stdout.write(summary)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\nError: {str(e)}"))
            import traceback

            traceback.print_exc()

    def _display_user_profile(self, profile_data):
        """Display user profile data"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS("USER PROFILE"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}"))

        if "user_profile" in profile_data:
            self.stdout.write("\nPersonal Info:")
            up = profile_data["user_profile"]
            for key, value in up.items():
                if value is not None:
                    self.stdout.write(f"  {key}: {value}")

        if "nutrition_profile" in profile_data:
            self.stdout.write("\nNutrition Profile:")
            np = profile_data["nutrition_profile"]
            for key, value in np.items():
                if value is not None:
                    self.stdout.write(f"  {key}: {value}")

    def _display_nutrition_data(self, nutrition_data):
        """Display nutrition data"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS("NUTRITION DATA"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}"))

        if not nutrition_data["has_data"]:
            self.stdout.write(self.style.WARNING(f"\n{nutrition_data['message']}"))
            return

        self.stdout.write(f"\nDays Tracked: {nutrition_data['period_days']}")

        self.stdout.write("\n--- Goals ---")
        for key, value in nutrition_data["goals"].items():
            self.stdout.write(f"  {key}: {value}")

        self.stdout.write("\n--- Daily Averages ---")
        for key, value in nutrition_data["averages"].items():
            goal_key = f"daily_{key}_goal"
            goal = nutrition_data["goals"].get(goal_key, 0)
            adherence_key = key
            adherence = nutrition_data["adherence"].get(adherence_key, 0)
            self.stdout.write(
                f"  {key}: {value} (Goal: {goal}) - {adherence}% adherence"
            )

        self.stdout.write(
            f"\nOverall Adherence: {nutrition_data['adherence']['overall']}%"
        )

        self.stdout.write("\n--- Daily Breakdown ---")
        for entry in nutrition_data["daily_entries"][:5]:  # Show first 5 days
            self.stdout.write(
                f"  {entry['date']}: {entry['calories']} kcal, "
                f"{entry['protein']}g protein, "
                f"{entry['food_entries_count']} food entries"
            )
        if len(nutrition_data["daily_entries"]) > 5:
            self.stdout.write(
                f"  ... and {len(nutrition_data['daily_entries']) - 5} more days"
            )

    def _display_workout_data(self, workout_data):
        """Display workout data"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
        self.stdout.write(self.style.SUCCESS("WORKOUT DATA"))
        self.stdout.write(self.style.SUCCESS(f"{'='*60}"))

        if not workout_data["has_data"]:
            self.stdout.write(self.style.WARNING(f"\n{workout_data['message']}"))
            return

        self.stdout.write(f"\nTotal Workouts: {workout_data['total_workouts']}")
        self.stdout.write(
            f"Workout Frequency: {workout_data['workouts_per_week']} workouts/week"
        )
        self.stdout.write(
            f"Total Exercises: {workout_data['total_exercises_performed']}"
        )
        self.stdout.write(f"Total Sets: {workout_data['total_sets_performed']}")
        self.stdout.write(
            f"Total Workout Time: {workout_data['total_workout_minutes']} minutes"
        )
        self.stdout.write(
            f"Average Duration: {workout_data['average_workout_duration']} minutes"
        )

        if workout_data.get("volume_by_exercise"):
            self.stdout.write("\n--- Top Exercises by Volume ---")
            sorted_exercises = sorted(
                workout_data["volume_by_exercise"].items(),
                key=lambda x: x[1]["total_volume"],
                reverse=True,
            )[:5]
            for exercise_name, data in sorted_exercises:
                self.stdout.write(
                    f"  {exercise_name}: {data['total_volume']} total volume "
                    f"({data['total_sets']} sets, {data['occurrences']} sessions)"
                )

        self.stdout.write("\n--- Workout History ---")
        for workout in workout_data["workout_history"][:5]:  # Show first 5 workouts
            self.stdout.write(
                f"  {workout['date']}: {workout['title']} "
                f"({workout['duration_minutes']} min, "
                f"{workout['total_exercises']} exercises, "
                f"{workout['total_sets']} sets)"
            )
        if len(workout_data["workout_history"]) > 5:
            self.stdout.write(
                f"  ... and {len(workout_data['workout_history']) - 5} more workouts"
            )
