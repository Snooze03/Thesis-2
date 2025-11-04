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

CORS_ALLOWED_ORIGINS = [
    "https://react-js-frontend-uymm.onrender.com",
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

CORS_ALLOW_ALL_ORIGINS = False  # Allow all origins for development
CORS_ALLOWS_CREDENTIALS = False  # set to 'False' in development otherwise it will not work with allow all origins