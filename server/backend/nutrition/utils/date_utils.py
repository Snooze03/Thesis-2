from datetime import date, datetime, timedelta
from django.utils import timezone


class DateUtils:
    """Utility class for date operations in nutrition app"""

    @staticmethod
    def get_today():
        """Get today's date"""
        return date.today()

    @staticmethod
    def get_date_range(start_date, end_date):
        """Get list of dates between start and end date"""
        dates = []
        current = start_date
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=1)
        return dates

    @staticmethod
    def is_valid_date_range(start_date, end_date, max_days=90):
        """Validate if date range is reasonable"""
        if start_date > end_date:
            return False

        delta = end_date - start_date
        return delta.days <= max_days

    @staticmethod
    def get_week_start(target_date=None):
        """Get the start of the week (Monday) for given date"""
        if target_date is None:
            target_date = date.today()

        days_since_monday = target_date.weekday()
        return target_date - timedelta(days=days_since_monday)

    @staticmethod
    def get_month_start(target_date=None):
        """Get the start of the month for given date"""
        if target_date is None:
            target_date = date.today()

        return target_date.replace(day=1)
