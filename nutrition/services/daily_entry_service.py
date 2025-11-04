from django.utils import timezone
from django.db import transaction
from datetime import date, datetime
import logging
from ..models import NutritionProfile, DailyEntry
from ..utils import DateUtils

logger = logging.getLogger(__name__)


class DailyEntryService:
    """Service for managing daily nutrition entries"""

    @staticmethod
    def create_daily_entry_for_user(nutrition_profile, target_date=None):
        """
        Create a daily entry for a specific user's nutrition profile

        Args:
            nutrition_profile: NutritionProfile instance
            target_date: Date to create entry for (defaults to today)

        Returns:
            tuple: (DailyEntry instance or None, success boolean, message)
        """
        if target_date is None:
            target_date = DateUtils.get_today()

        try:
            with transaction.atomic():
                # Check if daily entry already exists
                daily_entry, created = DailyEntry.objects.get_or_create(
                    nutrition_profile=nutrition_profile,
                    date=target_date,
                    defaults={
                        "total_calories": 0.0,
                        "total_protein": 0.0,
                        "total_carbs": 0.0,
                        "total_fat": 0.0,
                    },
                )

                if created:
                    logger.info(
                        f"Created daily entry for {nutrition_profile.account.email} "
                        f"on {target_date}"
                    )
                    return daily_entry, True, "Daily entry created successfully"
                else:
                    logger.debug(
                        f"Daily entry already exists for {nutrition_profile.account.email} "
                        f"on {target_date}"
                    )
                    return daily_entry, False, "Daily entry already exists"

        except Exception as e:
            logger.error(
                f"Error creating daily entry for {nutrition_profile.account.email}: {str(e)}"
            )
            return None, False, f"Error creating daily entry: {str(e)}"

    @staticmethod
    def create_daily_entries_for_all_users(target_date=None):
        """
        Create daily entries for all users with nutrition profiles

        Args:
            target_date: Date to create entries for (defaults to today)

        Returns:
            dict: Summary of the operation
        """
        if target_date is None:
            target_date = DateUtils.get_today()

        start_time = timezone.now()

        logger.info(f"Starting daily entry creation for all users on {target_date}")

        # Get all active nutrition profiles
        nutrition_profiles = NutritionProfile.objects.select_related("account").filter(
            account__is_active=True
        )

        results = {
            "total_profiles": nutrition_profiles.count(),
            "created": 0,
            "already_existed": 0,
            "errors": 0,
            "error_details": [],
            "target_date": target_date,
        }

        for nutrition_profile in nutrition_profiles:
            try:
                daily_entry, created, message = (
                    DailyEntryService.create_daily_entry_for_user(
                        nutrition_profile, target_date
                    )
                )

                if created:
                    results["created"] += 1
                else:
                    results["already_existed"] += 1

            except Exception as e:
                results["errors"] += 1
                error_detail = {
                    "user_email": nutrition_profile.account.email,
                    "error": str(e),
                }
                results["error_details"].append(error_detail)
                logger.error(
                    f"Failed to create daily entry for {nutrition_profile.account.email}: {str(e)}"
                )

        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()

        logger.info(
            f"Daily entry creation completed in {duration:.2f}s. "
            f"Created: {results['created']}, "
            f"Already existed: {results['already_existed']}, "
            f"Errors: {results['errors']}"
        )

        results["duration_seconds"] = duration
        results["start_time"] = start_time
        results["end_time"] = end_time

        return results

    @staticmethod
    def cleanup_old_daily_entries(days_to_keep=90):
        """
        Clean up old daily entries to prevent database bloat

        Args:
            days_to_keep (int): Number of days to keep entries for

        Returns:
            dict: Cleanup operation results
        """
        from datetime import timedelta

        cutoff_date = DateUtils.get_today() - timedelta(days=days_to_keep)

        logger.info(f"Starting cleanup of daily entries older than {cutoff_date}")

        try:
            # Get count first for logging
            old_entries_count = DailyEntry.objects.filter(date__lt=cutoff_date).count()

            # Delete old entries
            deleted_count, _ = DailyEntry.objects.filter(date__lt=cutoff_date).delete()

            logger.info(f"Cleaned up {deleted_count} old daily entries")

            return {
                "success": True,
                "deleted_count": deleted_count,
                "cutoff_date": cutoff_date,
                "days_kept": days_to_keep,
            }

        except Exception as e:
            logger.error(f"Error during daily entry cleanup: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "deleted_count": 0,
                "cutoff_date": cutoff_date,
            }

    @staticmethod
    def create_daily_entries_for_date_range(start_date, end_date):
        """
        Create daily entries for all users for a range of dates
        Useful for backfilling or batch creation

        Args:
            start_date: Start date for range
            end_date: End date for range

        Returns:
            dict: Summary of the operation
        """
        # Validate date range
        if not DateUtils.is_valid_date_range(start_date, end_date):
            return {
                "success": False,
                "error": "Invalid date range or range too large (max 90 days)",
            }

        dates = DateUtils.get_date_range(start_date, end_date)

        logger.info(
            f"Creating daily entries for date range: {start_date} to {end_date}"
        )

        overall_results = {
            "success": True,
            "total_dates": len(dates),
            "total_created": 0,
            "total_already_existed": 0,
            "total_errors": 0,
            "daily_results": {},
        }

        for target_date in dates:
            daily_result = DailyEntryService.create_daily_entries_for_all_users(
                target_date
            )

            overall_results["total_created"] += daily_result["created"]
            overall_results["total_already_existed"] += daily_result["already_existed"]
            overall_results["total_errors"] += daily_result["errors"]
            overall_results["daily_results"][str(target_date)] = daily_result

            # If there are too many errors, stop processing
            if daily_result["errors"] > daily_result["total_profiles"] * 0.5:
                logger.error(
                    f"Too many errors on {target_date}, stopping batch creation"
                )
                overall_results["success"] = False
                overall_results["error"] = (
                    f"Stopped due to high error rate on {target_date}"
                )
                break

        logger.info(
            f"Batch daily entry creation completed. "
            f"Total created: {overall_results['total_created']}, "
            f"Total errors: {overall_results['total_errors']}"
        )

        return overall_results

    @staticmethod
    def get_daily_entry_stats():
        """
        Get statistics about daily entries in the system

        Returns:
            dict: Statistics about daily entries
        """
        try:
            from django.db.models import Count, Min, Max

            stats = DailyEntry.objects.aggregate(
                total_entries=Count("id"),
                earliest_date=Min("date"),
                latest_date=Max("date"),
            )

            # Get entries per user
            user_counts = (
                DailyEntry.objects.values("nutrition_profile__account__email")
                .annotate(entry_count=Count("id"))
                .order_by("-entry_count")[:10]
            )

            # Get recent activity
            recent_entries = DailyEntry.objects.filter(
                date__gte=DateUtils.get_today() - timezone.timedelta(days=7)
            ).count()

            stats.update(
                {
                    "recent_entries_7_days": recent_entries,
                    "top_users": list(user_counts),
                    "success": True,
                }
            )

            return stats

        except Exception as e:
            logger.error(f"Error getting daily entry stats: {str(e)}")
            return {"success": False, "error": str(e)}
