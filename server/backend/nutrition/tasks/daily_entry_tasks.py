from celery import shared_task
from django.utils import timezone
from datetime import date
import logging
from ..services.daily_entry_service import DailyEntryService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def create_daily_entries_task(self, target_date=None):
    """
    Celery task to create daily entries for all users
    Runs every day at 12:00 AM

    Args:
        target_date (str, optional): Date string in YYYY-MM-DD format
    """
    try:
        logger.info("Starting daily entry creation task")

        # Parse target date if provided
        if target_date:
            from datetime import datetime

            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

        results = DailyEntryService.create_daily_entries_for_all_users(target_date)

        # Log results
        logger.info(
            f"Daily entry task completed successfully. "
            f"Date: {results['target_date']}, "
            f"Created: {results['created']}, "
            f"Already existed: {results['already_existed']}, "
            f"Errors: {results['errors']}"
        )

        # If there were errors, log them but don't fail the task
        if results["errors"] > 0:
            logger.warning(
                f"Daily entry task had {results['errors']} errors: "
                f"{results['error_details']}"
            )

        return {
            "success": True,
            "message": "Daily entries created successfully",
            "results": results,
        }

    except Exception as exc:
        logger.error(f"Daily entry task failed: {str(exc)}")

        # Retry the task up to 3 times with exponential backoff
        try:
            raise self.retry(countdown=60 * (2**self.request.retries))
        except self.MaxRetriesExceededError:
            logger.error("Daily entry task failed after all retries")
            return {
                "success": False,
                "message": f"Task failed after retries: {str(exc)}",
            }


@shared_task
def cleanup_old_daily_entries_task(days_to_keep=90):
    """
    Celery task to clean up old daily entries
    Runs weekly to keep database size manageable

    Args:
        days_to_keep (int): Number of days to keep entries for
    """
    try:
        logger.info(
            f"Starting old daily entries cleanup task (keeping {days_to_keep} days)"
        )

        results = DailyEntryService.cleanup_old_daily_entries(days_to_keep)

        if results["success"]:
            logger.info(
                f"Cleanup task completed successfully. "
                f"Deleted {results['deleted_count']} entries older than {results['cutoff_date']}"
            )
        else:
            logger.error(f"Cleanup task failed: {results['error']}")

        return results

    except Exception as exc:
        logger.error(f"Cleanup task failed: {str(exc)}")
        return {"success": False, "error": str(exc)}


@shared_task
def create_daily_entry_for_single_user_task(user_id, target_date=None):
    """
    Create daily entry for a specific user (useful for manual triggers or new users)

    Args:
        user_id (int): Account ID
        target_date (str, optional): Date string in YYYY-MM-DD format
    """
    try:
        from accounts.models import Account
        from ..models import NutritionProfile
        from datetime import datetime

        # Parse target date if provided
        if target_date:
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

        account = Account.objects.get(id=user_id, is_active=True)
        nutrition_profile = account.nutrition_profile

        daily_entry, created, message = DailyEntryService.create_daily_entry_for_user(
            nutrition_profile, target_date
        )

        return {
            "success": True,
            "created": created,
            "message": message,
            "user_email": account.email,
            "date": str(target_date or date.today()),
        }

    except Account.DoesNotExist:
        error_msg = f"Account with ID {user_id} not found or inactive"
        logger.error(error_msg)
        return {"success": False, "message": error_msg}
    except NutritionProfile.DoesNotExist:
        error_msg = f"Nutrition profile not found for user ID {user_id}"
        logger.error(error_msg)
        return {"success": False, "message": error_msg}
    except Exception as exc:
        error_msg = f"Failed to create daily entry for user {user_id}: {str(exc)}"
        logger.error(error_msg)
        return {"success": False, "message": error_msg}


@shared_task
def batch_create_daily_entries_task(start_date, end_date):
    """
    Batch create daily entries for a date range
    Useful for backfilling data or manual batch processing

    Args:
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
    """
    try:
        from datetime import datetime

        logger.info(f"Starting batch daily entry creation: {start_date} to {end_date}")

        # Parse dates
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()

        results = DailyEntryService.create_daily_entries_for_date_range(
            start_date_obj, end_date_obj
        )

        if results["success"]:
            logger.info(
                f"Batch creation completed successfully. "
                f"Total created: {results['total_created']}, "
                f"Total errors: {results['total_errors']}"
            )
        else:
            logger.error(f"Batch creation failed: {results.get('error')}")

        return results

    except ValueError as e:
        error_msg = f"Invalid date format: {str(e)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}
    except Exception as exc:
        error_msg = f"Batch creation task failed: {str(exc)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}


@shared_task
def daily_entry_health_check_task():
    """
    Health check task to monitor daily entry system
    Runs periodically to ensure system is functioning
    """
    try:
        logger.info("Running daily entry health check")

        stats = DailyEntryService.get_daily_entry_stats()

        if stats["success"]:
            # Check for concerning patterns
            alerts = []

            # Check if recent entries are being created
            if stats["recent_entries_7_days"] == 0:
                alerts.append("No daily entries created in the last 7 days")

            # Check for system health indicators
            total_entries = stats.get("total_entries", 0)
            if total_entries == 0:
                alerts.append("No daily entries found in system")

            result = {
                "success": True,
                "stats": stats,
                "alerts": alerts,
                "health_status": "healthy" if not alerts else "warning",
            }

            if alerts:
                logger.warning(f"Daily entry health check alerts: {alerts}")
            else:
                logger.info("Daily entry health check passed")

            return result

        else:
            logger.error(f"Health check failed to get stats: {stats['error']}")
            return {"success": False, "error": stats["error"], "health_status": "error"}

    except Exception as exc:
        error_msg = f"Health check task failed: {str(exc)}"
        logger.error(error_msg)
        return {"success": False, "error": error_msg, "health_status": "error"}
