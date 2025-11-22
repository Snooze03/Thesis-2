import os
import dj_database_url
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS = [os.environ.get("RENDER_EXTERNAL_HOSTNAME")]
CSRF_TRUSTED_ORIGINS = [f"https://{os.environ.get('RENDER_EXTERNAL_HOSTNAME')}"]

DEBUG = False
SECRET_KEY = os.environ.get("SECRET_KEY")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Packages
    "corsheaders.middleware.CorsMiddleware",
]

CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    "https://react-js-frontend-uymm.onrender.com",
    "https://prime-dfit.com",
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL"),
        conn_max_age=600,
    )
}

# ==========================================
# CELERY CONFIGURATION (Production - PostgreSQL)
# ==========================================
# Parse DATABASE_URL to get PostgreSQL connection string for Celery
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Convert postgres:// to postgresql:// (required by SQLAlchemy)
# Then convert to sqla+postgresql:// for Celery broker
if DATABASE_URL:
    # Handle both postgres:// and postgresql:// formats
    celery_db_url = DATABASE_URL
    if celery_db_url.startswith("postgres://"):
        celery_db_url = celery_db_url.replace("postgres://", "postgresql://", 1)
    if celery_db_url.startswith("postgresql://"):
        celery_db_url = celery_db_url.replace("postgresql://", "sqla+postgresql://", 1)

    CELERY_BROKER_URL = celery_db_url
else:
    # Fallback (shouldn't happen in production)
    CELERY_BROKER_URL = f'sqla+sqlite:///{BASE_DIR / "db.sqlite3"}'

# Celery Result Backend
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "django-cache"

# Celery Serialization
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

# Celery Timezone
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Scheduler
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Task Execution Settings
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes soft limit
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Result Backend Settings
CELERY_RESULT_EXTENDED = True
CELERY_RESULT_BACKEND_ALWAYS_RETRY = True
CELERY_RESULT_BACKEND_MAX_RETRIES = 10
CELERY_RESULT_EXPIRES = 60 * 60 * 24 * 7  # 7 days

# Worker Settings
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Logging Configuration (helps with debugging on Render)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "assistant": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
