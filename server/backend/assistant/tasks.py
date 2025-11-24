from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@shared_task(name="assistant.tasks.test_celery_task")
def test_celery_task():
    """Test task to verify Celery is working"""
    logger.info("Test Celery task executed successfully!")
    return {
        "status": "success",
        "message": "Celery is working!",
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(
    name="assistant.tasks.generate_progress_report_task",
    bind=True,
    max_retries=3,
    soft_time_limit=300,
)
def generate_progress_report_task(
    self, user_id, period_start, period_end, report_type="short"
):
    """
    Celery task to generate a progress report for a user.

    Args:
        user_id: ID of the user
        period_start: Start date of the reporting period (ISO format string)
        period_end: End date of the reporting period (ISO format string)
        report_type: Type of report ('short' or 'detailed')
    """
    from assistant.models.progress_report import ProgressReport
    from assistant.services.progress_report_service import ProgressReportService

    try:
        # Get user
        user = User.objects.get(id=user_id)
        logger.info(
            f"Generating progress report for user {user.email} ({period_start} to {period_end})"
        )

        # Parse dates
        from django.utils.dateparse import parse_datetime

        start_date = parse_datetime(period_start)
        end_date = parse_datetime(period_end)

        # Generate report using service
        service = ProgressReportService()
        report = service.generate_report(
            user=user,
            period_start=start_date,
            period_end=end_date,
            report_type=report_type,
            auto_generated=True,
        )

        logger.info(f"Successfully generated report {report.id} for user {user.email}")

        return {
            "status": "success",
            "report_id": report.id,
            "user_id": user_id,
            "period_start": period_start,
            "period_end": period_end,
        }

    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found")
        return {"status": "error", "message": "User not found"}

    except Exception as e:
        logger.error(f"Error generating report for user {user_id}: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)


@shared_task(name="assistant.tasks.test_generate_all_user_reports")
def test_generate_all_user_reports():
    """
    TEST TASK: Generate progress reports for ALL users with enabled settings.
    This is for testing purposes - generates reports for the last 7 days.
    """
    from assistant.models.progress_report import ProgressReportSettings

    logger.info("TEST: Starting report generation for ALL users")

    # Get all users with enabled report settings
    all_settings = ProgressReportSettings.objects.filter(
        is_enabled=True
    ).select_related("user")

    if not all_settings.exists():
        logger.warning("No users with enabled report settings found")
        return {
            "status": "success",
            "message": "No users to generate reports for",
            "reports_scheduled": 0,
        }

    reports_scheduled = 0
    errors = 0

    for setting in all_settings:
        try:
            # Calculate period (last 7 days or user's interval)
            period_end = timezone.now()
            period_start = period_end - timedelta(days=setting.day_interval)

            logger.info(
                f"Scheduling report for user {setting.user.email} "
                f"({period_start.date()} to {period_end.date()})"
            )

            # Schedule the report generation task
            generate_progress_report_task.delay(
                user_id=setting.user.id,
                period_start=period_start.isoformat(),
                period_end=period_end.isoformat(),
                report_type=setting.report_type,
            )

            reports_scheduled += 1

        except Exception as e:
            logger.error(
                f"Error scheduling report for user {setting.user.email}: {str(e)}"
            )
            errors += 1
            continue

    logger.info(
        f"TEST: Report generation complete. "
        f"Reports scheduled: {reports_scheduled}, Errors: {errors}"
    )

    return {
        "status": "success",
        "reports_scheduled": reports_scheduled,
        "errors": errors,
        "users_processed": all_settings.count(),
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="assistant.tasks.generate_scheduled_progress_reports")
def generate_scheduled_progress_reports():
    """
    Scheduled task that runs daily to check which users are due for progress reports
    and schedules report generation tasks for them.
    """
    from assistant.models.progress_report import ProgressReportSettings

    logger.info("Starting scheduled progress report generation check")

    # Get all users with enabled report settings who are due for a report
    due_settings = ProgressReportSettings.objects.filter(
        is_enabled=True
    ).select_related("user")

    reports_scheduled = 0
    errors = 0

    for setting in due_settings:
        try:
            if setting.is_due_for_generation():
                # Calculate period
                period_end = timezone.now()
                period_start = period_end - timedelta(days=setting.day_interval)

                # Schedule the report generation task
                generate_progress_report_task.delay(
                    user_id=setting.user.id,
                    period_start=period_start.isoformat(),
                    period_end=period_end.isoformat(),
                    report_type=setting.report_type,
                )

                # Update next generation date
                setting.update_next_generation_date()

                logger.info(
                    f"Scheduled report for user {setting.user.email} "
                    f"(next generation: {setting.next_generation_date})"
                )
                reports_scheduled += 1

        except Exception as e:
            logger.error(
                f"Error scheduling report for user {setting.user.email}: {str(e)}"
            )
            errors += 1
            continue

    logger.info(
        f"Scheduled progress report check complete. "
        f"Reports scheduled: {reports_scheduled}, Errors: {errors}"
    )

    return {
        "status": "success",
        "reports_scheduled": reports_scheduled,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="assistant.tasks.cleanup_old_reports")
def cleanup_old_reports(keep_last_n=20):
    """
    Cleanup task that removes old progress reports, keeping only the most recent N reports per user.

    Args:
        keep_last_n: Number of most recent reports to keep per user (default: 20)
    """
    from assistant.models.progress_report import ProgressReport

    logger.info(
        f"Starting cleanup of old progress reports (keeping last {keep_last_n})"
    )

    deleted_count = 0
    users_cleaned = 0

    # Get all users who have progress reports
    users_with_reports = (
        User.objects.filter(progress_reports__isnull=False)
        .distinct()
        .values_list("id", flat=True)
    )

    for user_id in users_with_reports:
        try:
            # Get all reports for this user, ordered by creation date (newest first)
            user_reports = ProgressReport.objects.filter(user_id=user_id).order_by(
                "-created_at"
            )

            total_reports = user_reports.count()

            if total_reports > keep_last_n:
                # Get IDs of reports to delete (all except the most recent N)
                reports_to_delete = user_reports[keep_last_n:]
                delete_ids = list(reports_to_delete.values_list("id", flat=True))

                # Delete the old reports
                deleted, _ = ProgressReport.objects.filter(id__in=delete_ids).delete()

                deleted_count += deleted
                users_cleaned += 1

                logger.info(
                    f"Cleaned up {deleted} old reports for user ID {user_id} "
                    f"(kept {keep_last_n} most recent)"
                )

        except Exception as e:
            logger.error(f"Error cleaning up reports for user ID {user_id}: {str(e)}")
            continue

    logger.info(
        f"Cleanup complete. Deleted {deleted_count} reports across {users_cleaned} users"
    )

    return {
        "status": "success",
        "deleted_count": deleted_count,
        "users_cleaned": users_cleaned,
        "timestamp": timezone.now().isoformat(),
    }
