#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Running migrations..."
python manage.py migrate --noinput

if [[ $CREATE_SUPERUSER ]]; 
then
    echo "Creating superuser..."
    python manage.py createsuperuser --no-input 
fi

echo "Build complete!"