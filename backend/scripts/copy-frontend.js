/**
 * Build Angular and copy into backend/public.
 *   npm run build:web        — production (greensapples.de URLs)
 *   npm run build:web:local  — local API (localhost:4000)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isLocal = process.argv.includes("--local");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(backendRoot, "..");
const frontendDir = path.join(repoRoot, "frontend");
const src = path.join(frontendDir, "dist", "frontend", "browser");
const dest = path.join(backendRoot, "public");

const buildCmd = isLocal
  ? "npm run build -- --configuration development"
  : "npm run build";

console.log(`Building frontend (${isLocal ? "local" : "production"})…`);
execSync(buildCmd, { cwd: frontendDir, stdio: "inherit" });

if (!fs.existsSync(path.join(src, "index.html"))) {
  console.error("Frontend build not found at", src);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied ${isLocal ? "local" : "production"} build → ${dest}`);
