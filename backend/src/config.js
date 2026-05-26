import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const LOCAL_DEV_ORIGINS = [
  "http://localhost:4200",
  "http://localhost:4000",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:4000",
];

function getNodeEnv() {
  return (process.env.NODE_ENV || "development").toLowerCase();
}

function isLocalEnv() {
  const env = getNodeEnv();
  return env === "local" || env === "development" || env === "dev";
}

function isProductionEnv() {
  return getNodeEnv() === "production";
}

function resolveCorsOrigins() {
  const fromEnv = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isLocalEnv()) {
    const merged = [...fromEnv, ...LOCAL_DEV_ORIGINS];
    return [...new Set(merged)];
  }

  if (fromEnv.length > 0) {
    return fromEnv;
  }
  return ["http://localhost:4200"];
}

function shouldServeFrontend(hasBuild) {
  if (process.env.SERVE_FRONTEND === "false" || !hasBuild) {
    return false;
  }
  if (process.env.SERVE_FRONTEND === "true") {
    return true;
  }
  return isProductionEnv();
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.MYSQL_HOST || "localhost";
  const port = process.env.MYSQL_PORT || "3306";
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.MYSQL_DATABASE;
  if (user && database) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
  }
  return "mysql://root:root@localhost:3306/green_apple";
}

function parsePort() {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") {
    return 4000;
  }
  const port = Number(raw);
  return Number.isFinite(port) && port > 0 ? port : 4000;
}

/**
 * API mount path inside Express.
 * - App URL `greensapples.de` (root): default `/api` → `/api/health`, static at `/`
 * - Legacy path app URL `domain/api`: set `API_ROUTE_PREFIX=/` or PassengerBaseURI `/api`
 */
function resolveApiRoutePrefix() {
  const explicit = process.env.API_ROUTE_PREFIX?.trim();
  if (explicit !== undefined && explicit !== "") {
    return explicit;
  }
  const base = (process.env.PASSENGER_BASE_URI || "").replace(/\/$/, "");
  if (base === "/api" || base.endsWith("/api")) {
    return "/";
  }
  return "/api";
}

function resolveFrontendDistPath() {
  const configured = process.env.FRONTEND_DIST_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.resolve(process.cwd(), "public");
}

function resolveSocketPath() {
  const explicit = process.env.SOCKET_PATH?.trim();
  if (explicit) {
    return explicit;
  }
  return "/socket.io";
}

const frontendDistPath = resolveFrontendDistPath();
const hasFrontendBuild = fs.existsSync(
  path.join(frontendDistPath, "index.html")
);

function resolvePayPalMode() {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live" ? "live" : "sandbox";
}

function resolvePayPalConfig() {
  const clientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();
  const enabled = Boolean(clientId && clientSecret);
  return {
    enabled,
    clientId,
    clientSecret,
    mode: resolvePayPalMode(),
    currency: (process.env.PAYPAL_CURRENCY || "EUR").toUpperCase(),
  };
}

const config = {
  port: parsePort(),
  nodeEnv: getNodeEnv(),
  isLocal: isLocalEnv(),
  isProduction: isProductionEnv(),
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  databaseUrl: buildDatabaseUrl(),
  corsOrigins: resolveCorsOrigins(),
  publicApiUrl: (process.env.PUBLIC_API_URL || "").replace(/\/$/, ""),
  apiRoutePrefix: resolveApiRoutePrefix(),
  socketPath: resolveSocketPath(),
  frontendDistPath,
  serveFrontend: shouldServeFrontend(hasFrontendBuild),
  paypal: resolvePayPalConfig(),
};

export { config };
