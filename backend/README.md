# Green Apple Backend

Node.js + Express + MySQL backend for the Green Apple app.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Create MySQL database `green_apple` (or update `DATABASE_URL`).
3. Install dependencies:
   - `npm install`
4. Initialize database schema + seed:
   - `npm run db:init`
5. Run backend:
   - `npm run dev`

### Production (Node serves API + Angular)

1. `cd frontend && npm run build`
2. `cd backend && npm run build:web` (copies build to `backend/public/`)
3. Deploy `backend/` to cPanel; Application URL = your domain (root), startup file `server.js`

### Local single-server (`http://localhost:4000`)

1. In `.env`: `NODE_ENV=local`, `SERVE_FRONTEND=true`
2. `npm run build:web:local` (uses `environment.ts` → `http://localhost:4000/api`)
3. `npm run dev`

Do **not** use `build:web` (production) for local — it points the UI at `greensapples.de`.

### Example MySQL database

```sql
CREATE DATABASE green_apple CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

`DATABASE_URL` format:

`mysql://USER:PASSWORD@localhost:3306/green_apple`

Requires **MySQL 8.0+** (JSON functions in order queries). Works without `RETURNING` (MariaDB / older MySQL).

## API Endpoints

- `GET /api/health` - health check
- `GET /api/menu-items` - menu catalog
- `POST /api/auth/register` - create user
- `POST /api/auth/login` - login and get JWT token
- `GET /api/orders/me` - user orders (auth required)
- `POST /api/orders` - place order (auth required, cash on delivery only)
- `GET /api/payments/paypal/config` - PayPal client config for checkout
- `POST /api/payments/paypal/create-order` - create PayPal order (auth required)
- `POST /api/payments/paypal/capture` - capture payment and create order (auth required)
- `PATCH /api/orders/:id/status` - update status (admin usage)

### PayPal Checkout

1. Create a REST app at [PayPal Developer](https://developer.paypal.com/dashboard/applications).
2. Add to `.env`: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox` (or `live`).
3. Run `npm run db:migrate:paypal` on existing databases.
4. Test with sandbox buyer accounts; switch to `live` credentials for production.

Auth endpoints return/expect JSON. For protected routes pass header:

`Authorization: Bearer <token>`

## Modular Structure

`src/`
- `modules/auth/` auth controller, service, routes, validators
- `modules/menu/` menu controller, service, routes
- `modules/orders/` orders controller, service, routes, validators
- `middleware/` auth and error middleware
- `routes/` top-level router composition
- `app.js` express app composition
- `index.js` server bootstrap
