export const environment = {
  production: false,
  /** REST API base (no trailing slash). */
  apiUrl: 'http://localhost:4000/api',
  /** Prefix for `/uploads/...` and other API-relative paths in dev. */
  mediaOrigin: 'http://localhost:4000',
  /** Socket.IO server URL; empty = same origin as the page. */
  socketUrl: 'http://localhost:4000'
};
