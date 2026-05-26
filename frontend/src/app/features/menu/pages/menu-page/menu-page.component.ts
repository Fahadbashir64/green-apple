import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';

import { MenuCategory, MenuItem } from '../../../../core/models/menu-item.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { MenuService } from '../../../../core/services/menu.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MENU_MAIN_BANNER, PRODUCT_IMAGE_PLACEHOLDER } from '../../../../core/utils/media-url';
import { PizzaSize, cardFromPrice, isPizzaCategory, unitPriceForMenuItem } from '../../../../core/utils/menu-pricing';

interface CategorySection {
  category: MenuCategory;
  items: ReturnType<MenuService['getItemsByCategory']>;
}

@Component({
  selector: 'app-menu-page',
  imports: [TranslatePipe, CurrencyPipe, RouterLink, FormsModule],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss'
})
export class MenuPageComponent implements OnInit {
  readonly mainBannerSrc = MENU_MAIN_BANNER;

  categorySections: CategorySection[] = [];
  readonly isMenuLoading = signal(false);
  /** After first menu API attempt (success or error), for empty-state messaging */
  readonly menuLoadSettled = signal(false);
  isCartOpen = false;
  selectedItem: MenuItem | null = null;
  selectedSize: PizzaSize = 'small';
  popupQuantity = 1;
  popupInstructions = '';

  constructor(
    private readonly menuService: MenuService,
    public readonly authService: AuthService,
    public readonly cartService: CartService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService
  ) {
    this.categorySections = [];
  }

  ngOnInit(): void {
    const shouldShowPostLoginLoader = sessionStorage.getItem('ga_post_login_loader') === '1';
    sessionStorage.removeItem('ga_post_login_loader');
    if (shouldShowPostLoginLoader) {
      this.showMenuLoaderFor300ms();
    }

    this.menuService
      .loadPublicCategories()
      .pipe(switchMap(() => this.menuService.loadItems()))
      .subscribe({
        next: () => {
          this.menuLoadSettled.set(true);
          this.refreshSections();
          if (sessionStorage.getItem('ga_order_placed') === '1') {
            sessionStorage.removeItem('ga_order_placed');
            this.toastService.success(this.translateService.instant('toast.orderPlaced'));
          }
        },
        error: () => {
          this.menuLoadSettled.set(true);
          this.refreshSections();
          this.toastService.error(this.translateService.instant('toast.menuLoadFailed'));
        }
      });
  }

  @HostListener('window:ga-menu-loader')
  onGlobalMenuLoaderTrigger(): void {
    this.showMenuLoaderFor300ms();
  }

  private showMenuLoaderFor300ms(): void {
    this.isMenuLoading.set(true);
    setTimeout(() => this.isMenuLoading.set(false), 300);
  }

  private refreshSections(): void {
    const categories = this.menuService.getCategoryOrderForMenu();
    this.categorySections = categories.map((category) => ({
      category,
      items: this.menuService.getItemsByCategory(category)
    }));
  }

  /** Translate known category keys; otherwise show a readable title from DB value. */
  categoryLabel(category: MenuCategory): string {
    const key = `categories.${category}`;
    const translated = this.translateService.instant(key);
    if (translated !== key) {
      return translated;
    }
    return category
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  scrollCategoryRow(viewport: HTMLElement, direction: -1 | 1): void {
    viewport.scrollBy({ left: direction * viewport.clientWidth, behavior: 'smooth' });
  }

  addToCart(itemId: string): void {
    if (!this.authService.canShopAsCustomer()) {
      return;
    }
    this.openProductPopup(itemId);
  }

  openProductPopup(itemId: string): void {
    if (!this.authService.canShopAsCustomer()) {
      return;
    }
    const item = this.menuService.getItems().find((menuItem) => menuItem.id === itemId);
    if (!item) {
      return;
    }
    this.selectedItem = item;
    this.selectedSize = 'small';
    this.popupQuantity = 1;
    this.popupInstructions = '';
  }

  closeProductPopup(): void {
    this.selectedItem = null;
  }

  setSize(size: PizzaSize): void {
    this.selectedSize = size;
  }

  readonly isPizza = isPizzaCategory;

  cardPrice(item: MenuItem): number {
    return cardFromPrice(item);
  }

  popupLinePrice(size: PizzaSize): number {
    return this.selectedItem ? unitPriceForMenuItem(this.selectedItem, size) : 0;
  }

  increasePopupQuantity(): void {
    this.popupQuantity += 1;
  }

  decreasePopupQuantity(): void {
    if (this.popupQuantity > 1) {
      this.popupQuantity -= 1;
    }
  }

  addPopupItemToCart(): void {
    if (!this.selectedItem) {
      return;
    }
    const itemName = this.selectedItem.name;
    const pizza = isPizzaCategory(this.selectedItem.category);
    for (let i = 0; i < this.popupQuantity; i += 1) {
      this.cartService.addItem(this.selectedItem, pizza ? this.selectedSize : undefined);
    }
    this.closeProductPopup();
    this.openCart();
    this.toastService.success(this.translateService.instant('toast.addedToCartQty', { item: itemName, qty: this.popupQuantity }));
  }

  getPopupTotal(): number {
    if (!this.selectedItem) {
      return 0;
    }
    const unit = unitPriceForMenuItem(
      this.selectedItem,
      isPizzaCategory(this.selectedItem.category) ? this.selectedSize : undefined
    );
    return unit * this.popupQuantity;
  }

  onBannerImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src.includes('placeholder-product.png')) {
      return;
    }
    image.src = PRODUCT_IMAGE_PLACEHOLDER;
  }

  increment(itemId: string, sizeLabel?: PizzaSize): void {
    this.cartService.increment(itemId, sizeLabel);
  }

  decrement(itemId: string, sizeLabel?: PizzaSize): void {
    this.cartService.decrement(itemId, sizeLabel);
  }

  remove(itemId: string, sizeLabel?: PizzaSize): void {
    const line = this.cartService
      .cartItems()
      .find((entry) => entry.item.id === itemId && entry.sizeLabel === sizeLabel);
    this.cartService.remove(itemId, sizeLabel);
    if (line) {
      this.toastService.info(this.translateService.instant('toast.removedFromCart', { item: line.item.name }));
    }
  }

  clearCart(): void {
    if (this.cartService.cartItems().length === 0) {
      return;
    }
    this.cartService.clear();
    this.toastService.info(this.translateService.instant('toast.cartCleared'));
  }

  openCart(): void {
    if (!this.authService.canShopAsCustomer()) {
      return;
    }
    this.isCartOpen = true;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }
}
