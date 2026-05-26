import { Router } from "express";
import {
  createOrder,
  getAdminDeliveryAreas,
  getAllAdminOrders,
  getMinOrderPrice,
  getMyOrders,
  getPublicDeliveryAreas,
  patchDeliveryArea,
  patchOrderStatus,
  postDeliveryArea,
  removeDeliveryArea,
  updateMinOrderPrice
} from "../controllers/orders.controller.js";
import { requireAdmin, requireAdminOrSubAdmin, requireAuth } from "../../../middleware/auth.middleware.js";

const ordersRouter = Router();

ordersRouter.get("/me", requireAuth, getMyOrders);
ordersRouter.get("/", requireAuth, requireAdminOrSubAdmin, getAllAdminOrders);
ordersRouter.get("/settings/min-order-price", requireAuth, requireAdmin, getMinOrderPrice);
ordersRouter.put("/settings/min-order-price", requireAuth, requireAdmin, updateMinOrderPrice);

// Public list of active delivery areas (for checkout dropdown).
ordersRouter.get("/delivery-areas", getPublicDeliveryAreas);
// Admin CRUD for delivery areas.
ordersRouter.get("/delivery-areas/admin", requireAuth, requireAdmin, getAdminDeliveryAreas);
ordersRouter.post("/delivery-areas", requireAuth, requireAdmin, postDeliveryArea);
ordersRouter.patch("/delivery-areas/:id", requireAuth, requireAdmin, patchDeliveryArea);
ordersRouter.delete("/delivery-areas/:id", requireAuth, requireAdmin, removeDeliveryArea);

ordersRouter.post("/", requireAuth, createOrder);
ordersRouter.patch("/:id/status", requireAuth, requireAdminOrSubAdmin, patchOrderStatus);

export { ordersRouter };
