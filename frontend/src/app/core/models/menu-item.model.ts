export type MenuCategory = string;

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  /** Pizza: explicit EUR price for medium (small uses `price`). */
  priceMedium?: number | null;
  priceLarge?: number | null;
  priceXlarge?: number | null;
  badge?: 'new' | 'popular' | 'spicy';
  imageUrl?: string;
  isBestseller?: boolean;
  /** Comma-separated allergen/additive codes (flyer). */
  allergens?: string | null;
}
