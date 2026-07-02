import { CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, firstValueFrom } from 'rxjs';

import { DeliveryArea } from '../../../../core/models/delivery-area.model';
import { FulfillmentType } from '../../../../core/models/fulfillment.model';
import { CustomerInfo, Order, PaymentMethod } from '../../../../core/models/order.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { DeliveryAreasService } from '../../../../core/services/delivery-areas.service';
import { OpeningHoursService } from '../../../../core/services/opening-hours.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { PaypalService } from '../../../../core/services/paypal.service';
import { QzTrayService } from '../../../../core/services/qz-tray.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CartItem } from '../../../../core/models/cart-item.model';
import { addonLabelsForLine } from '../../../../core/utils/menu-addons';
import { environment } from '../../../../../environments/environment';
import type { PayPalButtonsInstance } from '../../../../../types/paypal-checkout';

@Component({
  selector: 'app-checkout-page',
  imports: [TranslatePipe, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent implements OnInit, AfterViewInit {
  @ViewChild('paypalButtonHost') paypalButtonHost?: ElementRef<HTMLElement>;

  readonly showPayPalOption = environment.payments?.showPayPal === true;

  readonly checkoutForm;
  readonly deliveryAreas = signal<DeliveryArea[]>([]);
  readonly paypalEnabled = signal(false);
  readonly paypalUnavailable = signal(false);
  readonly isPayPalSelected = signal(false);

  confirmationMessage = '';
  isPlacingOrder = false;

  private paypalButtons: PayPalButtonsInstance | null = null;
  private paypalCurrency = 'EUR';
  private paypalMountPending = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef,
    public readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly ordersService: OrdersService,
    private readonly paypalService: PaypalService,
    private readonly qzTrayService: QzTrayService,
    private readonly deliveryAreasService: DeliveryAreasService,
    private readonly openingHours: OpeningHoursService,
    private readonly translateService: TranslateService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {
    const initialFulfillment = this.cartService.fulfillmentType();
    const storedArea = this.cartService.deliveryArea();

    this.checkoutForm = this.formBuilder.group({
      fulfillmentType: [initialFulfillment, Validators.required],
      deliveryAreaId: [storedArea ? storedArea.id : null, this.deliveryAreaValidators(initialFulfillment)],
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', this.addressValidators(initialFulfillment)],
      instructions: [''],
      paymentMethod: ['cod' as PaymentMethod, Validators.required]
    });

    this.cartService.setFulfillmentType(initialFulfillment);

    this.checkoutForm
      .get('fulfillmentType')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const type = value as FulfillmentType;
        if (type === 'pickup') {
          this.cartService.confirmPickup();
        } else {
          this.cartService.setFulfillmentType('delivery');
        }
        const addressControl = this.checkoutForm.get('address')!;
        addressControl.setValidators(this.addressValidators(type));
        addressControl.updateValueAndValidity();
        const areaControl = this.checkoutForm.get('deliveryAreaId')!;
        areaControl.setValidators(this.deliveryAreaValidators(type));
        if (type === 'pickup') {
          areaControl.setValue(null, { emitEvent: false });
          this.cartService.setDeliveryArea(null);
        }
        areaControl.updateValueAndValidity();
        void this.syncPayPalButtons();
      });

    this.checkoutForm
      .get('deliveryAreaId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const id = value == null ? null : Number(value);
        if (id == null || !Number.isFinite(id)) {
          this.cartService.setDeliveryArea(null);
          return;
        }
        const area = this.deliveryAreas().find((a) => a.id === id);
        if (!area) {
          this.cartService.setDeliveryArea(null);
          return;
        }
        this.cartService.setDeliveryArea({
          id: area.id,
          city: area.city,
          area: area.area,
          charge: area.charge
        });
        if (this.checkoutForm.get('fulfillmentType')?.value === 'delivery') {
          this.cartService.confirmDelivery({
            id: area.id,
            city: area.city,
            area: area.area,
            charge: area.charge
          });
        }
      });

    this.checkoutForm
      .get('paymentMethod')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const method = (value ?? 'cod') as PaymentMethod;
        this.isPayPalSelected.set(method === 'paypal');
        if (method === 'paypal' && !this.paypalEnabled()) {
          this.checkoutForm.patchValue({ paymentMethod: 'cod' }, { emitEvent: false });
          this.isPayPalSelected.set(false);
          this.toastService.error(this.translateService.instant('payments.paypalUnavailable'));
        } else {
          void this.syncPayPalButtons();
        }
      });
  }

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }
    if (this.authService.isSubAdmin()) {
      this.router.navigateByUrl('/orders');
      return;
    }

    if (this.showPayPalOption) {
      this.paypalService.getConfig().subscribe({
        next: (config) => {
          this.paypalEnabled.set(config.enabled);
          this.paypalUnavailable.set(!config.enabled);
          this.paypalCurrency = config.currency || 'EUR';
          if (config.enabled && config.clientId) {
            void this.paypalService.loadSdk(config.clientId, this.paypalCurrency).catch(() => {
              this.paypalEnabled.set(false);
              this.paypalUnavailable.set(true);
            });
          }
          void this.syncPayPalButtons();
        },
        error: () => {
          this.paypalEnabled.set(false);
          this.paypalUnavailable.set(true);
        }
      });
    }

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.checkoutForm.patchValue({
        name: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }

    this.loadDeliveryAreas();

    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.authService.fetchProfile().subscribe({
      next: (user) => {
        this.checkoutForm.patchValue({
          name: user.fullName || '',
          email: user.email || '',
          phone: user.phone || ''
        });
      }
    });
  }

  private loadDeliveryAreas(): void {
    this.deliveryAreasService.loadPublicAreas().subscribe({
      next: (areas) => {
        this.deliveryAreas.set(areas);
        const storedAreaId = this.checkoutForm.get('deliveryAreaId')!.value;
        if (storedAreaId != null && !areas.some((a) => a.id === Number(storedAreaId))) {
          this.checkoutForm.get('deliveryAreaId')!.setValue(null);
        }
      },
      error: () => {
        this.deliveryAreas.set([]);
        this.toastService.error(this.translateService.instant('toast.deliveryAreasLoadFailed'));
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.showPayPalOption) {
      void this.syncPayPalButtons();
    }
  }

  private addressValidators(type: FulfillmentType) {
    if (type === 'pickup') {
      return [];
    }
    return [Validators.required, Validators.minLength(8)];
  }

  private deliveryAreaValidators(type: FulfillmentType) {
    return type === 'delivery' ? [Validators.required] : [];
  }

  private buildCustomer(): CustomerInfo | null {
    const { name, phone, address, email } = this.checkoutForm.getRawValue();
    return {
      name: name ?? '',
      phone: phone ?? '',
      email: email ?? '',
      address: (address ?? '').trim()
    };
  }

  private validateCheckout(): boolean {
    if (!this.openingHours.canOrder()) {
      this.openingHours.showNotice();
      return false;
    }

    if (!this.authService.isLoggedIn()) {
      this.toastService.error(this.translateService.instant('toast.loginRequired'));
      this.router.navigateByUrl('/login');
      return false;
    }

    if (this.checkoutForm.invalid || this.cartService.cartItems().length === 0) {
      this.checkoutForm.markAllAsTouched();
      const toastKey = this.cartService.cartItems().length === 0 ? 'toast.cartEmpty' : 'toast.completeRequiredFields';
      this.toastService.error(this.translateService.instant(toastKey));
      return false;
    }

    return true;
  }

  placeOrder(): void {
    if (this.authService.isAdmin()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }
    if (this.authService.isSubAdmin()) {
      this.router.navigateByUrl('/orders');
      return;
    }
    if (this.isPlacingOrder) {
      return;
    }
    if (!this.openingHours.canOrder()) {
      this.openingHours.showNotice();
      return;
    }
    if (this.checkoutForm.get('paymentMethod')?.value === 'paypal') {
      return;
    }
    if (!this.validateCheckout()) {
      return;
    }

    const customer = this.buildCustomer();
    if (!customer) {
      return;
    }

    const { paymentMethod, fulfillmentType, deliveryAreaId } = this.checkoutForm.getRawValue();
    this.submitOrder(
      this.ordersService.placeOrder(
        customer,
        this.cartService.cartItems(),
        (paymentMethod ?? 'cod') as PaymentMethod,
        (fulfillmentType ?? 'delivery') as FulfillmentType,
        this.cartService.grandTotal(),
        fulfillmentType === 'delivery' && deliveryAreaId != null ? Number(deliveryAreaId) : null
      )
    );
  }

  private submitOrder(request$: ReturnType<OrdersService['placeOrder']>): void {
    let loaderVisible = false;
    const loaderDelay = setTimeout(() => {
      this.isPlacingOrder = true;
      loaderVisible = true;
    }, 220);

    request$
      .pipe(
        finalize(() => {
          clearTimeout(loaderDelay);
          if (loaderVisible) {
            this.isPlacingOrder = false;
          }
        })
      )
      .subscribe({
        next: (order) => this.handleOrderSuccess(order),
        error: (error) => {
          this.isPlacingOrder = false;
          this.toastService.error(error?.error?.message || this.translateService.instant('toast.orderFailed'));
          void this.syncPayPalButtons();
        }
      });
  }

  private handleOrderSuccess(order: Order): void {
    if (environment.qzTray?.enabled && environment.qzTray?.autoPrintAfterCheckout) {
      void this.qzTrayService.printOrderReceipt(order).catch((err: unknown) => {
        console.warn('[QZ Tray] Checkout print failed', err);
      });
    }
    this.cartService.clear();
    this.confirmationMessage = this.translateService.instant('pages.checkout.confirmation', { id: order.id });
    sessionStorage.setItem('ga_order_placed', '1');
    this.checkoutForm.reset({
      name: '',
      phone: '',
      email: '',
      address: '',
      instructions: '',
      fulfillmentType: 'delivery',
      deliveryAreaId: null,
      paymentMethod: 'cod'
    });
    this.isPayPalSelected.set(false);
    const addressControl = this.checkoutForm.get('address')!;
    addressControl.setValidators(this.addressValidators('delivery'));
    addressControl.updateValueAndValidity();
    const areaControl = this.checkoutForm.get('deliveryAreaId')!;
    areaControl.setValidators(this.deliveryAreaValidators('delivery'));
    areaControl.updateValueAndValidity();
    this.cartService.setDeliveryArea(null);
    this.unmountPayPalButtons();
    setTimeout(() => this.router.navigateByUrl('/menu'), 900);
  }

  private async syncPayPalButtons(): Promise<void> {
    if (!this.showPayPalOption || this.paypalMountPending) {
      return;
    }
    if (!this.isPayPalSelected() || !this.paypalEnabled() || !this.paypalButtonHost?.nativeElement) {
      this.unmountPayPalButtons();
      return;
    }

    this.paypalMountPending = true;
    try {
      this.unmountPayPalButtons();
      const config = await firstValueFrom(this.paypalService.getConfig());
      if (!config.enabled || !config.clientId) {
        return;
      }
      await this.paypalService.loadSdk(config.clientId, config.currency || this.paypalCurrency);
      this.paypalButtons = await this.paypalService.renderButtons(this.paypalButtonHost.nativeElement, {
        createOrder: async () => {
          if (!this.validateCheckout()) {
            throw new Error('checkout-invalid');
          }
          const customer = this.buildCustomer();
          if (!customer) {
            throw new Error('checkout-invalid');
          }
          const { fulfillmentType, deliveryAreaId } = this.checkoutForm.getRawValue();
          const draft = this.ordersService.buildOrderPayload(
            customer,
            this.cartService.cartItems(),
            'paypal',
            (fulfillmentType ?? 'delivery') as FulfillmentType,
            fulfillmentType === 'delivery' && deliveryAreaId != null ? Number(deliveryAreaId) : null
          );
          return this.paypalService.createOrderId(draft);
        },
        onApprove: async (paypalOrderId) => {
          const customer = this.buildCustomer();
          if (!customer) {
            return;
          }
          const { fulfillmentType, deliveryAreaId } = this.checkoutForm.getRawValue();
          this.submitOrder(
            this.ordersService.capturePayPalOrder(
              paypalOrderId,
              customer,
              this.cartService.cartItems(),
              (fulfillmentType ?? 'delivery') as FulfillmentType,
              this.cartService.grandTotal(),
              fulfillmentType === 'delivery' && deliveryAreaId != null ? Number(deliveryAreaId) : null
            )
          );
        },
        onCancel: () => {
          this.toastService.error(this.translateService.instant('payments.paypalCancelled'));
        },
        onError: (error) => {
          if (error instanceof Error && error.message === 'checkout-invalid') {
            return;
          }
          this.toastService.error(this.translateService.instant('payments.paypalFailed'));
          console.warn('[PayPal]', error);
        }
      });
    } catch (error) {
      console.warn('[PayPal] Failed to mount buttons', error);
      this.paypalEnabled.set(false);
      this.paypalUnavailable.set(true);
      this.checkoutForm.patchValue({ paymentMethod: 'cod' }, { emitEvent: false });
      this.isPayPalSelected.set(false);
    } finally {
      this.paypalMountPending = false;
    }
  }

  private unmountPayPalButtons(): void {
    if (this.paypalButtons) {
      try {
        this.paypalButtons.close();
      } catch {
        // ignore teardown errors
      }
      this.paypalButtons = null;
    }
    this.paypalButtonHost?.nativeElement.replaceChildren();
  }

  lineAddonLabels(line: CartItem): string[] {
    return addonLabelsForLine(line.addons, this.menuLang());
  }

  private menuLang(): 'de' | 'en' {
    return this.translateService.currentLang?.startsWith('en') ? 'en' : 'de';
  }
}
