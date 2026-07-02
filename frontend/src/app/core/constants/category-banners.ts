import { MenuCategory } from '../models/menu-item.model';

/** Static category header banners (slug → asset path). */
export const CATEGORY_BANNER_IMAGES: Readonly<Record<string, string>> = {
  pizza: '/assets/images/categories/pizza.png',
  calzone: '/assets/images/categories/calzone.png',
  baguette: '/assets/images/categories/baguette.png',
  suppe: '/assets/images/categories/suppe.png',
  doner: '/assets/images/categories/doner.png',
  lahmacun: '/assets/images/categories/lahmacun.png',
  pide: '/assets/images/categories/pide.png',
  kleinigkeiten: '/assets/images/categories/kleinigkeiten.png',
  spezial: '/assets/images/categories/spezial.png',
  salad: '/assets/images/categories/salad.png',
  nachtisch: '/assets/images/categories/nachtisch.png',
  sauce: '/assets/images/categories/sauce.png',
  drinks: '/assets/images/categories/drinks.png'
};

export function categoryBannerSrc(category: MenuCategory): string | null {
  const key = String(category ?? '').trim().toLowerCase();
  return CATEGORY_BANNER_IMAGES[key] ?? null;
}
