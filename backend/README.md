# Green Apple Backend

Node.js + Express + PostgreSQL backend for the Green Apple app.

## Setup

1. Copy `.env.example` to `.env` and update values.
2. Create PostgreSQL database `green_apple` (or update `DATABASE_URL`).
3. Install dependencies:
   - `npm install`
4. Initialize database schema + seed:
   - `npm run db:init`
5. Run backend:
   - `npm run dev`

## API Endpoints

- `GET /api/health` - health check
- `GET /api/menu-items` - menu catalog
- `POST /api/auth/register` - create user
- `POST /api/auth/login` - login and get JWT token
- `GET /api/orders/me` - user orders (auth required)
- `POST /api/orders` - place order (auth required)
- `PATCH /api/orders/:id/status` - update status (admin usage)

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
