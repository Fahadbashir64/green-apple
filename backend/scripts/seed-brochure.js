import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureSupportColumns() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS menu_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
  await pool.query(
    "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_medium NUMERIC(10, 2)"
  );
  await pool.query(
    "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_large NUMERIC(10, 2)"
  );
  await pool.query(
    "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_xlarge NUMERIC(10, 2)"
  );
  await pool.query(
    "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  );
}

async function run() {
  await ensureSupportColumns();

  const seedPath = path.resolve(__dirname, "../db/seed-brochure.sql");
  const sql = await fs.readFile(seedPath, "utf8");
  await pool.query(sql);

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM menu_items
     WHERE code LIKE 'pz-%' OR code LIKE 'cz-%' OR code LIKE 'bg-%'
        OR code LIKE 'su-%' OR code LIKE 'dn-%' OR code LIKE 'lm-%'
        OR code LIKE 'pd-%' OR code LIKE 'kl-%' OR code LIKE 'sp-%'
        OR code LIKE 'nt-%' OR code LIKE 'sc-%' OR code LIKE 'dr-%'`
  );
  console.log(`Brochure menu loaded. Brochure-coded rows in menu_items: ${rows[0].total}`);
}

run()
  .catch((error) => {
    console.error("Failed to seed brochure menu:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
