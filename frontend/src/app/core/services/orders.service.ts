import { Injectable, computed, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Subject, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { CartItem } from '../models/cart-item.model';
import { FulfillmentType } from '../models/fulfillment.model';
import { CustomerInfo, Order, OrderItemDetail, OrderStatus, PaymentMethod } from '../models/order.model';
import { AuthService } from './auth.service';
import { addonLabelsForLine } from '../utils/menu-addons';
import { unitPriceForMenuItem } from '../utils/menu-pricing';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly ordersSignal = signal<Order[]>([]);
  private readonly socketOrderCreatedSubject = new Subject<Order>();
  /** New order payloads from Socket.IO `order:created` (admin, sub-admin, and owning customer). */
  readonly socketOrderCreated$ = this.socketOrderCreatedSubject.asObservable();
  private socket: Socket | null = null;

  readonly orders = computed(() => this.ordersSignal());
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    effect(() => {
      if (!this.authService.isLoggedIn() && this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.ordersSignal.set([]);
      }
    });

    /** Sub-admins rely on Socket.IO for new orders; connect as soon as they are logged in (not only after opening /orders). */
    effect(() => {
      if (this.authService.isLoggedIn() && this.authService.isSubAdmin()) {
        this.ensureRealtimeConnection();
      }
    });
  }

  loadMyOrders(): Observable<Order[]> {
    this.ensureRealtimeConnection();
    const endpoint = this.authService.canManageAllOrders() ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders/me`;
    return this.http
      .get<any[]>(endpoint, { headers: this.authService.authHeaders() })
      .pipe(
        map((orders) => this.mapOrders(orders)),
        tap((orders) => this.ordersSignal.set(orders))
      );
  }

  private mapOrders(orders: any[]): Order[] {
    return orders.map(
      (order): Order => ({
        id: String(order.id),
        orderNumber: String(order.orderNumber ?? ''),
        customer: {
          name: order.customerName || '',
          phone: order.customerPhone || '',
          address: order.customerAddress || '',
        },
        items: (order.items || []).map(
          (line: any): OrderItemDetail => ({
            itemName: line.itemName,
            sizeLabel: line.sizeLabel || '',
            unitPrice: Number(line.unitPrice) || 0,
            quantity: Number(line.quantity) || 0,
            lineTotal: Number(line.lineTotal) || 0
          })
        ),
        paymentMethod: order.paymentMethod,
        fulfillmentType: order.fulfillmentType,
        status: order.status,
        subtotal: Number(order.subtotal) || 0,
        deliveryFee: Number(order.deliveryFee) || 0,
        total: Number(order.total) || 0,
        createdAt: new Date(order.createdAt)
      })
    );
  }

  loadOrdersForCurrentRole(): Observable<Order[]> {
    this.ensureRealtimeConnection();
    return this.http
      .get<any[]>(this.authService.canManageAllOrders() ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders/me`, {
        headers: this.authService.authHeaders()
      })
      .pipe(
        map((orders) => this.mapOrders(orders)),
        tap((orders) => this.ordersSignal.set(orders))
      );
  }

  buildOrderPayload(
    customer: CustomerInfo,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    fulfillmentType: FulfillmentType,
    deliveryAreaId?: number | null
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      customer: {
        name: customer.name,
        phone: customer.phone,
        ...(customer.email ? { email: customer.email } : {}),
        address: customer.address
      },
      paymentMethod,
      fulfillmentType,
      items: items.map((line) => ({
        ...(line.item.id && Number.isFinite(Number(line.item.id)) ? { menuItemId: Number(line.item.id) } : {}),
        itemName: this.formatOrderItemName(line),
        ...(line.sizeLabel ? { sizeLabel: line.sizeLabel } : {}),
        unitPrice: this.cartLineUnit(line),
        quantity: line.quantity
      }))
    };
    if (fulfillmentType === 'delivery' && deliveryAreaId != null && Number.isFinite(deliveryAreaId)) {
      payload['deliveryAreaId'] = Number(deliveryAreaId);
    }
    return payload;
  }

  placeOrder(
    customer: CustomerInfo,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    fulfillmentType: FulfillmentType,
    total: number,
    deliveryAreaId?: number | null
  ): Observable<Order> {
    const payload = this.buildOrderPayload(customer, items, paymentMethod, fulfillmentType, deliveryAreaId);

    return this.http.post<any>(`${API_BASE_URL}/orders`, payload, { headers: this.authService.authHeaders() }).pipe(
      map((order) => this.mapPlacedOrder(order, customer, items, paymentMethod, fulfillmentType, total)),
      tap((newOrder) => this.ordersSignal.set([newOrder, ...this.ordersSignal()]))
    );
  }

  capturePayPalOrder(
    paypalOrderId: string,
    customer: CustomerInfo,
    items: CartItem[],
    fulfillmentType: FulfillmentType,
    total: number,
    deliveryAreaId?: number | null
  ): Observable<Order> {
    const orderDraft = this.buildOrderPayload(customer, items, 'paypal', fulfillmentType, deliveryAreaId);

    return this.http
      .post<any>(
        `${API_BASE_URL}/payments/paypal/capture`,
        { paypalOrderId, order: orderDraft },
        { headers: this.authService.authHeaders() }
      )
      .pipe(
        map((order) => this.mapPlacedOrder(order, customer, items, 'paypal', fulfillmentType, total)),
        tap((newOrder) => this.ordersSignal.set([newOrder, ...this.ordersSignal()]))
      );
  }

  private mapPlacedOrder(
    order: any,
    customer: CustomerInfo,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    fulfillmentType: FulfillmentType,
    total: number
  ): Order {
    return {
      id: String(order.orderNumber ?? order.id),
      orderNumber: String(order.orderNumber ?? ''),
      customer: {
        name: order.customerName || customer.name,
        phone: order.customerPhone || customer.phone,
        address: order.customerAddress || customer.address
      },
      items: (order.items || []).map(
        (line: any): OrderItemDetail => ({
          itemName: line.itemName,
          sizeLabel: line.sizeLabel || '',
          unitPrice: Number(line.unitPrice) || 0,
          quantity: Number(line.quantity) || 0,
          lineTotal: Number(line.lineTotal) || 0
        })
      ),
      paymentMethod: order.paymentMethod ?? paymentMethod,
      fulfillmentType: order.fulfillmentType ?? fulfillmentType,
      status: order.status ?? 'pending',
      subtotal: Number(order.subtotal) || items.reduce((sum, line) => sum + this.cartLineUnit(line) * line.quantity, 0),
      deliveryFee: Number(order.deliveryFee) || (fulfillmentType === 'pickup' ? 0 : this.calculateDeliveryFee(items)),
      total: Number(order.total) || total,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date()
    };
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<void> {
    return this.http
      .patch(`${API_BASE_URL}/orders/${orderId}/status`, { status }, { headers: this.authService.authHeaders() })
      .pipe(
        tap(() => {
          this.ordersSignal.set(this.ordersSignal().map((order) => (order.id === orderId ? { ...order, status } : order)));
        }),
        map(() => void 0)
      );
  }

  private cartLineUnit(line: CartItem): number {
    if (line.unitPrice != null && Number.isFinite(line.unitPrice)) {
      return line.unitPrice;
    }
    return unitPriceForMenuItem(line.item, line.sizeLabel);
  }

  private formatOrderItemName(line: CartItem): string {
    const addonLabels = addonLabelsForLine(line.addons, 'de');
    let name = line.item.name;
    if (addonLabels.length) {
      name += ` (${addonLabels.join(', ')})`;
    }
    const note = line.instructions?.trim();
    if (note) {
      name += ` — ${note}`;
    }
    return name;
  }

  private calculateDeliveryFee(items: CartItem[]): number {
    const subtotal = items.reduce((sum, line) => sum + this.cartLineUnit(line) * line.quantity, 0);
    return subtotal > 25 ? 0 : 2.5;
  }

  private ensureRealtimeConnection(): void {
    const token = this.authService.token();
    if (!token || this.socket) {
      return;
    }

    const socketUrl =
      environment.socketUrl ||
      (typeof document !== 'undefined' ? document.location.origin : 'http://localhost:4000');
    const socketOptions: { auth: { token: string }; transports: ('websocket')[]; path?: string } = {
      auth: { token },
      transports: ['websocket']
    };
    const socketPath = (environment as { socketPath?: string }).socketPath;
    if (socketPath) {
      socketOptions.path = socketPath;
    }
    this.socket = io(socketUrl, socketOptions);

    this.socket.on('order:created', (order: any) => {
      const mapped = this.mapOrders([order])[0];
      if (mapped) {
        this.socketOrderCreatedSubject.next(mapped);
      }
      this.upsertIncomingOrder(order);
    });

    this.socket.on('order:updated', (order: any) => {
      this.upsertIncomingOrder(order);
    });
  }

  private upsertIncomingOrder(order: any): void {
    const mapped = this.mapOrders([order])[0];
    if (!mapped) {
      return;
    }

    const existing = this.ordersSignal();
    const index = existing.findIndex((item) => item.id === mapped.id);
    if (index === -1) {
      this.ordersSignal.set([mapped, ...existing]);
      return;
    }

    const updated = [...existing];
    updated[index] = {
      ...updated[index],
      ...mapped,
      items: mapped.items.length ? mapped.items : updated[index].items
    };
    this.ordersSignal.set(updated);
  }
}
