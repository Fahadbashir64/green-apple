import { pool } from "../db.js";

async function healthCheck(_req, res) {
  await pool.query("SELECT 1");
  res.json({ status: "ok" });
}

export { healthCheck };
