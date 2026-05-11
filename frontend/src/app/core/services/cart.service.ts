import { Injectable, computed, signal } from '@angular/core';

import { CartItem } from '../models/cart-item.model';
import { FulfillmentType } from '../models/fulfillment.model';
import { MenuItem } from '../models/menu-item.model';
import { PizzaSize, unitPriceForMenuItem } from '../utils/menu-pricing';
import { resolveMediaUrl } from '../utils/media-url';

const FREE_DELIVERY_THRESHOLD_EUR = 25;
const DELIVERY_FEE_EUR = 2.5;
const CART_STORAGE_KEY = 'ga_cart_items';
const FULFILLMENT_STORAGE_KEY = 'ga_fulfillment_type';
const DELIVERY_AREA_STORAGE_KEY = 'ga_delivery_area';

export interface CartDeliveryArea {
  id: number;
  city: string;
  area: string;
  charge: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cartItemsSignal = signal<CartItem[]>(this.readStoredCart());
  private readonly fulfillmentSignal = signal<FulfillmentType>(this.readStoredFulfillment());
  private readonly deliveryAreaSignal = signal<CartDeliveryArea | null>(this.readStoredDeliveryArea());

  readonly cartItems = computed(() => this.cartItemsSignal());
  readonly fulfillmentType = this.fulfillmentSignal.asReadonly();
  readonly deliveryArea = this.deliveryAreaSignal.asReadonly();
  readonly itemCount = computed(() => this.cartItems().reduce((sum, line) => sum + line.quantity, 0));
  readonly totalPrice = computed(() =>
    this.cartItems().reduce((sum, line) => sum + this.lineUnitPrice(line) * line.quantity, 0)
  );
  readonly deliveryFee = computed(() => {
    if (this.fulfillmentSignal() === 'pickup') {
      return 0;
    }
    const area = this.deliveryAreaSignal();
    if (area) {
      return Number(area.charge) || 0;
    }
    const subtotal = this.totalPrice();
    return subtotal > FREE_DELIVERY_THRESHOLD_EUR ? 0 : DELIVERY_FEE_EUR;
  });
  readonly grandTotal = computed(() => this.totalPrice() + this.deliveryFee());

  setFulfillmentType(type: FulfillmentType): void {
    this.fulfillmentSignal.set(type);
    if (type === 'pickup') {
      this.deliveryAreaSignal.set(null);
    }
    this.syncStorage();
  }

  setDeliveryArea(area: CartDeliveryArea | null): void {
    this.deliveryAreaSignal.set(area);
    this.syncStorage();
  }

  lineUnitPrice(line: CartItem): number {
    if (line.unitPrice != null && Number.isFinite(line.unitPrice)) {
      return line.unitPrice;
    }
    return unitPriceForMenuItem(line.item, line.sizeLabel);
  }

  addItem(item: MenuItem, sizeLabel?: PizzaSize): void {
    const unitPrice = unitPriceForMenuItem(item, sizeLabel);
    const current = this.cartItemsSignal();
    const existing = current.find((line) => line.item.id === item.id && line.sizeLabel === sizeLabel);

    if (existing) {
      this.cartItemsSignal.set(
        current.map((line) =>
          line.item.id === item.id && line.sizeLabel === sizeLabel ? { ...line, quantity: line.quantity + 1 } : line
        )
      );
      this.syncStorage();
      return;
    }

    this.cartItemsSignal.set([...current, { item, quantity: 1, sizeLabel, unitPrice }]);
    this.syncStorage();
  }

  increment(itemId: string, sizeLabel?: PizzaSize): void {
    this.cartItemsSignal.set(
      this.cartItemsSignal().map((line) =>
        line.item.id === itemId && line.sizeLabel === sizeLabel ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
    this.syncStorage();
  }

  decrement(itemId: string, sizeLabel?: PizzaSize): void {
    this.cartItemsSignal.set(
      this.cartItemsSignal()
        .map((line) =>
          line.item.id === itemId && line.sizeLabel === sizeLabel ? { ...line, quantity: line.quantity - 1 } : line
        )
        .filter((line) => line.quantity > 0)
    );
    this.syncStorage();
  }

  remove(itemId: string, sizeLabel?: PizzaSize): void {
    this.cartItemsSignal.set(
      this.cartItemsSignal().filter((line) => !(line.item.id === itemId && line.sizeLabel === sizeLabel))
    );
    this.syncStorage();
  }

  clear(): void {
    this.cartItemsSignal.set([]);
    this.fulfillmentSignal.set('delivery');
    this.deliveryAreaSignal.set(null);
    this.syncStorage();
  }

  private syncStorage(): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItemsSignal()));
    localStorage.setItem(FULFILLMENT_STORAGE_KEY, this.fulfillmentSignal());
    const area = this.deliveryAreaSignal();
    if (area) {
      localStorage.setItem(DELIVERY_AREA_STORAGE_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(DELIVERY_AREA_STORAGE_KEY);
    }
  }

  private readStoredCart(): CartItem[] {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      return parsed
        .filter((line) => line?.item?.id && Number(line.quantity) > 0)
        .map((line) => {
          const item = { ...line.item, imageUrl: resolveMediaUrl(line.item.imageUrl) };
          const unitPrice =
            line.unitPrice != null && Number.isFinite(line.unitPrice)
              ? line.unitPrice
              : unitPriceForMenuItem(item, line.sizeLabel);
          return { ...line, item, unitPrice };
        });
    } catch {
      return [];
    }
  }

  private readStoredFulfillment(): FulfillmentType {
    const raw = localStorage.getItem(FULFILLMENT_STORAGE_KEY);
    return raw === 'pickup' ? 'pickup' : 'delivery';
  }

  private readStoredDeliveryArea(): CartDeliveryArea | null {
    const raw = localStorage.getItem(DELIVERY_AREA_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      const id = Number(parsed.id);
      const charge = Number(parsed.charge);
      if (!Number.isFinite(id) || !Number.isFinite(charge)) {
        return null;
      }
      return {
        id,
        city: String(parsed.city ?? ''),
        area: String(parsed.area ?? ''),
        charge
      };
    } catch {
      return null;
    }
  }
}
