# Deploy Green Apple on cPanel

## Recommended: single Node app (`greensapples.de`)

One **Setup Node.js App** serves **Angular + API + uploads + Socket.IO**:

| URL | Served by |
|-----|-----------|
| `https://greensapples.de/` | Angular (`backend/public/`) |
| `https://greensapples.de/api/*` | Express API |
| `https://greensapples.de/uploads/*` | Uploaded images |

**cPanel settings:**

| Field | Value |
|-------|--------|
| Application URL | `greensapples.de` (root, **not** `/api`) |
| Application root | `/home/greensap/backend` |
| Startup file | `server.js` |

**Environment variables:**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://greensapples.de,https://www.greensapples.de` |
| `JWT_SECRET` | long random string |
| `DATABASE_URL` or `MYSQL_*` | your DB |
| `SOCKET_PATH` | `/socket.io` |

Do **not** set `API_ROUTE_PREFIX=/` (default `/api` is correct for root app URL).  
Do **not** set `PORT=` in `.env`.

**Deploy steps (on your PC):**

```bash
cd frontend && npm install && npm run build
cd ../backend && npm run build:web
```

Upload the whole `backend/` folder (including `public/` with `index.html`). On server: `npm install --production`, `npm run db:init`, then **Restart** in cPanel.

**`public_html`:** Remove old Angular files and **do not** put SPA `.htaccess` rewrite rules there — only Passenger’s block (cPanel writes this when Application URL is the domain root). Delete `public_html/api/` if you previously used a path-based Node app.

**Test:**

- `https://greensapples.de/` — menu  
- `https://greensapples.de/api/health` — `{"status":"ok"}`  
- `https://greensapples.de/api/live` — `{"status":"live"}`  

---

## Alternative layouts

| Layout | Frontend | API |
|--------|----------|-----|
| **Single Node (above)** | `backend/public/` via Express | `/api` on same domain |
| **Split (legacy)** | `public_html/` static | subdomain `api.` or path `/api` |

### Path-based API only (`yourdomain.com/api`)

### Path-based API (`greensapples.de/api`)

If **Application URL** in cPanel is `yourdomain.com/api` (not a subdomain), Passenger already serves your app under `/api`. You must:

| cPanel environment variable | Value |
|----------------------------|--------|
| `API_ROUTE_PREFIX` | `/` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://greensapples.de,https://www.greensapples.de` |
| `JWT_SECRET` | long random string |
| `MYSQL_*` or `DATABASE_URL` | your cPanel MySQL credentials |

Do **not** add `PORT=` to `.env` on the server (empty `PORT` makes Node listen on port `0` → **503**).

**Startup file:** `server.js` (not `src/index.js`).

After deploy, test in order:

1. `https://yourdomain.com/api/live` → `{"status":"live",...}` (no database)
2. `https://yourdomain.com/api/health` → `{"status":"ok"}` (needs MySQL)

If `/live` works but `/health` fails → fix database credentials or run `npm run db:init`.

---

## Prerequisites

- cPanel with **Setup Node.js App** (Node **20+**)
- **MySQL** database in cPanel
- **SSH** or **Terminal** in cPanel (for `npm install` and `db:init`)
- Domain + optional subdomain for API

---

## Part 1 — MySQL database

1. cPanel → **MySQL® Databases**
2. Create database, e.g. `cpaneluser_green_apple`
3. Create user + password, **add user to database** with **ALL PRIVILEGES**
4. Note:
   - Host: usually `localhost`
   - Name: `cpaneluser_green_apple`
   - User: `cpaneluser_dbuser`

Connection string for `.env`:

```env
DATABASE_URL=mysql://cpaneluser_dbuser:YOUR_PASSWORD@localhost:3306/cpaneluser_green_apple
```

---

## Part 2 — Backend (Node.js API)

### 2.1 Upload files

Upload the **`backend`** folder to the server, e.g.:

`~/green-apple-api/`  

Do **not** upload `node_modules` — install on the server.

Required on server:

```
green-apple-api/
  server.js          ← startup file for cPanel
  package.json
  package-lock.json
  src/
  db/
  scripts/
  uploads/             ← create empty folder; must be writable
```

### 2.2 Create Node.js application

1. cPanel → **Setup Node.js App** → **Create Application**
2. Settings:
   - **Node.js version:** 20.x (or latest LTS)
   - **Application mode:** Production
   - **Application root:** path to backend folder (e.g. `green-apple-api`)
   - **Application URL:** subdomain for API (e.g. `api.yourdomain.com`)
   - **Application startup file:** `server.js`
