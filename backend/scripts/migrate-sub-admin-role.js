import bcrypt from "bcryptjs";

import { pool } from "../src/db.js";

/**
 * Applies sub_admin role support without re-running full schema/seed.
 * Run from the backend directory: npm run db:migrate:sub-admin
 */
async function ensureDefaultSubAdmin() {
  const email = "subadmin@greenapple.local";
  const passwordHash = await bcrypt.hash("SubAdmin@123", 10);
  await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'sub_admin')
     ON DUPLICATE KEY UPDATE role = 'sub_admin'`,
    ["Sub Admin", email, "0000000000", passwordHash]
  );
}

async function run() {
  await ensureDefaultSubAdmin();
  console.log("Sub-admin role migration done: default subadmin@greenapple.local ensured.");
}

run()
  .catch((error) => {
    console.error("Sub-admin migration failed:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
