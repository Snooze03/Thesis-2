from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging
import psutil  # Add this to requirements.txt
import os

logger = logging.getLogger(__name__)

User = get_user_model()


def log_memory_usage(task_name, stage="start"):
    """Helper function to log memory usage"""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024  # Convert to MB
        logger.info(f"[MEMORY] {task_name} - {stage}: {memory_mb:.2f} MB")
        return memory_mb
    except Exception as e:
        logger.warning(f"[MEMORY] Could not get memory info: {e}")
        return 0


@shared_task(name="assistant.tasks.test_celery_task")
def test_celery_task():
    """Test task to verify Celery is working"""
    log_memory_usage("test_celery_task", "start")
    logger.info("[TASK-TEST] Test Celery task executed successfully!")
    log_memory_usage("test_celery_task", "end")
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
    from .models import ProgressReport
    from .services.progress_report_service import ReportGenerationService
    import gc

    log_memory_usage("generate_progress_report_task", "start")

    try:
        # Get user
        user = User.objects.get(id=user_id)
        logger.info(
            f"[TASK] Generating progress report for user {user.email} ({period_start} to {period_end})"
        )

        log_memory_usage("generate_progress_report_task", "after_user_fetch")

        # Parse dates
        from django.utils.dateparse import parse_datetime

        start_date = parse_datetime(period_start)
        end_date = parse_datetime(period_end)

        # Generate report using service
        service = ReportGenerationService()
        report = service.generate_report(
            user=user,
            period_start=start_date,
            period_end=end_date,
            report_type=report_type,
        )

        log_memory_usage("generate_progress_report_task", "after_generation")

        logger.info(
            f"[TASK] Successfully generated report {report.id} for user {user.email}"
        )

        # Force garbage collection to free memory
        gc.collect()
        log_memory_usage("generate_progress_report_task", "after_gc")

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
        logger.error(f"[TASK] Error generating report for user {user_id}: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=60)
    finally:
        log_memory_usage("generate_progress_report_task", "end")


@shared_task(name="assistant.tasks.test_generate_all_user_reports")
def test_generate_all_user_reports():
    """
    TEST TASK: Generate progress reports for ALL users with enabled settings.
    This is for testing purposes - generates reports synchronously
    """
    from .models import ProgressReportSettings
    from .services.progress_report_service import ReportGenerationService
    import gc

    log_memory_usage("test_generate_all_user_reports", "start")
    logger.info("[TASK] Starting report generation for ALL users")

    # Get all users with enabled report settings
    all_settings = ProgressReportSettings.objects.filter(
        is_enabled=True
    ).select_related("user")

    if not all_settings.exists():
        logger.warning("[ReportTask] No users with enabled report settings found")
        return {
            "status": "success",
            "message": "No users to generate reports for",
            "reports_generated": 0,
        }

    reports_generated = 0
    reports_failed = 0

    # Process users one at a time to reduce memory usage
    for setting in all_settings:
        try:
            logger.info(f"[TASK] Processing user {setting.user.email}")
            log_memory_usage(
                "test_generate_all_user_reports", f"before_{setting.user.email}"
            )

            # Create new service instance for each user
            service = ReportGenerationService()

            # Calculate period (use user's interval setting)
            period_end = timezone.now()
            period_start = period_end - timedelta(days=setting.day_interval)

            # Generate report synchronously
            report = service.generate_report(
                user=setting.user,
                period_start=period_start,
                period_end=period_end,
                report_type=setting.report_type,
            )

            if report.status == "generated":
                reports_generated += 1
            else:
                reports_failed += 1

            # Clean up after each user
            del service
            gc.collect()
            log_memory_usage(
                "test_generate_all_user_reports", f"after_{setting.user.email}"
            )

        except Exception as e:
            logger.error(f"[TASK] Error for user {setting.user.email}: {str(e)}")
            reports_failed += 1
            gc.collect()
            continue

    log_memory_usage("test_generate_all_user_reports", "end")

    return {
        "status": "success",
        "reports_generated": reports_generated,
        "reports_failed": reports_failed,
        "users_processed": all_settings.count(),
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="assistant.tasks.generate_scheduled_progress_reports")
def generate_scheduled_progress_reports():
    """
    Scheduled task that runs daily to check which users are due for progress reports
    and schedules report generation tasks for them.
    """
    from .models import ProgressReportSettings
    import gc

    log_memory_usage("generate_scheduled_progress_reports", "start")
    logger.info("[TASK] Starting scheduled progress report generation check")

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

                # Schedule the report generation task (async)
                generate_progress_report_task.delay(
                    user_id=setting.user.id,
                    period_start=period_start.isoformat(),
                    period_end=period_end.isoformat(),
                    report_type=setting.report_type,
                )

                # Update next generation date
                setting.update_next_generation_date()

                logger.info(
                    f"[TASK] Scheduled report for user {setting.user.email} "
                    f"[TASK] next generation: {setting.next_generation_date})"
                )
                reports_scheduled += 1

        except Exception as e:
            logger.error(
                f"[TASK] Error scheduling report for user {setting.user.email}: {str(e)}"
            )
            errors += 1
            continue

    gc.collect()
    log_memory_usage("generate_scheduled_progress_reports", "end")

    logger.info(
        f"[TASK] Scheduled progress report check complete. "
        f"[TASK] Reports scheduled: {reports_scheduled}, Errors: {errors}"
    )

    return {
        "status": "success",
        "reports_scheduled": reports_scheduled,
        "errors": errors,
        "timestamp": timezone.now().isoformat(),
    }


@shared_task(name="assistant.tasks.cleanup_old_reports")
def cleanup_old_reports(keep_last_n=5):
    """
    Cleanup task that removes old progress reports, keeping only the most recent N reports per user.

    Args:
        keep_last_n: Number of most recent reports to keep per user (default: 5)
    """
    from .models import ProgressReport
    import gc

    log_memory_usage("cleanup_old_reports", "start")
    logger.info(
        f"[TASK] Starting cleanup of old progress reports (keeping last {keep_last_n})"
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
                    f"[TASK] Cleaned up {deleted} old reports for user ID {user_id} "
                    f"(kept {keep_last_n} most recent)"
                )

        except Exception as e:
            logger.error(
                f"[TASK] Error cleaning up reports for user ID {user_id}: {str(e)}"
            )
            continue

    gc.collect()
    log_memory_usage("cleanup_old_reports", "end")

    logger.info(
        f"[TASK] Cleanup complete. Deleted {deleted_count} reports across {users_cleaned} users"
    )

    return {
        "status": "success",
        "deleted_count": deleted_count,
        "users_cleaned": users_cleaned,
        "timestamp": timezone.now().isoformat(),
    }
