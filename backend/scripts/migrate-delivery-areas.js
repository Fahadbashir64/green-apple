import { pool } from "../src/db.js";

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS delivery_areas (
      id SERIAL PRIMARY KEY,
      city VARCHAR(80) NOT NULL,
      area VARCHAR(120) NOT NULL,
      charge NUMERIC(10, 2) NOT NULL CHECK (charge >= 0),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (city, area)
    )
  `);

  await pool.query(
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area_id INTEGER REFERENCES delivery_areas(id) ON DELETE SET NULL"
  );
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(80)");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_area VARCHAR(120)");

  console.log("Delivery areas table & order columns ensured.");
}

run()
  .catch((error) => {
    console.error("Failed to migrate delivery areas:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