3. Click **Create**

### 2.3 Environment variables

In the same Node.js app screen → **Environment variables**, add:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | long random string |
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/dbname` |
| `CORS_ORIGIN` | `https://yourdomain.com,https://www.yourdomain.com` |

Leave **`PORT` empty** — cPanel sets it automatically.

Optional:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_API_URL` | `https://api.yourdomain.com` if you need absolute URLs |

Do **not** put frontend `qzTray` settings here — those belong in Angular `environment.production.ts`.

### 2.4 Install dependencies & database

Open **Terminal** (SSH) and run:

```bash
cd ~/green-apple-api
npm install --production
npm run db:init
```

Optional seeds:

```bash
npm run db:migrate:sub-admin
npm run db:seed:brochure
```

Ensure uploads folder is writable:

```bash
chmod 755 uploads
```

### 2.5 Start / restart app

In **Setup Node.js App** → click **Restart** (or **Run NPM Install** then **Restart**).

Test:

```bash
curl https://api.yourdomain.com/api/health
```

You should get a healthy JSON response.

### 2.6 Default logins (after db:init)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@greenapple.local` | `Admin@123` |
| Sub-admin | `subadmin@greenapple.local` | `SubAdmin@123` (run `npm run db:migrate:sub-admin` if missing) |

Change these passwords after first login in production.

---

## Part 3 — Frontend (Angular)

### 3.1 Set production URLs (on your PC)

Edit `frontend/src/environments/environment.production.ts`:

```ts
apiUrl: 'https://api.yourdomain.com/api',
mediaOrigin: 'https://api.yourdomain.com',
socketUrl: 'https://api.yourdomain.com',
```

### 3.2 Build

On your computer:

```bash
cd frontend
npm install
npm run build
```

Output folder (upload **contents** of this folder):

`frontend/dist/frontend/browser/`

The build includes `.htaccess` from `frontend/public/` for Angular routes.

### 3.3 Upload to `public_html`

1. cPanel → **File Manager** → `public_html`
2. Delete old site files if replacing (keep `.well-known` if you use SSL)
3. Upload **everything inside** `dist/frontend/browser/` into `public_html/`
4. Confirm `.htaccess` is present (show hidden files)

### 3.4 SSL

cPanel → **SSL/TLS Status** → run **AutoSSL** for main domain and API subdomain.

---

## Part 4 — Verify

1. Open `https://yourdomain.com` — menu loads  
2. Register / login  
3. Add to cart → checkout  
4. Sub-admin: login at `/login`, orders update in real time (Socket.IO on API domain)

If API calls fail, check browser **Network** tab:

- Wrong `apiUrl` in production build  
- `CORS_ORIGIN` missing your frontend URL  
- Node app not running — restart in cPanel  

---

## Updating after changes

**API:** upload changed `src/` files → Terminal: `npm install` if `package.json` changed → **Restart** Node app  

**Frontend:** rebuild locally → re-upload `dist/frontend/browser/*` to `public_html`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 503 on API | App not reachable by Passenger: remove `PORT=` from `.env`; set startup file to `server.js`; run **Run NPM Install** then **Restart**; open **stderr** log in Node.js app screen |
| 503 but cPanel shows “started” | Process crashed after start — check stderr for `EADDRINUSE`, missing `node_modules`, or DB URL errors |
| 404 on `/api/health` | App URL is `/api` but `API_ROUTE_PREFIX` is still `/api` → set `API_ROUTE_PREFIX=/` |
| `/api/live` OK, `/api/health` 500 | MySQL credentials or `npm run db:init` |
| CORS error | Add exact frontend URL to `CORS_ORIGIN` (with `https://`, no trailing slash) |
| DB connection failed | Check `DATABASE_URL` user, password, database name; user must have privileges |
| Angular 404 on refresh | `.htaccess` missing in `public_html` or `mod_rewrite` off |
| Upload images 404 | Ensure `uploads/` exists and API serves `/uploads`; URL uses `mediaOrigin` |
| Socket not connecting | `socketUrl` must be API origin; host must allow WebSockets on subdomain |

---

## Folder reference (this repo)

```
green-apple/
  backend/          → Node API (cPanel Node.js app)
  frontend/         → Angular (build → public_html)
  docs/DEPLOY-CPANEL.md
```
