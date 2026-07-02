import { CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';

import { BESTSELLERS_CATEGORY } from '../../../../core/constants/menu.constants';
import { categoryBannerSrc } from '../../../../core/constants/category-banners';
import {
  MenuAddonGroup,
  addonGroupsForItem,
  addonSelectionsTotal,
  serializeAddonSelections
} from '../../../../core/constants/menu-addons';
import { CartItem } from '../../../../core/models/cart-item.model';
import { MenuCategory, MenuItem } from '../../../../core/models/menu-item.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { DeliveryAreasService } from '../../../../core/services/delivery-areas.service';
import { MenuService } from '../../../../core/services/menu.service';
import { OpeningHoursService } from '../../../../core/services/opening-hours.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MENU_MAIN_BANNER } from '../../../../core/utils/media-url';
import { addonLabelsForLine } from '../../../../core/utils/menu-addons';
import {
  BESTSELLER_PIZZA_SIZES,
  PizzaSize,
  availableBestsellerPizzaSizes,
  applyFulfillmentDiscount,
  cardFromPrice,
  fulfillmentDiscountRate,
  isPizzaCategory,
  strictPizzaSizePrice,
  unitPriceForMenuItem
} from '../../../../core/utils/menu-pricing';
import { FulfillmentChoicePopupComponent } from '../../../../shared/ui/fulfillment-choice-popup/fulfillment-choice-popup.component';

interface CategorySection {
  category: MenuCategory;
  items: ReturnType<MenuService['getItemsByCategory']>;
}

@Component({
  selector: 'app-menu-page',
  imports: [TranslatePipe, CurrencyPipe, RouterLink, FormsModule, FulfillmentChoicePopupComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss'
})
export class MenuPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly mainBannerSrc = MENU_MAIN_BANNER;
  readonly bestsellersCategory = BESTSELLERS_CATEGORY;
  readonly bestsellerPizzaSizes = BESTSELLER_PIZZA_SIZES;

  categorySections: CategorySection[] = [];
  displaySections: CategorySection[] = [];
  navSections: CategorySection[] = [];
  readonly activeCategory = signal<MenuCategory | null>(null);
  readonly isMenuLoading = signal(false);
  /** After first menu API attempt (success or error), for empty-state messaging */
  readonly menuLoadSettled = signal(false);

  @ViewChildren('categorySection') private readonly categorySectionEls!: QueryList<ElementRef<HTMLElement>>;

  private scrollSpyPausedUntil = 0;
  private scrollSpyRaf = 0;
  private categorySectionsSub?: { unsubscribe(): void };
  isCartOpen = false;
  selectedItem: MenuItem | null = null;
  selectedSize: PizzaSize = 'small';
  popupQuantity = 1;
  popupInstructions = '';
  popupAddonGroups: MenuAddonGroup[] = [];
  popupSelectedAddons: Record<string, string | string[]> = {};
  showFulfillmentPopup = false;
  fulfillmentPopupAreaOnly = false;
  private pendingProductOpen: { itemId: string; preferredSize?: PizzaSize } | null = null;

  constructor(
    private readonly menuService: MenuService,
    public readonly authService: AuthService,
    public readonly cartService: CartService,
    public readonly openingHours: OpeningHoursService,
    private readonly toastService: ToastService,
    private readonly translateService: TranslateService,
    private readonly deliveryAreasService: DeliveryAreasService,
    private readonly host: ElementRef<HTMLElement>
  ) {
    this.categorySections = [];
  }

  private blockOrderWithClosedNotice(): boolean {
    if (!this.openingHours.canOrder()) {
      this.openingHours.showNotice();
      return true;
    }
    return false;
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

    if (this.authService.canShopAsCustomer()) {
      this.deliveryAreasService.loadPublicAreas().subscribe();
    }
  }

  ngAfterViewInit(): void {
    this.updateStickyOffsets();
    this.categorySectionsSub = this.categorySectionEls.changes.subscribe(() => {
      this.updateActiveCategoryFromScroll();
    });
    this.updateActiveCategoryFromScroll();
  }

  ngOnDestroy(): void {
    if (this.scrollSpyRaf) {
      cancelAnimationFrame(this.scrollSpyRaf);
    }
    this.categorySectionsSub?.unsubscribe();
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scheduleScrollSpyUpdate();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateStickyOffsets();
    this.scheduleScrollSpyUpdate();
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
    const bestsellers = this.menuService.getBestsellerItems();
    const withItems = this.categorySections.filter((section) => section.items.length > 0);
    this.displaySections = [
      ...(bestsellers.length > 0 ? [{ category: BESTSELLERS_CATEGORY, items: bestsellers }] : []),
      ...withItems
    ];
    this.navSections = this.displaySections;
    const first = this.navSections[0]?.category ?? null;
    if (!this.activeCategory() && first) {
      this.activeCategory.set(first);
    }
    queueMicrotask(() => this.updateActiveCategoryFromScroll());
  }

  isBestsellersSection(category: MenuCategory): boolean {
    return category === BESTSELLERS_CATEGORY;
  }

  categorySectionId(category: MenuCategory): string {
    if (category === BESTSELLERS_CATEGORY) {
      return 'menu-cat-bestsellers';
    }
    const slug = String(category ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `menu-cat-${slug || 'section'}`;
  }

  scrollToCategory(category: MenuCategory): void {
    const el = document.getElementById(this.categorySectionId(category));
    if (!el) {
      return;
    }
    this.activeCategory.set(category);
    this.scrollSpyPausedUntil = Date.now() + 900;
    this.syncCategoryNavIntoView(true);
    const top = el.getBoundingClientRect().top + window.scrollY - this.getScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  scrollCategoryNav(track: HTMLElement, direction: -1 | 1): void {
    track.scrollBy({ left: direction * Math.max(180, track.clientWidth * 0.6), behavior: 'smooth' });
  }

  private updateStickyOffsets(): void {
    const topbar = document.querySelector('.topbar');
    const topbarHeight = topbar?.getBoundingClientRect().height ?? 64;
    const navHeight = 52;
    this.host.nativeElement.style.setProperty('--menu-sticky-top', `${topbarHeight}px`);
    this.host.nativeElement.style.setProperty('--menu-scroll-offset', `${topbarHeight + navHeight}px`);
  }

  private getScrollOffset(): number {
    const raw = getComputedStyle(this.host.nativeElement).getPropertyValue('--menu-scroll-offset').trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 120;
  }

  private scheduleScrollSpyUpdate(): void {
    if (this.scrollSpyRaf) {
      return;
    }
    this.scrollSpyRaf = requestAnimationFrame(() => {
      this.scrollSpyRaf = 0;
      this.updateActiveCategoryFromScroll();
    });
  }

  private updateActiveCategoryFromScroll(): void {
    if (Date.now() < this.scrollSpyPausedUntil) {
      return;
    }

    const sections = this.categorySectionEls?.toArray() ?? [];
    if (sections.length === 0) {
      return;
    }

    const offset = this.getScrollOffset();
    let current: MenuCategory | null = null;

    for (const ref of sections) {
      const el = ref.nativeElement;
      if (el.getBoundingClientRect().top <= offset + 8) {
        current = el.dataset['category'] ?? null;
      }
    }

    if (!current) {
      current = sections[0].nativeElement.dataset['category'] ?? null;
    }

    if (!current || current === this.activeCategory()) {
      return;
    }

    this.activeCategory.set(current);
  }

  /** Scroll the category tab strip horizontally only — never use scrollIntoView (it moves the page). */
  private syncCategoryNavIntoView(smooth: boolean): void {
    const track = this.host.nativeElement.querySelector<HTMLElement>('.category-nav-track');
    const active = track?.querySelector<HTMLElement>('.category-nav-item.active');
    if (!track || !active) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) {
      return;
    }

    const targetLeft = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
    const nextLeft = Math.max(0, Math.min(targetLeft, maxScroll));
    if (Math.abs(track.scrollLeft - nextLeft) < 2) {
      return;
    }

    track.scrollTo({ left: nextLeft, behavior: smooth ? 'smooth' : 'auto' });
  }

  categoryLabel(category: MenuCategory): string {
    if (category === BESTSELLERS_CATEGORY) {
      return this.translateService.instant('categories.bestsellers');
    }
    const key = `categories.${category}`;
    const translated = this.translateService.instant(key);
    if (translated !== key) {
      return translated;
    }
    return category
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  categoryBanner(category: MenuCategory): string | null {
    return categoryBannerSrc(category);
  }

  scrollCategoryRow(viewport: HTMLElement, direction: -1 | 1): void {
    const card = viewport.querySelector<HTMLElement>('.menu-card--slide');
    const track = viewport.querySelector<HTMLElement>('.category-slider-track');
    const gap = track ? Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0 : 0;
    const step = (card?.offsetWidth ?? viewport.clientWidth) + gap;
    viewport.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  addToCart(itemId: string): void {
    if (!this.authService.canShopAsCustomer()) {
      return;
    }
    if (this.blockOrderWithClosedNotice()) {
      return;
    }
    this.openProductPopup(itemId);
  }

  bestsellerItemCode(item: MenuItem): string {
    const match = String(item.id ?? '').match(/\d+/);
    return match ? match[0].padStart(2, '0') : '';
  }

  bestsellerUnitPrice(item: MenuItem, size?: PizzaSize): number {
    if (size) {
      return strictPizzaSizePrice(item, size) ?? 0;
    }
    return unitPriceForMenuItem(item);
  }

  bestsellerSizesForItem(item: MenuItem): ReadonlyArray<{ size: PizzaSize; cm: number }> {
    return availableBestsellerPizzaSizes(item);
  }

  bestsellerShowDiscount(): boolean {
    return this.cartService.isFulfillmentDiscountSelected();
  }

  bestsellerDiscountedPrice(listPrice: number): number {
    const rate = fulfillmentDiscountRate(
      this.cartService.fulfillmentType(),
      this.cartService.hasChosenFulfillment()
    );
    return applyFulfillmentDiscount(listPrice, rate);
  }

  openBestsellerItem(item: MenuItem, size?: PizzaSize, event?: Event): void {
    event?.stopPropagation();
    const isOrderIntent = Boolean(size) || event !== undefined;
    if (isOrderIntent && this.blockOrderWithClosedNotice()) {
      return;
    }
    this.openProductPopup(item.id, size);
  }

  openProductPopup(itemId: string, preferredSize?: PizzaSize): void {
    if (!this.authService.canShopAsCustomer()) {
      return;
    }
    if (!this.cartService.isFulfillmentComplete()) {
      this.pendingProductOpen = { itemId, preferredSize };
      this.fulfillmentPopupAreaOnly = false;
      this.showFulfillmentPopup = true;
      return;
    }
    const item = this.menuService.getItems().find((menuItem) => menuItem.id === itemId);
    if (!item) {
      return;
    }
    this.selectedItem = item;
    this.selectedSize =
      preferredSize && isPizzaCategory(item.category) ? preferredSize : 'small';
    this.popupQuantity = 1;
    this.popupInstructions = '';
    this.popupAddonGroups = addonGroupsForItem(item);
    this.popupSelectedAddons = {};
    document.body.style.overflow = 'hidden';
  }

  closeProductPopup(): void {
    this.selectedItem = null;
    document.body.style.overflow = '';
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
    if (this.blockOrderWithClosedNotice()) {
      return;
    }
    if (!this.validatePopupAddons()) {
      this.toastService.error(this.translateService.instant('toast.addonRequired'));
      return;
    }
    const itemName = this.selectedItem.name;
    const pizza = isPizzaCategory(this.selectedItem.category);
    const sizeLabel = pizza ? this.selectedSize : undefined;
    const baseUnit = unitPriceForMenuItem(this.selectedItem, sizeLabel);
    const addonExtra = addonSelectionsTotal(this.popupAddonGroups, this.popupSelectedAddons);
    const addons = serializeAddonSelections(this.popupSelectedAddons);
    const instructions = this.popupInstructions.trim() || undefined;
    this.cartService.addItem(this.selectedItem, {
      sizeLabel,
      addons: addons.length ? addons : undefined,
      instructions,
      quantity: this.popupQuantity,
      unitPrice: baseUnit + addonExtra
    });
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
    const addonExtra = addonSelectionsTotal(this.popupAddonGroups, this.popupSelectedAddons);
    return (unit + addonExtra) * this.popupQuantity;
  }

  addonGroupLabel(group: MenuAddonGroup): string {
    return this.menuLang() === 'de' ? group.labelDe : group.labelEn;
  }

  addonOptionLabel(group: MenuAddonGroup, optionId: string): string {
    const option = group.options.find((entry) => entry.id === optionId);
    if (!option) {
      return optionId;
    }
    return this.menuLang() === 'de' ? option.labelDe : option.labelEn;
  }

  selectSingleAddon(groupId: string, optionId: string): void {
    this.popupSelectedAddons = { ...this.popupSelectedAddons, [groupId]: optionId };
  }

  toggleMultiAddon(groupId: string, optionId: string): void {
    const current = this.popupSelectedAddons[groupId];
    const ids = Array.isArray(current) ? [...current] : current ? [current] : [];
    const index = ids.indexOf(optionId);
    if (index >= 0) {
      ids.splice(index, 1);
    } else {
      ids.push(optionId);
    }
    this.popupSelectedAddons = { ...this.popupSelectedAddons, [groupId]: ids };
  }

  isAddonSelected(groupId: string, optionId: string): boolean {
    const value = this.popupSelectedAddons[groupId];
    if (Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  }

  lineAddonLabels(line: CartItem): string[] {
    return addonLabelsForLine(line.addons, this.menuLang());
  }

  instructionsPlaceholder(): string {
    if (this.selectedItem?.category === 'calzone') {
      return this.translateService.instant('popup.instructionsCalzone');
    }
    return this.translateService.instant('popup.instructionsPlaceholder');
  }

  private menuLang(): 'de' | 'en' {
    return this.translateService.currentLang?.startsWith('en') ? 'en' : 'de';
  }

  private validatePopupAddons(): boolean {
    for (const group of this.popupAddonGroups) {
      if (!group.required) {
        continue;
      }
      const value = this.popupSelectedAddons[group.id];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return false;
      }
    }
    return true;
  }

  onBannerImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
  }

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

  goCheckout(event: Event): void {
    if (this.blockOrderWithClosedNotice()) {
      event.preventDefault();
      return;
    }
    if (!this.cartService.isFulfillmentComplete()) {
      event.preventDefault();
      this.pendingProductOpen = null;
      this.fulfillmentPopupAreaOnly = false;
      this.showFulfillmentPopup = true;
    }
  }

  selectSidebarDelivery(): void {
    this.cartService.setFulfillmentType('delivery');
    if (this.cartService.isFulfillmentComplete() && this.cartService.fulfillmentType() === 'delivery') {
      return;
    }
    this.pendingProductOpen = null;
    this.fulfillmentPopupAreaOnly = false;
    this.showFulfillmentPopup = true;
  }

  selectSidebarPickup(): void {
    this.cartService.confirmPickup();
  }

  openChangeAreaPopup(): void {
    this.pendingProductOpen = null;
    this.fulfillmentPopupAreaOnly = true;
    this.showFulfillmentPopup = true;
  }

  onFulfillmentConfirmed(): void {
    this.showFulfillmentPopup = false;
    this.fulfillmentPopupAreaOnly = false;
    const pending = this.pendingProductOpen;
    this.pendingProductOpen = null;
    if (pending) {
      this.openProductPopup(pending.itemId, pending.preferredSize);
    }
  }

  onFulfillmentDismissed(): void {
    this.showFulfillmentPopup = false;
    this.fulfillmentPopupAreaOnly = false;
    this.pendingProductOpen = null;
  }

  isDeliveryActive(): boolean {
    return this.cartService.fulfillmentType() === 'delivery' && this.cartService.isFulfillmentComplete();
  }

  isPickupActive(): boolean {
    return this.cartService.fulfillmentType() === 'pickup' && this.cartService.hasChosenFulfillment();
  }

  deliveryAreaLabel(): string {
    const area = this.cartService.deliveryArea();
    if (!area) {
      return '';
    }
    return `${area.city} ${area.area}`;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }
}
