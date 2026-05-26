/**
 * Clear legacy /assets/images/... paths from menu_items.image_url.
 * Run: npm run db:migrate:clear-asset-images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const sqlPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../db/migrate-clear-asset-image-urls.sql"
);

async function main() {
  const sql = fs.readFileSync(sqlPath, "utf8");
  const result = await pool.query(sql);
  console.log(`Cleared static asset image URLs (${result.rowCount ?? 0} row(s) affected).`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
