from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from .models.progress_report import ProgressReport, ProgressReportSettings
from .services.progress_report_service import ReportGenerationService
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60 * 5)
def generate_progress_report_task(
    self, user_id, period_start_str, period_end_str, report_type="short"
):
    """
    Celery task to generate a progress report for a user.

    Args:
        user_id: User ID
        period_start_str: ISO format datetime string
        period_end_str: ISO format datetime string
        report_type: Type of report ('short' or 'detailed')

    Returns:
        dict: Task result with report ID or error
    """
    try:
        user = User.objects.get(id=user_id)

        # Parse datetime strings
        from dateutil import parser

        period_start = parser.isoparse(period_start_str)
        period_end = parser.isoparse(period_end_str)

        logger.info(
            f"Generating progress report for user {user.email} ({period_start.date()} to {period_end.date()})"
        )

        # Generate report
        service = ReportGenerationService()
        report = service.generate_report(
            user=user,
            period_start=period_start,
            period_end=period_end,
            report_type=report_type,
        )

        # Mark as auto-generated
        report.auto_generated = True
        report.save(update_fields=["auto_generated"])

        if report.status == "generated":
            logger.info(
                f"Successfully generated report {report.id} for user {user.email}"
            )
            return {
                "status": "success",
                "report_id": report.id,
                "user_id": user_id,
                "user_email": user.email,
            }
        else:
            logger.error(
                f"Report generation failed for user {user.email}: {report.generation_error}"
            )
            return {
                "status": "failed",
                "error": report.generation_error,
                "user_id": user_id,
            }

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return {"status": "error", "error": "User not found", "user_id": user_id}

    except Exception as e:
        logger.error(
            f"Error generating report for user {user_id}: {str(e)}", exc_info=True
        )
        # Retry the task
        raise self.retry(exc=e)


@shared_task(name="assistant.tasks.generate_scheduled_progress_reports")
def generate_scheduled_progress_reports():
    """
    Periodic task that runs daily at 5 AM Manila time.
    Checks which users are due for report generation based on their day_interval.
    """
    now = timezone.now()
    today = now.date()

    logger.info(f"Running scheduled progress report check at {now}")

    # Get all enabled settings where reports are due
    settings_list = ProgressReportSettings.objects.filter(
        is_enabled=True
    ).select_related("user")

    reports_scheduled = 0
    skipped_users = []

    for settings in settings_list:
        # Check if report is due
        if settings.is_due_for_generation():
            # Calculate period
            period_end = now
            period_start = period_end - timedelta(days=settings.day_interval)

            logger.info(
                f"Scheduling report for {settings.user.email} "
                f"(interval: {settings.day_interval} days)"
            )

            # Schedule the report generation task
            generate_progress_report_task.apply_async(
                args=[
                    settings.user.id,
                    period_start.isoformat(),
                    period_end.isoformat(),
                    settings.report_type,
                ],
                countdown=reports_scheduled * 10,  # Stagger tasks by 10 seconds
            )

            # Update settings
            settings.last_generated_at = now
            settings.update_next_generation_date()

            reports_scheduled += 1
        else:
            days_until_next = (
                (settings.next_generation_date - today).days
                if settings.next_generation_date
                else "N/A"
            )
            skipped_users.append(
                {"email": settings.user.email, "days_until_next": days_until_next}
            )

    logger.info(
        f"Scheduled {reports_scheduled} progress reports. "
        f"Skipped {len(skipped_users)} users not due yet."
    )

    return {
        "reports_scheduled": reports_scheduled,
        "skipped_count": len(skipped_users),
        "checked_at": now.isoformat(),
        "next_check": "5:00 AM tomorrow",
        "skipped_users": skipped_users[:5],  # Log first 5 skipped
    }


@shared_task(name="assistant.tasks.cleanup_old_reports")
def cleanup_old_reports():
    """
    Clean up old progress reports.
    Keep only the last 20 reports per user.
    Runs weekly on Sunday at 2 AM.
    """
    users = User.objects.all()
    deleted_count = 0
    users_cleaned = 0

    for user in users:
        reports = ProgressReport.objects.filter(user=user).order_by("-created_at")

        # Keep only the last 20 reports
        reports_to_delete = reports[20:]

        if reports_to_delete.exists():
            count = reports_to_delete.count()
            reports_to_delete.delete()
            deleted_count += count
            users_cleaned += 1
            logger.info(f"Deleted {count} old reports for user {user.email}")

    logger.info(
        f"Cleanup complete: deleted {deleted_count} reports from {users_cleaned} users"
    )

    return {
        "deleted_count": deleted_count,
        "users_cleaned": users_cleaned,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(bind=True)
def test_celery_task(self):
    """Simple test task to verify Celery is working"""
    logger.info("Test task executed successfully!")
    return {
        "status": "success",
        "message": "Celery is working!",
        "task_id": self.request.id,
        "timestamp": timezone.now().isoformat(),
    }
