/**
 * Adds pizza size price columns to menu_items (safe to run multiple times).
 * Run: npm run db:migrate:menu-prices
 */
import "dotenv/config";
import { pool } from "../src/db.js";

const statements = [
  "ALTER TABLE menu_items ADD COLUMN price_medium DECIMAL(10, 2)",
  "ALTER TABLE menu_items ADD COLUMN price_large DECIMAL(10, 2)",
  "ALTER TABLE menu_items ADD COLUMN price_xlarge DECIMAL(10, 2)"
];

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
  for (const sql of statements) {
    const column = sql.match(/ADD COLUMN (\w+)/i)?.[1];
    if (column && (await columnExists("menu_items", column))) {
      continue;
    }
    try {
      await pool.query(sql);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }
  }
  console.log("menu_items price columns are present (price_medium, price_large, price_xlarge).");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
