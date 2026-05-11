import { Router } from "express";
import { requireAdmin, requireAuth } from "../../../middleware/auth.middleware.js";
import { imageUpload } from "../../../middleware/upload.middleware.js";
import {
  listAdminMenuItems,
  listMenuCategories,
  listMenuItems,
  patchMenuItem,
  postMenuCategory,
  postMenuItem,
  removeMenuCategory,
  removeMenuItem
} from "../controllers/menu.controller.js";

const menuRouter = Router();

menuRouter.get("/", listMenuItems);
menuRouter.get("/categories", listMenuCategories);
menuRouter.get("/admin", requireAuth, requireAdmin, listAdminMenuItems);
menuRouter.post("/categories", requireAuth, requireAdmin, postMenuCategory);
menuRouter.delete("/categories/:name", requireAuth, requireAdmin, removeMenuCategory);
menuRouter.post("/", requireAuth, requireAdmin, imageUpload.single("image"), postMenuItem);
menuRouter.patch("/:id", requireAuth, requireAdmin, imageUpload.single("image"), patchMenuItem);
menuRouter.delete("/:id", requireAuth, requireAdmin, removeMenuItem);

export { menuRouter };
