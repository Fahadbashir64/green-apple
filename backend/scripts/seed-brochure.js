import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureSupportColumns() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS menu_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function run() {
  await ensureSupportColumns();

  const seedPath = path.resolve(__dirname, "../db/seed-brochure.sql");
  const sql = await fs.readFile(seedPath, "utf8");
  await pool.query(sql);

  const { MENU_ITEM_ALLERGENS } = await import("../data/menu-allergens.js");
  let allergenUpdates = 0;
  for (const [code, allergens] of Object.entries(MENU_ITEM_ALLERGENS)) {
    const value = allergens?.trim() || null;
    const result = await pool.query("UPDATE menu_items SET allergens = $1 WHERE code = $2", [value, code]);
    allergenUpdates += result.rowCount ?? 0;
  }

  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM menu_items
     WHERE code LIKE 'pz-%' OR code LIKE 'cz-%' OR code LIKE 'bg-%'
        OR code LIKE 'su-%' OR code LIKE 'dn-%' OR code LIKE 'lm-%'
        OR code LIKE 'pd-%' OR code LIKE 'kl-%' OR code LIKE 'sp-%'
        OR code LIKE 'nt-%' OR code LIKE 'sc-%' OR code LIKE 'dr-%'`
  );
  console.log(`Brochure menu loaded. Brochure-coded rows in menu_items: ${rows[0].total}`);
  console.log(`Allergen codes applied to ${allergenUpdates} menu item(s).`);
}

run()
  .catch((error) => {
    console.error("Failed to seed brochure menu:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
