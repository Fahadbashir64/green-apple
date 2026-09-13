import { CurrencyPipe, DatePipe } from '@angular/common';
import { DestroyRef, Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }
    this.ordersService.loadMyOrders().subscribe({
      error: () => this.toastService.error(this.translateService.instant('toast.ordersLoadFailed'))
    });

    if (this.authService.isSubAdmin()) {
      this.ordersService.socketOrderCreated$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((order) => {
          const orderLabel = order.orderNumber || order.id;
          this.toastService.success(`New order received: #${orderLabel}`, 5000);
          this.playNotificationSound();
        });
    }
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

  private playNotificationSound(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1175, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      void audioContext
        .resume()
        .then(() => {
          oscillator.start(now);
          oscillator.stop(now + 0.34);
          oscillator.addEventListener('ended', () => void audioContext.close(), { once: true });
        })
        .catch(() => void audioContext.close());
    } catch {
      return;
    }
  }
}
