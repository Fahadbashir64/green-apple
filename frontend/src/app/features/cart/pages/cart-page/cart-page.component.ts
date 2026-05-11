import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { FulfillmentType } from '../../../../core/models/fulfillment.model';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-cart-page',
  imports: [TranslatePipe, CurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {
  constructor(
    public readonly cartService: CartService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService
  ) {}

  increment(itemId: string, sizeLabel?: 'small' | 'medium' | 'large' | 'xlarge'): void {
    this.cartService.increment(itemId, sizeLabel);
  }

  decrement(itemId: string, sizeLabel?: 'small' | 'medium' | 'large' | 'xlarge'): void {
    this.cartService.decrement(itemId, sizeLabel);
  }

  remove(itemId: string, sizeLabel?: 'small' | 'medium' | 'large' | 'xlarge'): void {
    const line = this.cartService
      .cartItems()
      .find((entry) => entry.item.id === itemId && entry.sizeLabel === sizeLabel);
    this.cartService.remove(itemId, sizeLabel);
    if (line) {
      this.toastService.info(this.translateService.instant('toast.removedFromCart', { item: line.item.name }));
    }
  }

  setFulfillmentType(type: FulfillmentType): void {
    this.cartService.setFulfillmentType(type);
  }
}
