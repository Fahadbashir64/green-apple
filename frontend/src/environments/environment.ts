export const environment = {
  production: false,
  /** REST API base (no trailing slash). */
  apiUrl: 'http://localhost:4000/api',
  /** Prefix for `/uploads/...` and other API-relative paths in dev. */
  mediaOrigin: 'http://localhost:4000',
  /** Socket.IO server URL; empty = same origin as the page. */
  socketUrl: 'http://localhost:4000',
  /**
   * QZ Tray (https://qz.io): local receipt printing. Install QZ Tray on the PC and set enabled when needed.
   * For HTTPS production, configure certificateUrl + signRequestUrl (see QZ signing docs).
   */
  /** Set showPayPal to true when PayPal checkout should appear on the checkout page. */
  payments: {
    showPayPal: false
  },
  qzTray: {
    enabled: true,
    /** Exact Windows printer name (Settings → Printers). Avoid "Microsoft Print to PDF". */
    printerName: '',
    /** Printable width in mm (72 = narrow receipt; use ~190 for full A4 width). */
    receiptWidthMm: 72,
    copies: 1,
    /** After successful checkout (e.g. counter tablet). */
    autoPrintAfterCheckout: false,
    /** When a sub-admin session receives `order:created` over Socket.IO (socket is opened on sub-admin login). */
    autoPrintOnSocketOrder: true,
    /** PEM certificate URL (optional, for trusted signing). */
    certificateUrl: '',
    /** POST body = message to sign; response text = signature (optional). */
    signRequestUrl: ''
  }
};
