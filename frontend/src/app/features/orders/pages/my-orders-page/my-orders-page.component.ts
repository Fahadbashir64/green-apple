import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { Order, OrderStatus } from '../../../../core/models/order.model';
import { AuthService } from '../../../../core/services/auth.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-my-orders-page',
  imports: [TranslatePipe, CurrencyPipe, DatePipe, FormsModule, RouterLink],
  templateUrl: './my-orders-page.component.html',
  styleUrl: './my-orders-page.component.scss'
})
export class MyOrdersPageComponent implements OnInit {
  activeTab: 'pending' | 'preparing' | 'completed' = 'pending';
  readonly statuses: OrderStatus[] = ['pending', 'preparing', 'delivered'];

  constructor(
    public readonly ordersService: OrdersService,
    public readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.ordersService.loadMyOrders().subscribe({
      error: () => this.toastService.error(this.translateService.instant('toast.ordersLoadFailed'))
    });
  }

  pendingOrders(): Order[] {
    if (this.canManageAllOrders()) {
      return this.ordersService.orders().filter((order) => order.status === 'pending');
    }
    return this.ordersService.orders().filter((order) => order.status !== 'delivered');
  }

  preparingOrders(): Order[] {
    return this.ordersService.orders().filter((order) => order.status === 'preparing');
  }

  completedOrders(): Order[] {
    return this.ordersService.orders().filter((order) => order.status === 'delivered');
  }

  setActiveTab(tab: 'pending' | 'preparing' | 'completed'): void {
    this.activeTab = tab;
  }

  visibleOrders(): Order[] {
    if (this.activeTab === 'pending') {
      return this.pendingOrders();
    }
    if (this.activeTab === 'preparing') {
      return this.preparingOrders();
    }
    return this.completedOrders();
  }

  activeEmptyKey(): string {
    if (this.activeTab === 'pending') {
      return 'pages.myOrders.pendingEmpty';
    }
    if (this.activeTab === 'preparing') {
      return 'pages.myOrders.preparingEmpty';
    }
    return 'pages.myOrders.completedEmpty';
  }

  canManageAllOrders(): boolean {
    return this.authService.canManageAllOrders();
  }

  updateStatus(orderId: string, status: string): void {
    if (!this.canManageAllOrders()) {
      return;
    }
    this.ordersService.updateOrderStatus(orderId, status as OrderStatus).subscribe({
      error: () => this.toastService.error(this.translateService.instant('toast.orderStatusFailed'))
    });
  }
}
