/** Must match backend static + API host (see MenuService API_BASE_URL). */
const API_ORIGIN = 'http://localhost:4000';

const PLACEHOLDER = '/assets/images/placeholder-food.svg';

/**
 * Backend stores upload paths like `/uploads/file.jpg`. Browsers resolve relative URLs
 * against the page origin (Angular dev server), so we prefix the API host.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  const raw = String(url ?? '').trim();
  if (!raw) {
    return PLACEHOLDER;
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  if (raw.startsWith('/')) {
    return `${API_ORIGIN}${raw}`;
  }
  return `${API_ORIGIN}/${raw}`;
}
