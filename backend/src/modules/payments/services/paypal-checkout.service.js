import { config } from "../../../config.js";
import {
  captureCheckoutOrder,
  createCheckoutOrder,
  extractCaptureFromOrder,
  getCheckoutOrder,
} from "./paypal-api.service.js";
import {
  computeOrderPricing,
  findOrderByPayPalOrderId,
  placeOrder,
} from "../../orders/services/orders.service.js";

function assertPayPalAmountMatches(pricing, paypalOrder) {
  const unit = paypalOrder?.purchase_units?.[0];
  const amountValue = Number(unit?.amount?.value);
  const currency = unit?.amount?.currency_code;
  if (currency !== config.paypal.currency) {
    const error = new Error("PayPal currency mismatch");
    error.statusCode = 400;
    throw error;
  }
  if (Math.abs(amountValue - pricing.total) > 0.01) {
    const error = new Error("PayPal amount does not match order total");
    error.statusCode = 400;
    throw error;
  }
}

async function createPayPalCheckout(user, orderDraft) {
  const pricing = await computeOrderPricing({
    fulfillmentType: orderDraft.fulfillmentType,
    items: orderDraft.items,
    deliveryAreaId: orderDraft.deliveryAreaId,
  });

  const referenceId = `user-${user.userId}-${Date.now()}`;
  const paypalOrder = await createCheckoutOrder({
    total: pricing.total,
    currency: config.paypal.currency,
    referenceId,
  });

  return {
    paypalOrderId: paypalOrder.id,
    total: pricing.total,
    currency: config.paypal.currency,
  };
}

async function capturePayPalCheckout(user, paypalOrderId, orderDraft) {
  const existing = await findOrderByPayPalOrderId(paypalOrderId);
  if (existing) {
    return existing;
  }

  const pricing = await computeOrderPricing({
    fulfillmentType: orderDraft.fulfillmentType,
    items: orderDraft.items,
    deliveryAreaId: orderDraft.deliveryAreaId,
  });

  let paypalOrder = await getCheckoutOrder(paypalOrderId);
  let capture = extractCaptureFromOrder(paypalOrder);

  if (!capture) {
    if (paypalOrder.status !== "APPROVED" && paypalOrder.status !== "CREATED") {
      const error = new Error("PayPal order cannot be captured in its current state");
      error.statusCode = 400;
      throw error;
    }
    paypalOrder = await captureCheckoutOrder(paypalOrderId);
    capture = extractCaptureFromOrder(paypalOrder);
  }

  if (!capture) {
    const error = new Error("PayPal payment was not completed");
    error.statusCode = 400;
    throw error;
  }

  assertPayPalAmountMatches(pricing, paypalOrder);

  if (Math.abs(capture.amount - pricing.total) > 0.01) {
    const error = new Error("Captured PayPal amount does not match order total");
    error.statusCode = 400;
    throw error;
  }

  return placeOrder(
    user,
    { ...orderDraft, paymentMethod: "paypal" },
    { paypalOrderId, paypalCaptureId: capture.captureId }
  );
}

export { capturePayPalCheckout, createPayPalCheckout };
