import { pool } from "../../../db.js";

const AREA_SELECT = `id, city, area, charge, is_active AS "isActive", created_at AS "createdAt"`;

async function ensureDeliveryAreasTable() {
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
}

async function listDeliveryAreas({ activeOnly = false } = {}) {
  const where = activeOnly ? "WHERE is_active = TRUE" : "";
  const result = await pool.query(
    `SELECT ${AREA_SELECT} FROM delivery_areas ${where} ORDER BY city ASC, area ASC`
  );
  return result.rows.map((row) => ({
    ...row,
    charge: Number(row.charge) || 0
  }));
}

async function getDeliveryAreaById(id) {
  const result = await pool.query(
    `SELECT ${AREA_SELECT} FROM delivery_areas WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return { ...row, charge: Number(row.charge) || 0 };
}

async function createDeliveryArea({ city, area, charge, isActive = true }) {
  const result = await pool.query(
    `INSERT INTO delivery_areas (city, area, charge, is_active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (city, area) DO UPDATE
       SET charge = EXCLUDED.charge,
           is_active = EXCLUDED.is_active
     RETURNING ${AREA_SELECT}`,
    [city, area, charge, isActive]
  );
  const row = result.rows[0];
  return { ...row, charge: Number(row.charge) || 0 };
}

async function updateDeliveryArea(id, patch) {
  const fields = [];
  const values = [];
  let idx = 1;
  if (patch.city !== undefined) {
    fields.push(`city = $${idx++}`);
    values.push(patch.city);
  }
  if (patch.area !== undefined) {
    fields.push(`area = $${idx++}`);
    values.push(patch.area);
  }
  if (patch.charge !== undefined) {
    fields.push(`charge = $${idx++}`);
    values.push(patch.charge);
  }
  if (patch.isActive !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(patch.isActive);
  }
  if (fields.length === 0) {
    return getDeliveryAreaById(id);
  }
  values.push(id);
  const result = await pool.query(
    `UPDATE delivery_areas SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${AREA_SELECT}`,
    values
  );
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  return { ...row, charge: Number(row.charge) || 0 };
}

async function deleteDeliveryArea(id) {
  const result = await pool.query("DELETE FROM delivery_areas WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

export {
  createDeliveryArea,
  deleteDeliveryArea,
  ensureDeliveryAreasTable,
  getDeliveryAreaById,
  listDeliveryAreas,
  updateDeliveryArea
};
