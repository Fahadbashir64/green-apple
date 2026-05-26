/**
 * Production — single Node app at https://greensapples.de (API at /api).
 */
export const environment = {
  production: true,
  apiUrl: 'https://greensapples.de/api',
  /** Host for `/uploads/...` only (not `/api`). */
  mediaOrigin: 'https://greensapples.de',
  socketUrl: 'https://greensapples.de',
  socketPath: '/socket.io',
  payments: {
    showPayPal: false
  },
  qzTray: {
    enabled: false,
    printerName: '',
    receiptWidthMm: 72,
    copies: 1,
    autoPrintAfterCheckout: false,
    autoPrintOnSocketOrder: true,
    certificateUrl: '',
    signRequestUrl: ''
  }
};
