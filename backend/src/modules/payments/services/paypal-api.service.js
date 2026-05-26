import { config } from "../../../config.js";

let cachedToken = null;
let tokenExpiresAt = 0;

function paypalApiBase() {
  return config.paypal.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function assertPayPalConfigured() {
  if (!config.paypal.enabled) {
    const error = new Error("PayPal is not configured on the server");
    error.statusCode = 503;
    throw error;
  }
}

async function getAccessToken() {
  assertPayPalConfigured();
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 30_000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString("base64");
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error_description || body?.message || "PayPal authentication failed");
    error.statusCode = 502;
    throw error;
  }

  cachedToken = body.access_token;
  tokenExpiresAt = now + (Number(body.expires_in) || 300) * 1000;
  return cachedToken;
}

async function paypalRequest(path, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${paypalApiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.details?.[0]?.description || body?.message || "PayPal request failed";
    const error = new Error(detail);
    error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    error.paypal = body;
    throw error;
  }
  return body;
}

function formatAmount(value) {
  return Number(value).toFixed(2);
}

async function createCheckoutOrder({ total, currency, referenceId }) {
  return paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          description: "Green Apple order",
          amount: {
            currency_code: currency,
            value: formatAmount(total),
          },
        },
      ],
    }),
  });
}

async function captureCheckoutOrder(paypalOrderId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
  });
}

async function getCheckoutOrder(paypalOrderId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    method: "GET",
  });
}

function extractCaptureFromOrder(paypalOrder) {
  const unit = paypalOrder?.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  if (!capture?.id || capture.status !== "COMPLETED") {
    return null;
  }
  return {
    captureId: capture.id,
    amount: Number(capture.amount?.value),
    currency: capture.amount?.currency_code,
  };
}

export {
  assertPayPalConfigured,
  captureCheckoutOrder,
  createCheckoutOrder,
  extractCaptureFromOrder,
  getCheckoutOrder,
};
