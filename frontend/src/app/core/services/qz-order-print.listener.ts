import { DestroyRef, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { OrdersService } from './orders.service';
import { QzTrayService } from './qz-tray.service';

/**
 * Subscribes to realtime new orders and sends a receipt to QZ Tray for sub-admin workstations when enabled.
 */
@Injectable({ providedIn: 'root' })
export class QzOrderPrintListenerService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService,
    private readonly qzTrayService: QzTrayService,
    private readonly destroyRef: DestroyRef
  ) {
    this.ordersService.socketOrderCreated$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(
          () =>
            this.qzTrayService.isEnabled() &&
            environment.qzTray?.autoPrintOnSocketOrder === true &&
            this.authService.isSubAdmin()
        )
      )
      .subscribe((order) => {
        void this.qzTrayService.printOrderReceipt(order).catch((err: unknown) => {
          console.warn('[QZ Tray] Auto-print failed', err);
        });
      });
  }
}
