set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate --no-input

if [[$CREATE_SUPERUSER]]; 
then
    python manage.py createsuperuser --no-input 
fi

# Celery
python manage.py migrate django_celery_beat --no-input
python manage.py migrate django_celery_results --no-input