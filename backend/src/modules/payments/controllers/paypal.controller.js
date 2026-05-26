import { config } from "../../../config.js";
import { orderSchema } from "../../orders/validators/order.validator.js";
import { emitOrderCreated } from "../../../socket.js";
import { capturePayPalCheckout, createPayPalCheckout } from "../services/paypal-checkout.service.js";
import { z } from "zod";

const paypalCaptureSchema = z.object({
  paypalOrderId: z.string().min(1),
  order: orderSchema,
});

function getPayPalConfig(_req, res) {
  return res.json({
    enabled: config.paypal.enabled,
    clientId: config.paypal.enabled ? config.paypal.clientId : "",
    currency: config.paypal.currency,
  });
}

async function postCreatePayPalOrder(req, res) {
  const role = req.user?.role;
  if (role === "admin" || role === "sub_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }
  if (parsed.data.paymentMethod !== "paypal") {
    return res.status(400).json({ message: "paymentMethod must be paypal" });
  }

  try {
    const result = await createPayPalCheckout(req.user, parsed.data);
    return res.status(201).json(result);
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ message: error?.message || "Failed to create PayPal order" });
  }
}

async function postCapturePayPalOrder(req, res) {
  const role = req.user?.role;
  if (role === "admin" || role === "sub_admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = paypalCaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const order = await capturePayPalCheckout(
      req.user,
      parsed.data.paypalOrderId,
      parsed.data.order
    );
    emitOrderCreated(order);
    return res.status(201).json(order);
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ message: error?.message || "Failed to capture PayPal payment" });
  }
}

export { getPayPalConfig, postCapturePayPalOrder, postCreatePayPalOrder };
