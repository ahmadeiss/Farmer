#!/usr/bin/env bash
# Render build script for Smart Hasaad backend.
# Run order: install deps -> collect static -> run migrations.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input
