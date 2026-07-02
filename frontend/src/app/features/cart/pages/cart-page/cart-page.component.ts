import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CartItem } from '../../../../core/models/cart-item.model';
import { CartService } from '../../../../core/services/cart.service';
import { OpeningHoursService } from '../../../../core/services/opening-hours.service';
import { ToastService } from '../../../../core/services/toast.service';
import { addonLabelsForLine } from '../../../../core/utils/menu-addons';

@Component({
  selector: 'app-cart-page',
  imports: [TranslatePipe, CurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {
  constructor(
    public readonly cartService: CartService,
    private readonly openingHours: OpeningHoursService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService
  ) {}

  incrementLine(line: CartItem): void {
    this.cartService.incrementLine(line);
  }

  decrementLine(line: CartItem): void {
    this.cartService.decrementLine(line);
  }

  removeLine(line: CartItem): void {
    this.cartService.removeLine(line);
    this.toastService.info(this.translateService.instant('toast.removedFromCart', { item: line.item.name }));
  }

  lineAddonLabels(line: CartItem): string[] {
    return addonLabelsForLine(line.addons, this.menuLang());
  }

  private menuLang(): 'de' | 'en' {
    return this.translateService.currentLang?.startsWith('en') ? 'en' : 'de';
  }

  goCheckout(event: Event): void {
    if (!this.openingHours.canOrder()) {
      event.preventDefault();
      this.openingHours.showNotice();
    }
  }
}
