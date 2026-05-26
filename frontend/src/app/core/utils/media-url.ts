import { environment } from '../../../environments/environment';

/** Default image for menu items without an uploaded photo. */
export const PRODUCT_IMAGE_PLACEHOLDER = '/assets/images/placeholder-product.png';

/** Hero banner on the menu page. */
export const MENU_MAIN_BANNER = '/assets/images/menu-main-banner.png';

/**
 * Uploaded menu images are stored as `/uploads/...` on the API host.
 * Angular static files live at `/assets/...` on the site origin (not under `/api`).
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  const raw = String(url ?? '').trim();
  if (!raw) {
    return PRODUCT_IMAGE_PLACEHOLDER;
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  if (raw.startsWith('/assets/')) {
    return raw;
  }
  if (raw.startsWith('/uploads/')) {
    const origin = environment.mediaOrigin.replace(/\/$/, '');
    return `${origin}${raw}`;
  }
  const origin = environment.mediaOrigin.replace(/\/$/, '');
  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }
  return `${origin}/${raw}`;
}
