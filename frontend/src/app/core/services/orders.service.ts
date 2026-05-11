import { Injectable, computed, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { CartItem } from '../models/cart-item.model';
import { FulfillmentType } from '../models/fulfillment.model';
import { CustomerInfo, Order, OrderItemDetail, OrderStatus, PaymentMethod } from '../models/order.model';
import { AuthService } from './auth.service';
import { unitPriceForMenuItem } from '../utils/menu-pricing';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly ordersSignal = signal<Order[]>([]);
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
  }

  loadMyOrders(): Observable<Order[]> {
    this.ensureRealtimeConnection();
    const endpoint = this.authService.isAdmin() ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders/me`;
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
      .get<any[]>(this.authService.isAdmin() ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders/me`, {
        headers: this.authService.authHeaders()
      })
      .pipe(
        map((orders) => this.mapOrders(orders)),
        tap((orders) => this.ordersSignal.set(orders))
      );
  }

  placeOrder(
    customer: CustomerInfo,
    items: CartItem[],
    paymentMethod: PaymentMethod,
    fulfillmentType: FulfillmentType,
    total: number,
    deliveryAreaId?: number | null
  ): Observable<Order> {
    const payload: Record<string, unknown> = {
      customer,
      paymentMethod,
      fulfillmentType,
      items: items.map((line) => ({
        itemName: line.item.name,
        ...(line.sizeLabel ? { sizeLabel: line.sizeLabel } : {}),
        unitPrice: this.cartLineUnit(line),
        quantity: line.quantity
      }))
    };
    if (fulfillmentType === 'delivery' && deliveryAreaId != null && Number.isFinite(deliveryAreaId)) {
      payload['deliveryAreaId'] = Number(deliveryAreaId);
    }

    return this.http.post<any>(`${API_BASE_URL}/orders`, payload, { headers: this.authService.authHeaders() }).pipe(
      map(
        (order): Order => ({
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
        })
      ),
      tap((newOrder) => this.ordersSignal.set([newOrder, ...this.ordersSignal()]))
    );
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
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('order:created', (order: any) => {
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
