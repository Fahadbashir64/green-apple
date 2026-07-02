/**
 * Adds is_bestseller flag to menu_items (safe to run multiple times).
 * Run: npm run db:migrate:bestseller
 */
import "dotenv/config";
import { pool } from "../src/db.js";

async function columnExists(table, column) {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = $1 AND COLUMN_NAME = $2`,
    [table, column]
  );
  return Number(result.rows[0]?.cnt) > 0;
}

async function run() {
  if (!(await columnExists("menu_items", "is_bestseller"))) {
    await pool.query(
      "ALTER TABLE menu_items ADD COLUMN is_bestseller TINYINT(1) NOT NULL DEFAULT 0"
    );
    console.log("Added menu_items.is_bestseller");
  } else {
    console.log("menu_items.is_bestseller already exists");
  }
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
