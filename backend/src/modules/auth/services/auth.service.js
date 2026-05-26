import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { config } from "../../../config.js";
import { pool } from "../../../db.js";

async function registerUser({ fullName, email, phone, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, 'customer')",
    [fullName, email.toLowerCase(), phone, passwordHash]
  );
  const profile = await pool.query(
    "SELECT id, full_name AS fullName, email, phone, role FROM users WHERE id = $1",
    [insert.insertId]
  );
  return profile.rows[0];
}

async function loginUser({ email, password }) {
  const result = await pool.query(
    "SELECT id, full_name AS fullName, email, phone, role, password_hash AS passwordHash FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (result.rowCount === 0) {
    return null;
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, fullName: user.fullName, role: user.role },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

  return { token, user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone || "", role: user.role } };
}

async function getUserProfile(userId) {
  const result = await pool.query(
    "SELECT id, full_name AS fullName, email, phone, role FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

export { registerUser, loginUser, getUserProfile };
