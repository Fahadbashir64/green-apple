import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { DeliveryArea } from '../../../../core/models/delivery-area.model';
import { FulfillmentType } from '../../../../core/models/fulfillment.model';
import { PaymentMethod } from '../../../../core/models/order.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { DeliveryAreasService } from '../../../../core/services/delivery-areas.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-checkout-page',
  imports: [TranslatePipe, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent implements OnInit {
  readonly checkoutForm;
  readonly deliveryAreas = signal<DeliveryArea[]>([]);

  confirmationMessage = '';
  isPlacingOrder = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef,
    public readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly ordersService: OrdersService,
    private readonly deliveryAreasService: DeliveryAreasService,
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
        this.cartService.setFulfillmentType(type);
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
      });
  }

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.checkoutForm.patchValue({
        name: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }

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

    this.deliveryAreasService.loadPublicAreas().subscribe({
      next: (areas) => {
        this.deliveryAreas.set(areas);
        const storedAreaId = this.checkoutForm.get('deliveryAreaId')!.value;
        if (storedAreaId != null && !areas.some((a) => a.id === Number(storedAreaId))) {
          this.checkoutForm.get('deliveryAreaId')!.setValue(null);
        }
      }
    });
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

  placeOrder(): void {
    if (this.authService.isAdmin()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }

    if (this.isPlacingOrder) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.toastService.error(this.translateService.instant('toast.loginRequired'));
      this.router.navigateByUrl('/login');
      return;
    }

    if (this.checkoutForm.invalid || this.cartService.cartItems().length === 0) {
      this.checkoutForm.markAllAsTouched();
      const toastKey = this.cartService.cartItems().length === 0 ? 'toast.cartEmpty' : 'toast.completeRequiredFields';
      this.toastService.error(this.translateService.instant(toastKey));
      return;
    }

    const { name, phone, address, paymentMethod, fulfillmentType, deliveryAreaId } = this.checkoutForm.getRawValue();
    let loaderVisible = false;
    const loaderDelay = setTimeout(() => {
      this.isPlacingOrder = true;
      loaderVisible = true;
    }, 220);
    this.ordersService
      .placeOrder(
      { name: name ?? '', phone: phone ?? '', address: (address ?? '').trim() },
      this.cartService.cartItems(),
      (paymentMethod ?? 'cod') as PaymentMethod,
      (fulfillmentType ?? 'delivery') as FulfillmentType,
      this.cartService.grandTotal(),
      fulfillmentType === 'delivery' && deliveryAreaId != null ? Number(deliveryAreaId) : null
      )
      .pipe(
        finalize(() => {
          clearTimeout(loaderDelay);
          if (loaderVisible) {
            this.isPlacingOrder = false;
          }
        })
      )
      .subscribe({
        next: (order) => {
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
          const addressControl = this.checkoutForm.get('address')!;
          addressControl.setValidators(this.addressValidators('delivery'));
          addressControl.updateValueAndValidity();
          const areaControl = this.checkoutForm.get('deliveryAreaId')!;
          areaControl.setValidators(this.deliveryAreaValidators('delivery'));
          areaControl.updateValueAndValidity();
          this.cartService.setDeliveryArea(null);
          setTimeout(() => this.router.navigateByUrl('/menu'), 900);
        },
        error: (error) => {
          this.isPlacingOrder = false;
          this.toastService.error(error?.error?.message || this.translateService.instant('toast.orderFailed'));
        }
      });
  }

  useFallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = '/assets/images/placeholder-food.svg';
  }
}
