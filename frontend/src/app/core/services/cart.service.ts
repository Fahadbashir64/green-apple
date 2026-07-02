import { Injectable, computed, signal } from '@angular/core';

import { cartLineKey } from '../constants/menu-addons';
import { allergensForMenuItem } from '../constants/menu-allergens';
import { CartItem } from '../models/cart-item.model';
import { FulfillmentType } from '../models/fulfillment.model';
import { MenuItem } from '../models/menu-item.model';
import { PizzaSize, applyFulfillmentDiscount, fulfillmentDiscountRate, unitPriceForMenuItem } from '../utils/menu-pricing';

const FREE_DELIVERY_THRESHOLD_EUR = 25;
const DELIVERY_FEE_EUR = 2.5;
const CART_STORAGE_KEY = 'ga_cart_items';
const FULFILLMENT_STORAGE_KEY = 'ga_fulfillment_type';
const FULFILLMENT_CHOSEN_KEY = 'ga_fulfillment_chosen';
const DELIVERY_AREA_STORAGE_KEY = 'ga_delivery_area';

export interface CartDeliveryArea {
  id: number;
  city: string;
  area: string;
  charge: number;
}

export interface AddCartItemOptions {
  sizeLabel?: PizzaSize;
  addons?: string[];
  instructions?: string;
  quantity?: number;
  unitPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly cartItemsSignal = signal<CartItem[]>(this.readStoredCart());
  private readonly fulfillmentSignal = signal<FulfillmentType>(this.readStoredFulfillment());
  private readonly fulfillmentChosenSignal = signal<boolean>(this.readStoredFulfillmentChosen());
  private readonly deliveryAreaSignal = signal<CartDeliveryArea | null>(this.readStoredDeliveryArea());

  readonly cartItems = computed(() => this.cartItemsSignal());
  readonly fulfillmentType = this.fulfillmentSignal.asReadonly();
  readonly hasChosenFulfillment = this.fulfillmentChosenSignal.asReadonly();
  readonly deliveryArea = this.deliveryAreaSignal.asReadonly();
  readonly isFulfillmentComplete = computed(() => {
    if (!this.fulfillmentChosenSignal()) {
      return false;
    }
    if (this.fulfillmentSignal() === 'pickup') {
      return true;
    }
    return this.deliveryAreaSignal() != null;
  });
  readonly itemCount = computed(() => this.cartItems().reduce((sum, line) => sum + line.quantity, 0));
  readonly discountPercent = computed(() => {
    const rate = fulfillmentDiscountRate(this.fulfillmentSignal(), this.fulfillmentChosenSignal());
    return Math.round(rate * 100);
  });
  readonly hasFulfillmentDiscount = computed(
    () => this.discountPercent() > 0 && this.cartItems().length > 0
  );
  readonly isFulfillmentDiscountSelected = computed(
    () => this.discountPercent() > 0 && this.fulfillmentChosenSignal()
  );
  readonly totalListPrice = computed(() =>
    this.cartItems().reduce((sum, line) => sum + this.lineListTotal(line), 0)
  );
  readonly totalPrice = computed(() =>
    this.cartItems().reduce((sum, line) => sum + this.lineDiscountedTotal(line), 0)
  );
  readonly discountAmount = computed(() => {
    if (!this.hasFulfillmentDiscount()) {
      return 0;
    }
    return Math.max(0, this.totalListPrice() - this.totalPrice());
  });
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

  lineKey(line: CartItem): string {
    return cartLineKey(line.item, line.sizeLabel, line.addons, line.instructions);
  }

  setFulfillmentType(type: FulfillmentType): void {
    this.fulfillmentSignal.set(type);
    if (type === 'pickup') {
      this.deliveryAreaSignal.set(null);
    }
    this.syncStorage();
  }

  confirmPickup(): void {
    this.fulfillmentSignal.set('pickup');
    this.deliveryAreaSignal.set(null);
    this.fulfillmentChosenSignal.set(true);
    this.syncStorage();
  }

  confirmDelivery(area: CartDeliveryArea): void {
    this.fulfillmentSignal.set('delivery');
    this.deliveryAreaSignal.set(area);
    this.fulfillmentChosenSignal.set(true);
    this.syncStorage();
  }

  setDeliveryArea(area: CartDeliveryArea | null): void {
    this.deliveryAreaSignal.set(area);
    if (area && this.fulfillmentSignal() === 'delivery') {
      this.fulfillmentChosenSignal.set(true);
    }
    this.syncStorage();
  }

