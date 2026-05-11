import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  ensureMenuCategoryTable,
  getAdminMenuItems,
  getMenuCategories,
  getMenuItems,
  updateMenuItem
} from "../services/menu.service.js";

function optionalPrice(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function listMenuItems(_req, res) {
  const items = await getMenuItems();
  res.json(items);
}

async function listAdminMenuItems(_req, res) {
  await ensureMenuCategoryTable();
  const items = await getAdminMenuItems();
  res.json(items);
}

async function listMenuCategories(_req, res) {
  await ensureMenuCategoryTable();
  const categories = await getMenuCategories();
  res.json(categories);
}

async function postMenuCategory(req, res) {
  await ensureMenuCategoryTable();
  const name = String(req.body?.name || "").trim().toLowerCase();
  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }
  const created = await createMenuCategory(name);
  return res.status(201).json(created);
}

async function removeMenuCategory(req, res) {
  await ensureMenuCategoryTable();
  const categoryName = String(req.params.name || "").trim().toLowerCase();
  if (!categoryName) {
    return res.status(400).json({ message: "Category name is required" });
  }
  const result = await deleteMenuCategory(categoryName);
  if (!result.deleted) {
    return res.status(404).json({ message: "Category not found or cannot be deleted" });
  }
  return res.json(result);
}

async function postMenuItem(req, res) {
  const { code, name, description, category, price, imageUrl, priceMedium, priceLarge, priceXlarge } = req.body ?? {};
  const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  if (!code || !name || !description || !category || Number(price) < 0) {
    return res.status(400).json({ message: "Invalid menu item payload" });
  }
  const cat = String(category).trim().toLowerCase();
  const isPizza = cat === "pizza";
  const created = await createMenuItem({
    code: String(code).trim(),
    name: String(name).trim(),
    description: String(description).trim(),
    category: cat,
    price: Number(price),
    priceMedium: isPizza ? optionalPrice(priceMedium) : null,
    priceLarge: isPizza ? optionalPrice(priceLarge) : null,
    priceXlarge: isPizza ? optionalPrice(priceXlarge) : null,
    imageUrl: uploadedImageUrl || (imageUrl ? String(imageUrl).trim() : null)
  });
  return res.status(201).json(created);
}

async function patchMenuItem(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid item id" });
  }
  const { code, name, description, category, price, imageUrl, isActive, priceMedium, priceLarge, priceXlarge } =
    req.body ?? {};
  const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const cat = String(category || "").trim().toLowerCase();
  const isPizza = cat === "pizza";
  const updated = await updateMenuItem(id, {
    code: String(code || "").trim(),
    name: String(name || "").trim(),
    description: String(description || "").trim(),
    category: cat,
    price: Number(price),
    priceMedium: isPizza ? optionalPrice(priceMedium) : null,
    priceLarge: isPizza ? optionalPrice(priceLarge) : null,
    priceXlarge: isPizza ? optionalPrice(priceXlarge) : null,
    imageUrl: uploadedImageUrl || (imageUrl ? String(imageUrl).trim() : null),
    isActive: Boolean(isActive)
  });
  if (!updated) {
    return res.status(404).json({ message: "Menu item not found" });
  }
  return res.json(updated);
}

async function removeMenuItem(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid item id" });
  }
  const deleted = await deleteMenuItem(id);
  if (!deleted) {
    return res.status(404).json({ message: "Menu item not found" });
  }
  return res.status(204).send();
}

export {
  listAdminMenuItems,
  listMenuCategories,
  listMenuItems,
  patchMenuItem,
  postMenuCategory,
  postMenuItem,
  removeMenuCategory,
  removeMenuItem
};
