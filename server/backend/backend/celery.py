import os
from celery import Celery
from celery.schedules import crontab

# Detect if we're in production
settings_module = (
    "backend.deployment_settings"
    if "RENDER_EXTERNAL_HOSTNAME" in os.environ
    else "backend.settings"
)

# Set Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

app = Celery("backend")

# Load config from Django settings with CELERY namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Configure Beat Schedule - Run daily at 5 AM Manila time
app.conf.beat_schedule = {
    "generate-scheduled-progress-reports": {
        "task": "assistant.tasks.generate_scheduled_progress_reports",
        "schedule": crontab(hour=0, minute=0),  # 12:00 AM (midnight) every day
        # FOR DEV TESTING PURPOSES ONLY
        # "schedule": crontab(minute="*"),  # Every minute
        "options": {
            "expires": 3600,  # Task expires after 1 hour if not picked up
        },
    },
    "cleanup-old-reports": {
        "task": "assistant.tasks.cleanup_old_reports",
        "schedule": crontab(
            hour=0, minute=0, day_of_week=0
        ),  # Sunday 12:00 AM (midnight)
        "options": {
            "expires": 7200,
        },
    },
}

# Set timezone
app.conf.timezone = "Asia/Manila"


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
