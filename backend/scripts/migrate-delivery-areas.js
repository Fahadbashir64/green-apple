import { pool } from "../src/db.js";

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS delivery_areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      city VARCHAR(80) NOT NULL,
      area VARCHAR(120) NOT NULL,
      charge DECIMAL(10, 2) NOT NULL CHECK (charge >= 0),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_delivery_areas_city_area (city, area)
    )
  `);

  const columns = [
    ["orders", "delivery_area_id", "INT NULL"],
    ["orders", "delivery_city", "VARCHAR(80)"],
    ["orders", "delivery_area", "VARCHAR(120)"]
  ];

  for (const [table, column, definition] of columns) {
    const exists = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = $1 AND COLUMN_NAME = $2`,
      [table, column]
    );
    if (Number(exists.rows[0]?.cnt) === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

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
