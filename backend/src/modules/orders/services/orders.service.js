import { pool } from "../../../db.js";
import { getDeliveryAreaById } from "./delivery-areas.service.js";

const ORDER_SELECT = `SELECT
      o.id,
      o.user_id AS "userId",
      o.order_number AS "orderNumber",
      o.status,
      o.fulfillment_type AS "fulfillmentType",
      o.payment_method AS "paymentMethod",
      o.customer_name AS "customerName",
      o.customer_phone AS "customerPhone",
      o.customer_address AS "customerAddress",
      o.delivery_area_id AS "deliveryAreaId",
      o.delivery_city AS "deliveryCity",
      o.delivery_area AS "deliveryArea",
      o.subtotal,
      o.delivery_fee AS "deliveryFee",
      o.total,
      o.created_at AS "createdAt",
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'itemName', oi.item_name,
            'sizeLabel', oi.size_label,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity,
            'lineTotal', oi.line_total
          )
          ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::json
      ) AS "items"
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id`;

async function getUserOrders(userId) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getAllOrders() {
  const result = await pool.query(
    `${ORDER_SELECT}
     GROUP BY o.id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

async function getOrderById(orderId) {
  const result = await pool.query(
    `${ORDER_SELECT}
     WHERE o.id = $1
     GROUP BY o.id`,
    [orderId]
  );
  return result.rows[0] || null;
}

async function getMinimumOrderPrice() {
  const result = await pool.query("SELECT value_numeric AS \"minOrderPrice\" FROM app_settings WHERE key = 'min_order_price'");
  if (result.rowCount === 0) {
    return 0;
  }
  return Number(result.rows[0].minOrderPrice) || 0;
}

async function setMinimumOrderPrice(value) {
  const minOrderPrice = Number(value);
  await pool.query(
    `INSERT INTO app_settings (key, value_numeric)
     VALUES ('min_order_price', $1)
     ON CONFLICT (key) DO UPDATE SET value_numeric = EXCLUDED.value_numeric`,
    [minOrderPrice]
  );
  return minOrderPrice;
}

async function placeOrder(user, payload) {
  const { customer, paymentMethod, fulfillmentType, items, deliveryAreaId } = payload;
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
  const orderNumber = `GA-${Date.now()}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderInsert = await client.query(
      `INSERT INTO orders (
         order_number, user_id, customer_name, customer_phone, customer_email, customer_address,
         fulfillment_type, payment_method, status, subtotal, delivery_fee, total,
         delivery_area_id, delivery_city, delivery_area
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11,$12,$13,$14)
       RETURNING id, order_number AS "orderNumber", status, total`,
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
        resolvedArea
      ]
    );

    const orderId = orderInsert.rows[0].id;
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
       WHERE o.id = $1
       GROUP BY o.id`,
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
    `UPDATE orders
        SET status = $1
      WHERE id = $2
    RETURNING id`,
    [status, orderId]
  );
  const updatedId = result.rows[0]?.id;
  if (!updatedId) {
    return null;
  }
  return getOrderById(updatedId);
}

export { getAllOrders, getMinimumOrderPrice, getOrderById, getUserOrders, placeOrder, setMinimumOrderPrice, updateOrderStatus };
