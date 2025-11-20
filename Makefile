.PHONY: help dev-up dev-down prod-up prod-down logs health init-db seed-db train-models backup restore clean

# Default target
help:
	@echo "Swati Jewellers - Deployment Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up          - Start development environment"
	@echo "  make dev-down        - Stop development environment"
	@echo "  make dev-logs        - View development logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod-up         - Start production environment"
	@echo "  make prod-down       - Stop production environment"
	@echo "  make prod-logs       - View production logs"
	@echo ""
	@echo "Database:"
	@echo "  make init-db         - Initialize database"
	@echo "  make seed-db         - Seed sample data"
	@echo "  make backup          - Backup MongoDB"
	@echo "  make restore         - Restore MongoDB"
	@echo ""
	@echo "ML Models:"
	@echo "  make train-models    - Train ML models"
	@echo ""
	@echo "Utilities:"
	@echo "  make health          - Check application health"
	@echo "  make clean           - Remove all containers and volumes"

# Development commands
dev-up:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "Backend: http://localhost:5000"
	@echo "Health: http://localhost:5000/api/health"

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
	docker-compose -f docker-compose.dev.yml restart backend

# Production commands
prod-up:
	@if [ ! -f .env ]; then \
		echo "Error: .env file not found. Copy .env.example to .env and configure it."; \
		exit 1; \
	fi
	docker-compose up -d
	@echo "Production environment started!"
	@echo "Backend: http://localhost:5000"
	@echo "Health: http://localhost:5000/api/health"

prod-down:
	docker-compose down

prod-logs:
	docker-compose logs -f

prod-restart:
	docker-compose restart backend

# Database commands
init-db:
	docker-compose exec backend python scripts/init_db.py
	@echo "Database initialized!"

seed-db:
	docker-compose exec backend python scripts/seed_data.py
	@echo "Sample data seeded!"

backup:
	@mkdir -p backups
	docker-compose exec mongodb mongodump --username admin --password $${MONGO_ROOT_PASSWORD:-admin123} --authenticationDatabase admin --out /data/backup
	docker cp swati-jewellers-mongodb:/data/backup ./backups/mongodb-backup-$$(date +%Y%m%d-%H%M%S)
	@echo "Backup created in ./backups/"

restore:
	@if [ -z "$(BACKUP_DIR)" ]; then \
		echo "Error: Please specify BACKUP_DIR. Example: make restore BACKUP_DIR=./backups/mongodb-backup-20251114-103000"; \
		exit 1; \
	fi
	docker cp $(BACKUP_DIR) swati-jewellers-mongodb:/data/restore
	docker-compose exec mongodb mongorestore --username admin --password $${MONGO_ROOT_PASSWORD:-admin123} --authenticationDatabase admin /data/restore
	@echo "Database restored!"

# ML Model commands
train-models:
	docker-compose exec backend python scripts/train_models.py
	@echo "ML models trained!"

# Utility commands
health:
	@curl -s http://localhost:5000/api/health | python -m json.tool

logs:
	docker-compose logs -f

shell-backend:
	docker-compose exec backend /bin/bash

shell-mongodb:
	docker-compose exec mongodb mongosh -u admin -p $${MONGO_ROOT_PASSWORD:-admin123} --authenticationDatabase admin

clean:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	@echo "All containers and volumes removed!"

# Build commands
build:
	docker-compose build

build-no-cache:
	docker-compose build --no-cache

# Testing
test:
	docker-compose exec backend python -m pytest

# Status
status:
	docker-compose ps
	@echo ""
	@echo "Health Check:"
	@make health
