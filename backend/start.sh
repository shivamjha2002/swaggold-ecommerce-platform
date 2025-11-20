#!/bin/bash
# Production startup script for Flask backend

set -e

echo "Starting Swati Jewellers Backend..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until python -c "from mongoengine import connect; connect(host='${MONGODB_URI}'); print('MongoDB is ready!')" 2>/dev/null; do
  echo "MongoDB is unavailable - sleeping"
  sleep 2
done

echo "MongoDB is ready!"

# Check if models exist, if not, train them
if [ ! -f "models/gold_model.pkl" ] || [ ! -f "models/diamond_model.pkl" ]; then
    echo "ML models not found. Training models..."
    python scripts/train_models.py || echo "Warning: Model training failed. Continuing without models."
fi

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn --config gunicorn.conf.py run:app
