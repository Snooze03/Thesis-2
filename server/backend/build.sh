set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate

# Celery
python manage.py migrate django_celery_beat
python manage.py migrate django_celery_results