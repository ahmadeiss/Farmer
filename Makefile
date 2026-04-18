# ============================================================
# Smart Hasaad - حصاد الذكي  |  Developer Makefile
# ============================================================

.PHONY: help setup up down restart logs shell-backend shell-db migrate seed test lint format build

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: copy env, build, migrate, seed
	@cp -n .env.example .env || true
	@echo "✅ .env created (edit it if needed)"
	$(MAKE) build
	$(MAKE) migrate
	$(MAKE) seed
	@echo "🌾 Smart Hasaad is ready! Run: make up"

build: ## Build all Docker images
	docker-compose build

up: ## Start all services in background
	docker-compose up -d
	@echo "🚀 Backend: http://localhost:8000"
	@echo "🚀 Frontend: http://localhost:3000"
	@echo "📖 API Docs: http://localhost:8000/api/docs/"

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Follow logs for all services
	docker-compose logs -f

logs-backend: ## Follow backend logs
	docker-compose logs -f backend

logs-celery: ## Follow celery logs
	docker-compose logs -f celery

shell-backend: ## Open Django shell
	docker-compose exec backend python manage.py shell

shell-db: ## Open psql shell
	docker-compose exec db psql -U hasaad -d hasaad_db

migrate: ## Run Django migrations
	docker-compose exec backend python manage.py migrate

makemigrations: ## Create new migrations
	docker-compose exec backend python manage.py makemigrations

seed: ## Load sample data
	docker-compose exec backend python manage.py seed_data

createsuperuser: ## Create Django superuser
	docker-compose exec backend python manage.py createsuperuser

collectstatic: ## Collect static files
	docker-compose exec backend python manage.py collectstatic --noinput

test: ## Run backend tests
	docker-compose exec backend pytest -v --tb=short

lint: ## Run linters (flake8, isort check)
	docker-compose exec backend flake8 .
	docker-compose exec backend isort --check-only .

format: ## Auto-format code (black, isort)
	docker-compose exec backend black .
	docker-compose exec backend isort .

# ---- Local dev without Docker ----
local-backend: ## Run backend locally (requires venv active)
	cd backend && python manage.py runserver 0.0.0.0:8000

local-frontend: ## Run frontend locally
	cd frontend && npm run dev

local-install-backend: ## Install backend deps locally
	cd backend && pip install -r requirements.txt

local-install-frontend: ## Install frontend deps locally
	cd frontend && npm install

local-migrate: ## Run migrations locally
	cd backend && python manage.py migrate

local-seed: ## Seed data locally
	cd backend && python manage.py seed_data

local-test: ## Run tests locally
	cd backend && pytest -v --tb=short
