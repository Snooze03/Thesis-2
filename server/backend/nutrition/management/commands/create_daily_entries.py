from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import datetime, date
from nutrition.services.daily_entry_service import DailyEntryService


class Command(BaseCommand):
    help = "Create daily nutrition entries for users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--date",
            type=str,
            help="Specific date to create entries for (YYYY-MM-DD format). Defaults to today.",
        )

        parser.add_argument(
            "--start-date",
            type=str,
            help="Start date for batch creation (YYYY-MM-DD format). Requires --end-date.",
        )

        parser.add_argument(
            "--end-date",
            type=str,
            help="End date for batch creation (YYYY-MM-DD format). Requires --start-date.",
        )

        parser.add_argument(
            "--cleanup",
            action="store_true",
            help="Also run cleanup of old entries",
        )

        parser.add_argument(
            "--days-to-keep",
            type=int,
            default=90,
            help="Number of days to keep when cleaning up (default: 90)",
        )

        parser.add_argument(
            "--stats",
            action="store_true",
            help="Show daily entry statistics",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be done without actually creating entries",
        )

    def handle(self, *args, **options):
        # Show stats if requested
        if options["stats"]:
            self.show_stats()
            return

        # Validate date arguments
        target_date = None
        start_date = None
        end_date = None

        if options["date"]:
            try:
                target_date = datetime.strptime(options["date"], "%Y-%m-%d").date()
            except ValueError:
                raise CommandError("Invalid date format. Use YYYY-MM-DD format.")

        if options["start_date"] or options["end_date"]:
            if not (options["start_date"] and options["end_date"]):
                raise CommandError(
                    "Both --start-date and --end-date are required for batch creation."
                )

            try:
                start_date = datetime.strptime(options["start_date"], "%Y-%m-%d").date()
                end_date = datetime.strptime(options["end_date"], "%Y-%m-%d").date()
            except ValueError:
                raise CommandError("Invalid date format. Use YYYY-MM-DD format.")

            if start_date > end_date:
                raise CommandError("Start date must be before or equal to end date.")

        # Handle dry run
        if options["dry_run"]:
            self.handle_dry_run(target_date, start_date, end_date)
            return

        # Execute the actual operations
        if start_date and end_date:
            self.handle_batch_creation(start_date, end_date)
        else:
            self.handle_single_date_creation(target_date)

        # Optional cleanup
        if options["cleanup"]:
            self.handle_cleanup(options["days_to_keep"])

    def handle_dry_run(self, target_date, start_date, end_date):
        """Show what would be done without actually executing"""
        from nutrition.models import NutritionProfile

        active_profiles = NutritionProfile.objects.filter(
            account__is_active=True
        ).count()

        self.stdout.write(
            self.style.WARNING("DRY RUN MODE - No actual changes will be made")
        )

        if start_date and end_date:
            from nutrition.utils import DateUtils

            dates = DateUtils.get_date_range(start_date, end_date)
            self.stdout.write(
                f"Would create daily entries for {active_profiles} users "
                f"across {len(dates)} dates ({start_date} to {end_date})"
            )
            self.stdout.write(
                f"Total potential entries: {active_profiles * len(dates)}"
            )
        else:
            if target_date is None:
                target_date = date.today()
            self.stdout.write(
                f"Would create daily entries for {active_profiles} users on {target_date}"
            )

    def handle_single_date_creation(self, target_date):
        """Handle creation for a single date"""
        if target_date is None:
            target_date = date.today()

        self.stdout.write(f"Creating daily entries for {target_date}...")

        results = DailyEntryService.create_daily_entries_for_all_users(target_date)

        self.stdout.write(
            self.style.SUCCESS(
                f"Daily entry creation completed for {target_date}:\n"
                f'  Total profiles: {results["total_profiles"]}\n'
                f'  Created: {results["created"]}\n'
                f'  Already existed: {results["already_existed"]}\n'
                f'  Errors: {results["errors"]}\n'
                f'  Duration: {results["duration_seconds"]:.2f}s'
            )
        )

        if results["errors"] > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Errors occurred:\n"
                    + "\n".join(
                        [
                            f"  - {err['user_email']}: {err['error']}"
                            for err in results["error_details"]
                        ]
                    )
                )
            )

    def handle_batch_creation(self, start_date, end_date):
        """Handle batch creation for date range"""
        self.stdout.write(
            f"Creating daily entries for date range: {start_date} to {end_date}..."
        )

        results = DailyEntryService.create_daily_entries_for_date_range(
            start_date, end_date
        )

        if results["success"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Batch daily entry creation completed:\n"
                    f'  Total dates processed: {results["total_dates"]}\n'
                    f'  Total entries created: {results["total_created"]}\n'
                    f'  Total already existed: {results["total_already_existed"]}\n'
                    f'  Total errors: {results["total_errors"]}'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'Batch creation failed: {results.get("error", "Unknown error")}'
                )
            )

        # Show daily breakdown if requested
        if results["total_errors"] > 0:
            self.stdout.write(
                self.style.WARNING("Errors occurred during batch processing")
            )

    def handle_cleanup(self, days_to_keep):
        """Handle cleanup of old entries"""
        self.stdout.write(
            f"Running cleanup of entries older than {days_to_keep} days..."
        )

        cleanup_results = DailyEntryService.cleanup_old_daily_entries(days_to_keep)

        if cleanup_results["success"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Cleanup completed:\n"
                    f'  Entries deleted: {cleanup_results["deleted_count"]}\n'
                    f'  Cutoff date: {cleanup_results["cutoff_date"]}'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'Cleanup failed: {cleanup_results["error"]}')
            )

    def show_stats(self):
        """Show daily entry statistics"""
        self.stdout.write("Fetching daily entry statistics...")

        stats = DailyEntryService.get_daily_entry_stats()

        if stats["success"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Daily Entry Statistics:\n"
                    f'  Total entries: {stats["total_entries"]}\n'
                    f'  Earliest entry: {stats["earliest_date"]}\n'
                    f'  Latest entry: {stats["latest_date"]}\n'
                    f'  Recent entries (7 days): {stats["recent_entries_7_days"]}\n'
                )
            )

            if stats["top_users"]:
                self.stdout.write("\nTop users by entry count:")
                for user in stats["top_users"]:
                    self.stdout.write(
                        f'  {user["nutrition_profile__account__email"]}: '
                        f'{user["entry_count"]} entries'
                    )
        else:
            self.stdout.write(
                self.style.ERROR(f'Failed to get stats: {stats["error"]}')
            )
