import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

import { pool } from "../src/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const schemaPath = path.resolve(__dirname, "../db/schema.sql");
  const seedPath = path.resolve(__dirname, "../db/seed.sql");

  const schema = await fs.readFile(schemaPath, "utf8");
  const seed = await fs.readFile(seedPath, "utf8");

  await pool.query(schema);
  await pool.query(seed);
  await ensureDefaultAdmin();

  console.log("Database schema and seed applied.");
}

async function ensureDefaultAdmin() {
  const email = "admin@greenapple.local";
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    ["Admin User", email, "0000000000", passwordHash]
  );
}

run()
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
