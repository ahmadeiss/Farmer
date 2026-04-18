# Smart Hasaad — API Reference

> Base URL: `http://localhost:8000/api/v1`
> Interactive Docs: `http://localhost:8000/api/docs/`
> Auth: Bearer JWT in Authorization header

---

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register/` | Public | Register farmer/buyer |
| POST | `/auth/login/` | Public | Login, get tokens |
| POST | `/auth/logout/` | JWT | Logout (blacklist refresh) |
| GET | `/auth/profile/` | JWT | Get current user |
| PATCH | `/auth/profile/` | JWT | Update profile |
| POST | `/auth/token/refresh/` | Public | Refresh access token |
| POST | `/auth/change-password/` | JWT | Change password |
| POST | `/auth/otp/request/` | Public | Request OTP |
| POST | `/auth/otp/verify/` | Public | Verify OTP |

---

## Catalog Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/catalog/categories/` | Public | List categories |
| GET | `/catalog/products/` | Public | List active products |
| GET | `/catalog/products/{id}/` | Public | Product detail |
| GET | `/catalog/my-products/` | Farmer | My products |
| POST | `/catalog/my-products/` | Farmer | Create product |
| PATCH | `/catalog/my-products/{id}/` | Farmer | Update product |
| DELETE | `/catalog/my-products/{id}/` | Farmer | Delete product |
| GET | `/catalog/my-products/low-stock/` | Farmer | Low stock alert |

### Query Params for `/catalog/products/`
- `search`: text search in title/description
- `category_slug`: filter by category
- `ordering`: price, -price, -created_at
- `in_stock`: true/false
- `is_featured`: true/false
- `farmer_id`: filter by farmer

---

## Orders Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders/cart/` | Buyer | Get cart |
| POST | `/orders/cart/add/` | Buyer | Add item to cart |
| DELETE | `/orders/cart/remove/{product_id}/` | Buyer | Remove item |
| DELETE | `/orders/cart/clear/` | Buyer | Empty cart |
| POST | `/orders/checkout/` | Buyer | Place order |
| GET | `/orders/my-orders/` | Buyer | My orders |
| GET | `/orders/my-orders/{id}/` | Buyer | Order detail |
| GET | `/orders/farmer-orders/` | Farmer | Incoming orders |
| PATCH | `/orders/farmer-orders/{id}/status/` | Farmer | Update status |
| POST | `/orders/confirm-qr/{qr_token}/` | JWT | Confirm delivery |
| POST | `/orders/reviews/` | Buyer | Submit review |

### Order Status Flow
```
pending → confirmed → preparing → ready_for_pickup → out_for_delivery → delivered
                                                                              ↑
                                                                 QR scan required
```

---

## Wallets Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallets/my-wallet/` | Farmer | My wallet balance |
| GET | `/wallets/my-wallet/ledger/` | Farmer | Transaction history |
| GET | `/wallets/admin/wallets/` | Admin | All farmer wallets |
| GET | `/wallets/admin/wallets/{id}/ledger/` | Admin | Farmer ledger |
| POST | `/wallets/admin/wallets/{id}/settle/` | Admin | Mark settled |

---

## Analytics Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/dashboard/` | Admin | Platform summary |
| GET | `/analytics/top-products/` | Admin | Best sellers |
| GET | `/analytics/top-farmers/` | Admin | Top earners |
| GET | `/analytics/orders-by-status/` | Admin | Status breakdown |
| GET | `/analytics/revenue-trend/?days=30` | Admin | Daily revenue |
| GET | `/analytics/low-stock/` | Admin | Low stock alert |
| GET | `/analytics/categories/` | Admin | Sales by category |
| GET | `/analytics/farmer-summary/` | Farmer | My stats |

---

## Notifications Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/` | JWT | My notifications |
| GET | `/notifications/unread-count/` | JWT | Badge count |
| POST | `/notifications/mark-all-read/` | JWT | Mark all read |
| POST | `/notifications/{id}/mark-read/` | JWT | Mark one read |

### WebSocket
```
ws://localhost:8000/ws/notifications/
Authorization: Bearer <token>  (query param or header)
```

Client messages:
```json
{"action": "mark_read", "notification_id": 42}
{"action": "mark_all_read"}
```

Server events:
```json
{"type": "notification", "notification": {...}}
{"type": "connected", "unread_count": 5}
{"type": "marked_read", "notification_id": 42}
```

---

## Common Response Formats

### Success (paginated list)
```json
{
  "count": 100,
  "next": "http://...?page=2",
  "previous": null,
  "total_pages": 10,
  "current_page": 1,
  "results": [...]
}
```

### Error
```json
{
  "error": "هذا المنتج نفد من المخزون.",
  "code": "out_of_stock"
}
```

### Validation Error (400)
```json
{
  "phone": ["رقم الهاتف مستخدم بالفعل."],
  "password": ["كلمة المرور يجب أن تكون 8 أحرف على الأقل."]
}
```
