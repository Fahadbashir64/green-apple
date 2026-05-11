import { environment } from '../../../environments/environment';

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
  const origin = environment.mediaOrigin;
  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }
  return `${origin}/${raw}`;
}
