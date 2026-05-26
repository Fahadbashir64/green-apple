import "dotenv/config";
import { pool } from "../src/db.js";

async function addColumnIfMissing(table, column, definition) {
  const exists = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = $1 AND COLUMN_NAME = $2`,
    [table, column]
  );
  if (Number(exists.rows[0]?.cnt) > 0) {
    return;
  }
  await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function run() {
  await addColumnIfMissing("menu_categories", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addColumnIfMissing("menu_items", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  console.log("Category/menu item created_at columns ensured.");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
