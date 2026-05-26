import { pool } from "../src/db.js";

async function run() {
  const columns = [
    ["orders", "paypal_order_id", "VARCHAR(64) NULL"],
    ["orders", "paypal_capture_id", "VARCHAR(64) NULL"],
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
      console.log(`Added ${table}.${column}`);
    }
  }

  console.log("PayPal order columns ensured.");
}

run()
  .catch((error) => {
    console.error("Failed to migrate PayPal columns:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
