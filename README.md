# green-apple

## Apps

- `frontend` - Angular client
- `backend` - Node.js + MySQL API

## Deploy on cPanel

See **[docs/DEPLOY-CPANEL.md](docs/DEPLOY-CPANEL.md)** for step-by-step hosting instructions.

## Quick Start

### Frontend

- `cd frontend`
- `npm install`
- `npm start`

### Backend

- `cd backend`
- `npm install`
- copy `.env.example` to `.env`
- ensure MySQL is running and database exists
- `npm run db:init`
- `npm run dev`