  lineUnitPrice(line: CartItem): number {
    if (line.unitPrice != null && Number.isFinite(line.unitPrice)) {
      return line.unitPrice;
    }
    return unitPriceForMenuItem(line.item, line.sizeLabel);
  }

  lineDiscountedUnitPrice(line: CartItem): number {
    const list = this.lineUnitPrice(line);
    const rate = fulfillmentDiscountRate(this.fulfillmentSignal(), this.fulfillmentChosenSignal());
    return applyFulfillmentDiscount(list, rate);
  }

  lineListTotal(line: CartItem): number {
    return this.lineUnitPrice(line) * line.quantity;
  }

  lineDiscountedTotal(line: CartItem): number {
    return this.lineDiscountedUnitPrice(line) * line.quantity;
  }

  addItem(item: MenuItem, options?: AddCartItemOptions | PizzaSize): void {
    const opts: AddCartItemOptions =
      typeof options === 'string' || options === undefined ? { sizeLabel: options } : options;
    const sizeLabel = opts.sizeLabel;
    const addons = opts.addons?.length ? [...opts.addons].sort() : undefined;
    const instructions = opts.instructions?.trim() || undefined;
    const quantity = Math.max(1, opts.quantity ?? 1);
    const unitPrice =
      opts.unitPrice != null && Number.isFinite(opts.unitPrice)
        ? opts.unitPrice
        : unitPriceForMenuItem(item, sizeLabel);
    const key = cartLineKey(item, sizeLabel, addons, instructions);
    const current = this.cartItemsSignal();
    const existing = current.find((line) => this.lineKey(line) === key);

    if (existing) {
      this.cartItemsSignal.set(
        current.map((line) => (this.lineKey(line) === key ? { ...line, quantity: line.quantity + quantity } : line))
      );
      this.syncStorage();
      return;
    }

    this.cartItemsSignal.set([...current, { item, quantity, sizeLabel, unitPrice, addons, instructions }]);
    this.syncStorage();
  }

  incrementLine(line: CartItem): void {
    const key = this.lineKey(line);
    this.cartItemsSignal.set(
      this.cartItemsSignal().map((entry) =>
        this.lineKey(entry) === key ? { ...entry, quantity: entry.quantity + 1 } : entry
      )
    );
    this.syncStorage();
  }

  decrementLine(line: CartItem): void {
    const key = this.lineKey(line);
    this.cartItemsSignal.set(
      this.cartItemsSignal()
        .map((entry) => (this.lineKey(entry) === key ? { ...entry, quantity: entry.quantity - 1 } : entry))
        .filter((entry) => entry.quantity > 0)
    );
    this.syncStorage();
  }

  removeLine(line: CartItem): void {
    const key = this.lineKey(line);
    this.cartItemsSignal.set(this.cartItemsSignal().filter((entry) => this.lineKey(entry) !== key));
    this.syncStorage();
  }

  clear(): void {
    this.cartItemsSignal.set([]);
    this.syncStorage();
  }

  private syncStorage(): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItemsSignal()));
    localStorage.setItem(FULFILLMENT_STORAGE_KEY, this.fulfillmentSignal());
    localStorage.setItem(FULFILLMENT_CHOSEN_KEY, this.fulfillmentChosenSignal() ? '1' : '0');
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
          const item = { ...line.item };
          item.allergens =
            allergensForMenuItem({ code: item.id, id: item.id, name: item.name, allergens: item.allergens }) ??
            item.allergens ??
            null;
          const unitPrice =
            line.unitPrice != null && Number.isFinite(line.unitPrice)
              ? line.unitPrice
              : unitPriceForMenuItem(item, line.sizeLabel);
          const addons = line.addons?.length ? [...line.addons].sort() : undefined;
          const instructions = line.instructions?.trim() || undefined;
          return { ...line, item, unitPrice, addons, instructions };
        });
    } catch {
      return [];
    }
  }

  private readStoredFulfillment(): FulfillmentType {
    const raw = localStorage.getItem(FULFILLMENT_STORAGE_KEY);
    return raw === 'pickup' ? 'pickup' : 'delivery';
  }

  private readStoredFulfillmentChosen(): boolean {
    const chosen = localStorage.getItem(FULFILLMENT_CHOSEN_KEY);
    if (chosen === '1') {
      return true;
    }
    if (chosen === '0') {
      return false;
    }
    const type = localStorage.getItem(FULFILLMENT_STORAGE_KEY);
    if (type === 'pickup') {
      return true;
    }
    if (type === 'delivery' && localStorage.getItem(DELIVERY_AREA_STORAGE_KEY)) {
      return true;
    }
    return false;
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
