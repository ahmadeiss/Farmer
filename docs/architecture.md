# Smart Hasaad — Architecture Document

## System Architecture

```
                        ┌──────────────────────────┐
                        │     Next.js 14 PWA        │
                        │  Arabic RTL, Tailwind      │
                        │  React Query + Zustand     │
                        └────────┬─────────┬─────────┘
                                 │ REST    │ WebSocket
                        ┌────────▼─────────▼─────────┐
                        │  Django 5 (ASGI/Daphne)     │
                        │  DRF + Channels + Celery    │
                        └────┬──────────┬─────────────┘
                             │          │
                    ┌────────▼──┐  ┌────▼────────┐
                    │ PostgreSQL │  │    Redis     │
                    │ (Primary  │  │ (Cache +     │
                    │  DB)      │  │  Channels +  │
                    └───────────┘  │  Celery)     │
                                   └─────────────-┘
```

## Backend Apps

### `accounts` — Identity & Auth
- Custom `User` model (phone-based, roles: farmer/buyer/admin/driver)
- JWT authentication via `djangorestframework-simplejwt`
- OTP verification scaffold
- Django signals auto-create profiles on user creation

### `farmers` — Farmer Profiles
- `FarmerProfile` 1:1 with User
- Governorate, city, farm name, GPS coordinates (scaffold)
- Admin approval workflow

### `buyers` — Buyer Profiles
- `BuyerProfile` 1:1 with User
- Default delivery address

### `catalog` — Product Catalog
- `Category` (hierarchical, with icons)
- `Product` with image, audio, price, unit, harvest date
- AI transcription hook (Whisper-ready)
- Featured products, low-stock detection

### `inventory` — Stock Management
- `InventoryMovement` ledger (immutable audit trail)
- `InventoryService`: reserve/release/sell/restock
- Low stock detection and alerts

### `orders` — Order Lifecycle
```
pending → confirmed → preparing → ready_for_pickup → out_for_delivery → delivered
    ↓                                                                       ↑
cancelled                                                           QR scan confirms
```
- `Cart` + `CartItem` per buyer
- `Order` + `OrderItem` with price snapshots
- QR token for delivery confirmation
- `CartService`, `OrderService` — all business logic here

### `wallets` — Farmer Earnings
- `Wallet` (current balance per farmer)
- `WalletLedger` (immutable, double-entry inspired)
- Credited on QR delivery confirmation
- Admin settles via cash settlement API

### `payments` — Payment Abstraction
- Currently: Cash on delivery only
- `PaymentTransaction` model ready for digital providers
- Add Jawwal Pay: implement new provider class, no model changes needed

### `notifications` — Real-time Alerts
- `Notification` model (persistent)
- `NotificationConsumer` — WebSocket via Django Channels
- `NotificationService` — creates DB record + pushes to WS group
- Celery tasks for async delivery

### `analytics_app` — Dashboard
- Aggregated metrics via Django ORM
- Cached with Redis (5-minute TTL)
- Top products, top farmers, revenue trend, order breakdown

### `logistics` — Delivery (Scaffold)
- `DeliveryAssignment` model
- Ready for driver app integration in v2

---

## Frontend Architecture

### Page Structure
```
src/app/
├── page.tsx              # Landing page
├── marketplace/          # Product catalog (public)
│   └── [id]/             # Product detail
├── login/                # Phone + password auth
├── register/             # Role selection + registration
├── cart/                 # Buyer cart
├── checkout/             # Place order
├── orders/               # Buyer order history
├── notifications/        # In-app notifications
├── farmer/               # Protected: role=farmer
│   ├── dashboard/        # Stats + quick actions
│   ├── products/         # Product management
│   ├── orders/           # Order management + status updates
│   ├── inventory/        # Stock management
│   └── wallet/           # Earnings ledger
└── admin/                # Protected: role=admin
    ├── dashboard/         # Platform stats
    ├── orders/            # All orders management
    ├── wallets/           # Cash settlement
    └── analytics/         # Charts + metrics
```

### State Management
- **Zustand**: Auth state (user, tokens, role), cart badge count
- **React Query**: Server state (products, orders, wallet, etc.)
- **localStorage**: JWT tokens (synced with Zustand persist)

### API Client
- Single Axios instance (`src/lib/api.ts`)
- Request interceptor: auto-attach JWT
- Response interceptor: auto-refresh token on 401
- Organized API functions by domain

---

## Security Model

### Authentication
- JWT (access 15min, refresh 7 days)
- Phone-number based (no email required)

### Authorization (Role-Based)
```python
IsBuyer       → user.role == "buyer"
IsFarmer      → user.role == "farmer"
IsAdmin       → user.is_staff (superuser)
IsFarmerOrAdmin → farmer or admin
```

### Data Isolation
- Farmers only see their own products/orders/wallet
- Buyers only see their own cart/orders
- All mutations go through service layer with validation

---

## Key Design Decisions

1. **Service Layer**: All business logic in `*Service` classes, not in views.
2. **Immutable Ledgers**: `InventoryMovement` and `WalletLedger` are append-only.
3. **Price Snapshots**: `OrderItem.unit_price` is snapshot at order time.
4. **QR Confirmation**: Delivery confirmed via UUID token scan, not admin click.
5. **Cash-First**: Payment is cash-on-delivery; digital payments are architected but not implemented.
6. **Channels over Polling**: WebSocket for real-time notifications vs. constant API polling.
