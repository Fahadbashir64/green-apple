import { pool } from "../../../db.js";
import { resolveMenuItemAllergens } from "../../../../data/menu-allergens.js";

const MENU_ITEM_SELECT = `id, code, name, description, category, price,
    price_medium AS priceMedium, price_large AS priceLarge, price_xlarge AS priceXlarge,
    image_url AS imageUrl, is_bestseller AS isBestseller, allergens`;

function withResolvedAllergens(row) {
  return { ...row, allergens: resolveMenuItemAllergens(row) };
}

async function getMenuItems() {
  const result = await pool.query(
    `SELECT ${MENU_ITEM_SELECT} FROM menu_items WHERE is_active = TRUE
     ORDER BY is_bestseller DESC, id`
  );
  return result.rows.map(withResolvedAllergens);
}

async function getAdminMenuItems() {
  const result = await pool.query(
    `SELECT ${MENU_ITEM_SELECT}, is_active AS isActive FROM menu_items ORDER BY category, id`
  );
  return result.rows.map(withResolvedAllergens);
}

async function getMenuCategories() {
  const result = await pool.query(`
    SELECT category
    FROM (
      SELECT LOWER(TRIM(name)) AS category, created_at AS sort_ts
      FROM menu_categories
      UNION
      SELECT LOWER(TRIM(category)) AS category, MIN(created_at) AS sort_ts
      FROM menu_items
      GROUP BY LOWER(TRIM(category))
    ) AS all_cats
    WHERE category IS NOT NULL AND category != ''
    ORDER BY (category = 'pizza') DESC,
      (category = 'drinks') ASC,
      sort_ts ASC,
      category ASC
  `);
  return result.rows.map((row) => row.category);
}

async function createMenuCategory(name) {
  await pool.query("INSERT INTO menu_categories (name) VALUES ($1) ON DUPLICATE KEY UPDATE name = name", [name]);
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
    await client.query("START TRANSACTION");
    await client.query("INSERT INTO menu_categories (name) VALUES ('uncategorized') ON DUPLICATE KEY UPDATE name = name");
    const reassigned = await client.query("UPDATE menu_items SET category = 'uncategorized' WHERE category = $1", [target]);
    const deleted = await client.query("DELETE FROM menu_categories WHERE name = $1", [target]);
    await client.query("COMMIT");
    return { deleted: deleted.rowCount > 0, reassignedCount: reassigned.rowCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getMenuItemById(id) {
  const result = await pool.query(
    `SELECT ${MENU_ITEM_SELECT}, is_active AS isActive FROM menu_items WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? withResolvedAllergens(result.rows[0]) : null;
}

async function createMenuItem(payload) {
  const insert = await pool.query(
    `INSERT INTO menu_items (code, name, description, category, price, price_medium, price_large, price_xlarge, image_url, is_active, is_bestseller)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)`,
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
      Boolean(payload.isBestseller)
    ]
  );
  return getMenuItemById(insert.insertId);
}

async function updateMenuItem(id, payload) {
  const updated = await pool.query(
    `UPDATE menu_items
     SET code = $1, name = $2, description = $3, category = $4, price = $5,
         price_medium = $6, price_large = $7, price_xlarge = $8,
         image_url = $9, is_active = $10, is_bestseller = $11
     WHERE id = $12`,
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
      Boolean(payload.isBestseller),
      id
    ]
  );
  if (updated.rowCount === 0) {
    return null;
  }
  return getMenuItemById(id);
}

async function deleteMenuItem(id) {
  const result = await pool.query("DELETE FROM menu_items WHERE id = $1", [id]);
  return result.rowCount > 0;
}

async function ensureMenuCategoryTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS menu_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
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
