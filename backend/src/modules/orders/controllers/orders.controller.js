import {
  deliveryAreaCreateSchema,
  deliveryAreaUpdateSchema,
  orderSchema,
  updateOrderStatusSchema
} from "../validators/order.validator.js";
import {
  getAllOrders,
  getMinimumOrderPrice,
  getUserOrders,
  placeOrder,
  setMinimumOrderPrice,
  updateOrderStatus
} from "../services/orders.service.js";
import {
  createDeliveryArea,
  deleteDeliveryArea,
  ensureDeliveryAreasTable,
  listDeliveryAreas,
  updateDeliveryArea
} from "../services/delivery-areas.service.js";
import { emitOrderCreated, emitOrderUpdated } from "../../../socket.js";

async function getMyOrders(req, res) {
  const orders = await getUserOrders(req.user.userId);
  res.json(orders);
}

async function getAllAdminOrders(_req, res) {
  const orders = await getAllOrders();
  res.json(orders);
}

async function createOrder(req, res) {
  const role = req.user?.role;
  if (role === "admin" || role === "sub_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }
  if (parsed.data.paymentMethod === "paypal") {
    return res.status(400).json({ message: "Use PayPal checkout to pay with PayPal" });
  }

  try {
    const order = await placeOrder(req.user, parsed.data);
    emitOrderCreated(order);
    return res.status(201).json(order);
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ message: error?.message || "Failed to place order" });
  }
}

async function getMinOrderPrice(_req, res) {
  const minOrderPrice = await getMinimumOrderPrice();
  return res.json({ minOrderPrice });
}

async function updateMinOrderPrice(req, res) {
  const nextValue = Number(req.body?.minOrderPrice);
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    return res.status(400).json({ message: "Invalid minimum order price" });
  }
  const minOrderPrice = await setMinimumOrderPrice(nextValue);
  return res.json({ minOrderPrice });
}

async function patchOrderStatus(req, res) {
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await updateOrderStatus(orderId, parsed.data.status);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  emitOrderUpdated(order);
  return res.json(order);
}

async function getPublicDeliveryAreas(_req, res) {
  await ensureDeliveryAreasTable();
  const areas = await listDeliveryAreas({ activeOnly: true });
  return res.json(areas);
}

async function getAdminDeliveryAreas(_req, res) {
  await ensureDeliveryAreasTable();
  const areas = await listDeliveryAreas({ activeOnly: false });
  return res.json(areas);
}

async function postDeliveryArea(req, res) {
  await ensureDeliveryAreasTable();
  const parsed = deliveryAreaCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid delivery area payload" });
  }
  const created = await createDeliveryArea({
    city: parsed.data.city,
    area: parsed.data.area,
    charge: parsed.data.charge,
    isActive: parsed.data.isActive ?? true
  });
  return res.status(201).json(created);
}

async function patchDeliveryArea(req, res) {
  await ensureDeliveryAreasTable();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid delivery area id" });
  }
  const parsed = deliveryAreaUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid delivery area payload" });
  }
  const updated = await updateDeliveryArea(id, parsed.data);
  if (!updated) {
    return res.status(404).json({ message: "Delivery area not found" });
  }
  return res.json(updated);
}

async function removeDeliveryArea(req, res) {
  await ensureDeliveryAreasTable();
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid delivery area id" });
  }
  const deleted = await deleteDeliveryArea(id);
  if (!deleted) {
    return res.status(404).json({ message: "Delivery area not found" });
  }
  return res.status(204).send();
}

export {
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
};
