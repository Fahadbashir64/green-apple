import { MenuItem } from '../models/menu-item.model';

export type PizzaSize = 'small' | 'medium' | 'large' | 'xlarge';

export function isPizzaCategory(category: string | undefined): boolean {
  return String(category ?? '').trim().toLowerCase() === 'pizza';
}

/** Unit EUR price for one item; non-pizza always uses `price`. */
export function unitPriceForMenuItem(item: MenuItem, size?: PizzaSize): number {
  if (!isPizzaCategory(item.category) || !size) {
    return Number(item.price) || 0;
  }
  const base = Number(item.price) || 0;
  switch (size) {
    case 'small':
      return base;
    case 'medium': {
      const v = item.priceMedium;
      return v != null && Number.isFinite(v) ? Number(v) : base + 2;
    }
    case 'large': {
      const v = item.priceLarge;
      return v != null && Number.isFinite(v) ? Number(v) : base + 4;
    }
    case 'xlarge': {
      const v = item.priceXlarge;
      return v != null && Number.isFinite(v) ? Number(v) : base + 6;
    }
    default:
      return base;
  }
}

/** Lowest displayed "from" price on cards (pizza = min of all sizes). */
export function cardFromPrice(item: MenuItem): number {
  if (!isPizzaCategory(item.category)) {
    return Number(item.price) || 0;
  }
  return Math.min(
    unitPriceForMenuItem(item, 'small'),
    unitPriceForMenuItem(item, 'medium'),
    unitPriceForMenuItem(item, 'large'),
    unitPriceForMenuItem(item, 'xlarge')
  );
}
