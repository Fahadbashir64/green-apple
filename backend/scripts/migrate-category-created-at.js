/**
 * Adds created_at to menu_categories and menu_items for category ordering.
 * Run: npm run db:migrate:category-dates
 */
import "dotenv/config";
import { pool } from "../src/db.js";

const statements = [
  "ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
  "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
];

async function run() {
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log("Category/item created_at columns ensured.");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
