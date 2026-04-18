# 🌾 حصاد الذكي — Smart Hasaad

> **Palestinian Smart Agricultural Marketplace**
> Connecting farmers directly to consumers with fair prices, real-time tracking, and digital settlement.

[![Tests](https://img.shields.io/badge/tests-32%20passing-green)](backend/tests/)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js 14 Frontend  (Arabic RTL, Tailwind, Zustand)         │
│  Port 3000                                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼───────────────────────────────────────┐
│  Django 5 + DRF Backend  (JWT Auth, Role-Based Permissions)   │
│  Port 8000                                                    │
│  ┌─────────────┐ ┌────────────┐ ┌──────────────┐             │
│  │  REST API   │ │  Channels  │ │  Celery      │             │
│  │  /api/v1/   │ │  /ws/      │ │  (async jobs)│             │
│  └─────────────┘ └────────────┘ └──────────────┘             │
└───────────────┬──────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│  Infrastructure                                               │
│  PostgreSQL 15  │  Redis 7  │  MinIO (media)                  │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repo-url> smart-hasaad
cd smart-hasaad
cp backend/.env.example backend/.env   # Edit with your values
```

### 2. Start with Docker
```bash
make up          # Start all services
make migrate     # Run migrations
make seed        # Load sample data
```

### 3. Access the App
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/api/docs/ |
| Django Admin | http://localhost:8000/admin/ |

### Sample Credentials (after `make seed`)
| Role | Phone | Password |
|------|-------|----------|
| 👑 Admin | 0599000000 | admin123456 |
| 🌾 Farmer | 0599111111 | farmer123 |
| 🛒 Buyer | 0599444444 | buyer123 |

---

## 📁 Project Structure

```
smart-hasaad/
├── backend/                    # Django 5 + DRF API
│   ├── apps/
│   │   ├── accounts/           # Custom User model, JWT auth, OTP
│   │   ├── farmers/            # Farmer profiles
│   │   ├── buyers/             # Buyer profiles
│   │   ├── catalog/            # Products & Categories
│   │   ├── inventory/          # Stock management & movements
│   │   ├── orders/             # Cart, Checkout, Order lifecycle
│   │   ├── wallets/            # Farmer wallet & ledger
│   │   ├── payments/           # Payment abstraction layer
│   │   ├── logistics/          # Delivery assignment (scaffold)
│   │   ├── notifications/      # In-app + WebSocket notifications
│   │   ├── analytics_app/      # Dashboard analytics
│   │   └── common/             # Shared models, permissions, exceptions
│   ├── config/                 # Django settings (base/dev/prod)
│   └── tests/                  # Pytest test suite (32 tests)
├── frontend/                   # Next.js 14 + TypeScript
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── marketplace/    # Product browsing
│       │   ├── cart/           # Shopping cart
│       │   ├── checkout/       # Order placement
│       │   ├── farmer/         # Farmer dashboard
│       │   └── admin/          # Admin panel
│       ├── components/         # Reusable UI components
│       ├── lib/                # API client (Axios)
│       ├── store/              # Zustand state (auth, cart)
│       └── types/              # TypeScript interfaces
├── docker-compose.yml
└── Makefile
```

---

## 🔑 Core Features

### For Farmers 🌾
- Product catalog management (image + audio description)
- Real-time order management with status workflow
- Low stock alerts
- Wallet with earnings history

### For Buyers 🛒
- Product marketplace with search & filter
- Shopping cart with multi-product support
- QR code delivery confirmation
- Order history & reviews

### For Admins 👑
- Full order management
- Farmer wallet settlements
- Analytics dashboard
- User management

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest tests/ -v          # Run all 32 tests
python -m pytest tests/test_auth.py  # Auth tests only
python -m pytest tests/test_orders.py # Order lifecycle tests
```

**Test Coverage**: Auth, Products, Cart, Checkout, Order Lifecycle, QR Delivery, Wallets

---

## 🛠️ Development Commands

```bash
make up           # Start all Docker services
make down         # Stop services
make logs         # View logs
make migrate      # Run Django migrations
make seed         # Load sample data
make test         # Run backend test suite
make shell        # Django shell
make lint         # Run linter
```

---

## 📡 API Endpoints Overview

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth/` | Register, Login, JWT, OTP |
| Catalog | `/api/v1/catalog/` | Products & Categories |
| Inventory | `/api/v1/inventory/` | Stock management |
| Orders | `/api/v1/orders/` | Cart, checkout, lifecycle |
| Wallets | `/api/v1/wallets/` | Farmer earnings |
| Notifications | `/api/v1/notifications/` | In-app messages |
| Analytics | `/api/v1/analytics/` | Dashboard data |
| WebSocket | `ws://host/ws/notifications/` | Real-time push |

Full API documentation available at `/api/docs/` (Swagger UI).

---

## ☁️ Cloud Deployment (Render + Vercel)

The repo is pre-configured for a split deploy: Django on **Render** (backend + Postgres)
and Next.js on **Vercel** (frontend).

### 1. Backend → Render

1. Push this repo to GitHub.
2. In Render Dashboard → **New → Blueprint** → pick your fork/clone.
   Render reads `render.yaml` and provisions:
   - `hasaad-backend` (web service, Python 3.11, `rootDir: backend`)
   - `hasaad-db` (managed PostgreSQL, free tier)
3. After the first build, set these env vars in the service dashboard
   (marked `sync: false` in `render.yaml`):
   - `CORS_ALLOWED_ORIGINS` = `https://<your-vercel-app>.vercel.app`
   - `CSRF_TRUSTED_ORIGINS` = `https://<your-vercel-app>.vercel.app`
   - `QR_CODE_BASE_URL` = `https://<your-vercel-app>.vercel.app/orders/confirm`
4. Redeploy. Verify: `https://<backend>.onrender.com/api/docs/`.

The build script (`backend/build.sh`) installs deps, runs `collectstatic`, and
applies migrations. Static assets are served by WhiteNoise. Celery tasks run
eagerly (in-process) when no Redis is configured — swap in a managed Redis
service later if you need a real worker and WebSocket fanout.

### 2. Frontend → Vercel

1. **New Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add env var: `NEXT_PUBLIC_API_URL = https://<backend>.onrender.com`.
4. Deploy.

`frontend/next.config.js` already allows `https://**` for remote images and
proxies `/api/*` through `NEXT_PUBLIC_API_URL` at runtime.

### 3. Create the admin user (once)

In the Render service shell:

```bash
python manage.py createsuperuser
```

---

## 🔮 Roadmap (v2)

- [ ] Voice-to-text product descriptions (Whisper API)
- [ ] Jawwal Pay digital payment integration
- [ ] Live delivery tracking (maps)
- [ ] Multi-farmer cart with order splitting
- [ ] Driver mobile app (React Native)
- [ ] SMS OTP verification
- [ ] AI product recommendations
