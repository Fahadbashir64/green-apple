import { pool } from "../../../db.js";

const MENU_ITEM_SELECT = `id, code, name, description, category, price,
    price_medium AS "priceMedium", price_large AS "priceLarge", price_xlarge AS "priceXlarge",
    image_url AS "imageUrl"`;

async function getMenuItems() {
  const result = await pool.query(
    `SELECT ${MENU_ITEM_SELECT} FROM menu_items WHERE is_active = TRUE ORDER BY id`
  );
  return result.rows;
}

async function getAdminMenuItems() {
  const result = await pool.query(
    `SELECT ${MENU_ITEM_SELECT}, is_active AS "isActive" FROM menu_items ORDER BY category, id`
  );
  return result.rows;
}

async function getMenuCategories() {
  const result = await pool.query(`
    WITH item_cats AS (
      SELECT LOWER(TRIM(category)) AS cat, MIN(created_at) AS item_ts
      FROM menu_items
      GROUP BY LOWER(TRIM(category))
    ),
    table_cats AS (
      SELECT LOWER(TRIM(name)) AS cat, created_at AS table_ts
      FROM menu_categories
    ),
    all_cats AS (
      SELECT COALESCE(t.cat, i.cat) AS category,
        COALESCE(t.table_ts, i.item_ts) AS sort_ts
      FROM table_cats t
      FULL OUTER JOIN item_cats i ON t.cat = i.cat
    )
    SELECT category
    FROM all_cats
    WHERE category IS NOT NULL AND category != ''
    ORDER BY (category = 'pizza') DESC,
      (category = 'drinks') ASC,
      sort_ts ASC NULLS LAST,
      category ASC
  `);
  return result.rows.map((row) => row.category);
}

async function createMenuCategory(name) {
  await pool.query("INSERT INTO menu_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
  return { name };
}

async function deleteMenuCategory(name) {
  const target = String(name || "").trim().toLowerCase();
  if (!target || target === "uncategorized") {
    return { deleted: false, reassignedCount: 0 };
  }

  await ensureMenuCategoryTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO menu_categories (name) VALUES ('uncategorized') ON CONFLICT (name) DO NOTHING");
    const reassigned = await client.query("UPDATE menu_items SET category = 'uncategorized' WHERE category = $1", [target]);
    const deleted = await client.query("DELETE FROM menu_categories WHERE name = $1 RETURNING id", [target]);
    await client.query("COMMIT");
    return { deleted: deleted.rowCount > 0, reassignedCount: reassigned.rowCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createMenuItem(payload) {
  const result = await pool.query(
    `INSERT INTO menu_items (code, name, description, category, price, price_medium, price_large, price_xlarge, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
     RETURNING ${MENU_ITEM_SELECT}, is_active AS "isActive"`,
    [
      payload.code,
      payload.name,
      payload.description,
      payload.category,
      payload.price,
      payload.priceMedium ?? null,
      payload.priceLarge ?? null,
      payload.priceXlarge ?? null,
      payload.imageUrl || null
    ]
  );
  return result.rows[0];
}

async function updateMenuItem(id, payload) {
  const result = await pool.query(
    `UPDATE menu_items
     SET code = $1, name = $2, description = $3, category = $4, price = $5,
         price_medium = $6, price_large = $7, price_xlarge = $8,
         image_url = $9, is_active = $10
     WHERE id = $11
     RETURNING ${MENU_ITEM_SELECT}, is_active AS "isActive"`,
    [
      payload.code,
      payload.name,
      payload.description,
      payload.category,
      payload.price,
      payload.priceMedium ?? null,
      payload.priceLarge ?? null,
      payload.priceXlarge ?? null,
      payload.imageUrl || null,
      payload.isActive,
      id
    ]
  );
  return result.rows[0] || null;
}

async function deleteMenuItem(id) {
  const result = await pool.query("DELETE FROM menu_items WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

async function ensureMenuCategoryTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS menu_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
  );
  await pool.query(
    "ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  );
  await pool.query(
    "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
  );
}

export {
  createMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  deleteMenuItem,
  ensureMenuCategoryTable,
  getAdminMenuItems,
  getMenuCategories,
  getMenuItems,
  updateMenuItem
};
