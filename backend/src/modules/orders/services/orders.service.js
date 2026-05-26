import { pool } from "../../../db.js";
import { getDeliveryAreaById } from "./delivery-areas.service.js";

const ORDER_SELECT = `SELECT
      o.id,
      o.user_id AS userId,
      o.order_number AS orderNumber,
      o.status,
      o.fulfillment_type AS fulfillmentType,
      o.payment_method AS paymentMethod,
      o.customer_name AS customerName,
      o.customer_phone AS customerPhone,
      o.customer_address AS customerAddress,
      o.delivery_area_id AS deliveryAreaId,
      o.delivery_city AS deliveryCity,
      o.delivery_area AS deliveryArea,
      o.subtotal,
      o.delivery_fee AS deliveryFee,
      o.total,
      o.created_at AS createdAt,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'itemName', oi.item_name,
              'sizeLabel', oi.size_label,
              'unitPrice', oi.unit_price,
              'quantity', oi.quantity,
              'lineTotal', oi.line_total
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        ),
        JSON_ARRAY()
      ) AS items
    FROM orders o`;

async function getUserOrders(userId) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getAllOrders() {
  const result = await pool.query(
    `${ORDER_SELECT}
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

async function getOrderById(orderId) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
}

async function getMinimumOrderPrice() {
  const result = await pool.query("SELECT value_numeric AS minOrderPrice FROM app_settings WHERE `key` = 'min_order_price'");
  if (result.rowCount === 0) {
    return 0;
  }
  return Number(result.rows[0].minOrderPrice) || 0;
}

async function setMinimumOrderPrice(value) {
  const minOrderPrice = Number(value);
  await pool.query(
    `INSERT INTO app_settings (\`key\`, value_numeric)
     VALUES ('min_order_price', $1)
     ON DUPLICATE KEY UPDATE value_numeric = VALUES(value_numeric)`,
    [minOrderPrice]
  );
  return minOrderPrice;
}

async function computeOrderPricing({ fulfillmentType, items, deliveryAreaId }) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const minimumOrderPrice = await getMinimumOrderPrice();
  if (subtotal < minimumOrderPrice) {
    const error = new Error(`Minimum order amount is EUR ${minimumOrderPrice.toFixed(2)}`);
    error.statusCode = 400;
    throw error;
  }

  let deliveryFee = 0;
  let resolvedAreaId = null;
  let resolvedCity = null;
  let resolvedArea = null;
  if (fulfillmentType === "delivery") {
    if (deliveryAreaId) {
      const area = await getDeliveryAreaById(deliveryAreaId);
      if (!area || area.isActive === false) {
        const error = new Error("Selected delivery area is no longer available.");
        error.statusCode = 400;
        throw error;
      }
      deliveryFee = Number(area.charge) || 0;
      resolvedAreaId = area.id;
      resolvedCity = area.city;
      resolvedArea = area.area;
    } else {
      deliveryFee = subtotal > 25 ? 0 : 2.5;
    }
  }
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total, resolvedAreaId, resolvedCity, resolvedArea };
}

async function findOrderByPayPalOrderId(paypalOrderId) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.paypal_order_id = $1`,
    [paypalOrderId]
  );
  return result.rows[0] || null;
}

async function placeOrder(user, payload, options = {}) {
  const { customer, paymentMethod, fulfillmentType, items, deliveryAreaId } = payload;
  if (paymentMethod === "paypal" && !options.paypalOrderId) {
    const error = new Error("PayPal orders must be completed through the PayPal checkout flow");
    error.statusCode = 400;
    throw error;
  }

  const pricing = await computeOrderPricing({ fulfillmentType, items, deliveryAreaId });
  const { subtotal, deliveryFee, total, resolvedAreaId, resolvedCity, resolvedArea } = pricing;
  const orderNumber = `GA-${Date.now()}`;

  const client = await pool.connect();
  try {
    await client.query("START TRANSACTION");
    const orderInsert = await client.query(
      `INSERT INTO orders (
         order_number, user_id, customer_name, customer_phone, customer_email, customer_address,
         fulfillment_type, payment_method, status, subtotal, delivery_fee, total,
         delivery_area_id, delivery_city, delivery_area,
         paypal_order_id, paypal_capture_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        orderNumber,
        user.userId,
        customer.name,
        customer.phone,
        customer.email || user.email,
        customer.address || "",
        fulfillmentType,
        paymentMethod,
        subtotal,
        deliveryFee,
        total,
        resolvedAreaId,
        resolvedCity,
        resolvedArea,
        options.paypalOrderId || null,
        options.paypalCaptureId || null,
      ]
    );

    const orderId = orderInsert.insertId;
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, size_label, unit_price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          orderId,
          item.menuItemId || null,
          item.itemName,
          item.sizeLabel || null,
          item.unitPrice,
          item.quantity,
          item.unitPrice * item.quantity,
        ]
      );
    }
    const detailedOrder = await client.query(
      `${ORDER_SELECT}
       WHERE o.id = $1`,
      [orderId]
    );

    await client.query("COMMIT");
    return detailedOrder.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateOrderStatus(orderId, status) {
  const result = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2`,
    [status, orderId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return getOrderById(orderId);
}

export {
  computeOrderPricing,
  findOrderByPayPalOrderId,
  getAllOrders,
  getMinimumOrderPrice,
  getOrderById,
  getUserOrders,
  placeOrder,
  setMinimumOrderPrice,
  updateOrderStatus,
};
