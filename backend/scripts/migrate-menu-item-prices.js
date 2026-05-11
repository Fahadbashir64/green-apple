/**
 * Adds pizza size price columns to menu_items (safe to run multiple times).
 * Run: npm run db:migrate:menu-prices
 */
import "dotenv/config";
import { pool } from "../src/db.js";

const statements = [
  "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_medium NUMERIC(10, 2)",
  "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_large NUMERIC(10, 2)",
  "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_xlarge NUMERIC(10, 2)"
];

async function run() {
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log("menu_items price columns are present (price_medium, price_large, price_xlarge).");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
