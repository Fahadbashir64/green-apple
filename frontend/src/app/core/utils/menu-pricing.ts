import { MenuItem } from '../models/menu-item.model';

export type PizzaSize = 'small' | 'medium' | 'large' | 'xlarge';

/** Brochure pizza columns (24 / 28 / 40 cm). */
export const BESTSELLER_PIZZA_SIZES: ReadonlyArray<{ size: PizzaSize; cm: number }> = [
  { size: 'small', cm: 24 },
  { size: 'medium', cm: 28 },
  { size: 'large', cm: 40 }
];

const PICKUP_DISCOUNT_RATE = 0.15;
export const DELIVERY_DISCOUNT_RATE = 0.1;
export { PICKUP_DISCOUNT_RATE };

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function fulfillmentDiscountRate(
  type: 'delivery' | 'pickup' | null | undefined,
  active: boolean
): number {
  if (!active) {
    return 0;
  }
  return type === 'pickup' ? PICKUP_DISCOUNT_RATE : DELIVERY_DISCOUNT_RATE;
}

export function applyFulfillmentDiscount(amount: number, rate: number): number {
  const base = Number(amount) || 0;
  if (base <= 0 || rate <= 0) {
    return base;
  }
  return roundMoney(base * (1 - rate));
}

/** Strikethrough “was” price for −15% pickup display on bestseller cards. */
export function pickupListPrice(discounted: number): number {
  const d = Number(discounted) || 0;
  if (d <= 0) {
    return 0;
  }
  return Math.round((d / (1 - PICKUP_DISCOUNT_RATE)) * 100) / 100;
}

export function isPizzaCategory(category: string | undefined): boolean {
  return String(category ?? '').trim().toLowerCase() === 'pizza';
}

/** Price for a brochure pizza column; null when that size is not sold. */
export function strictPizzaSizePrice(item: MenuItem, size: PizzaSize): number | null {
  if (!isPizzaCategory(item.category)) {
    return null;
  }
  const base = Number(item.price) || 0;
  switch (size) {
    case 'small':
      return base > 0 ? base : null;
    case 'medium': {
      const v = item.priceMedium;
      return v != null && Number.isFinite(v) && v > 0 ? Number(v) : null;
    }
    case 'large': {
      const v = item.priceLarge;
      return v != null && Number.isFinite(v) && v > 0 ? Number(v) : null;
    }
    case 'xlarge': {
      const v = item.priceXlarge;
      return v != null && Number.isFinite(v) && v > 0 ? Number(v) : null;
    }
    default:
      return null;
  }
}

export function availableBestsellerPizzaSizes(
  item: MenuItem
): ReadonlyArray<{ size: PizzaSize; cm: number }> {
  return BESTSELLER_PIZZA_SIZES.filter((opt) => strictPizzaSizePrice(item, opt.size) != null);
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

/** Lowest displayed "from" price on cards (pizza = min of brochure sizes). */
export function cardFromPrice(item: MenuItem): number {
  if (!isPizzaCategory(item.category)) {
    return Number(item.price) || 0;
  }
  const prices = BESTSELLER_PIZZA_SIZES.map((opt) => strictPizzaSizePrice(item, opt.size)).filter(
    (price): price is number => price != null
  );
  if (prices.length === 0) {
    return Number(item.price) || 0;
  }
  return Math.min(...prices);
}
