from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from ...services.progress_report_service import ReportGenerationService
from datetime import datetime, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = "Test progress report generation"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            help="User ID to generate report for",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days to include in report (default: 7)",
        )
        parser.add_argument(
            "--report-type",
            type=str,
            default="short",
            choices=["short", "detailed"],
            help="Type of report to generate",
        )

    def handle(self, *args, **options):
        user_id = options.get("user_id")
        days = options.get("days")
        report_type = options.get("report_type")

        # Get user
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"User with ID {user_id} not found"))
                return
        else:
            # Get first user if no ID specified
            user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR("No users found in database"))
                return

        self.stdout.write(f"Generating report for user: {user.email}")

        # Initialize service
        service = ReportGenerationService()

        # Generate report
        period_end = datetime.now()
        period_start = period_end - timedelta(days=days)

        self.stdout.write(
            f"Period: {period_start.strftime('%Y-%m-%d')} to {period_end.strftime('%Y-%m-%d')}"
        )

        try:
            report = service.generate_report(
                user=user,
                period_start=period_start,
                period_end=period_end,
                report_type=report_type,
            )

            # Check status
            if report.status == "generated":
                self.stdout.write(self.style.SUCCESS("Report generated successfully!"))
                self.stdout.write(f"\nReport ID: {report.id}")
                self.stdout.write(f"\n=== PROGRESS SUMMARY ===")
                self.stdout.write(report.progress_summary)
                self.stdout.write(f"\n=== WORKOUT FEEDBACK ===")
                self.stdout.write(report.workout_feedback)
                self.stdout.write(f"\n=== NUTRITION FEEDBACK ===")
                self.stdout.write(report.nutrition_feedback)
                self.stdout.write(f"\n=== KEY TAKEAWAYS ===")
                self.stdout.write(report.key_takeaways)
            elif report.status == "failed":
                self.stdout.write(
                    self.style.ERROR(
                        f"Report generation failed: {report.generation_error}"
                    )
                )
            else:
                self.stdout.write(self.style.WARNING(f"Report status: {report.status}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
