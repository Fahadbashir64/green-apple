/**
 * Adds allergens column to menu_items and applies flyer codes.
 * Run: npm run db:migrate:allergens
 */
import "dotenv/config";
import { pool } from "../src/db.js";
import { MENU_ITEM_ALLERGENS } from "../data/menu-allergens.js";

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
  if (!(await columnExists("menu_items", "allergens"))) {
    await pool.query("ALTER TABLE menu_items ADD COLUMN allergens VARCHAR(120) NULL");
    console.log("Added menu_items.allergens");
  } else {
    console.log("menu_items.allergens already exists");
  }

  let updated = 0;
  for (const [code, allergens] of Object.entries(MENU_ITEM_ALLERGENS)) {
    const value = allergens?.trim() || null;
    const result = await pool.query("UPDATE menu_items SET allergens = $1 WHERE code = $2", [value, code]);
    if (result.rowCount > 0) {
      updated += result.rowCount;
    }
  }

  console.log(`Allergen codes applied to ${updated} menu item(s).`);
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
