import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { DeliveryArea } from '../../../core/models/delivery-area.model';
import { FulfillmentType } from '../../../core/models/fulfillment.model';
import { CartService } from '../../../core/services/cart.service';
import { DeliveryAreasService } from '../../../core/services/delivery-areas.service';

@Component({
  selector: 'app-fulfillment-choice-popup',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './fulfillment-choice-popup.component.html',
  styleUrl: './fulfillment-choice-popup.component.scss'
})
export class FulfillmentChoicePopupComponent implements OnChanges {
  private readonly deliveryAreasService = inject(DeliveryAreasService);
  readonly cartService = inject(CartService);

  @Input() visible = false;
  @Input() areaOnly = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  draftType: FulfillmentType = 'delivery';
  draftAreaId: number | null = null;
  areaSearch = '';
  areas: DeliveryArea[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue) {
      this.resetDraft();
      this.loadAreas();
      document.body.style.overflow = 'hidden';
      return;
    }
    if (changes['visible']?.previousValue && !changes['visible']?.currentValue) {
      document.body.style.overflow = '';
    }
  }

  filteredAreas(): DeliveryArea[] {
    const query = this.areaSearch.trim().toLowerCase();
    if (!query) {
      return this.areas;
    }
    return this.areas.filter((area) => {
      const label = `${area.city} ${area.area}`.toLowerCase();
      return label.includes(query);
    });
  }

  selectType(type: FulfillmentType): void {
    this.draftType = type;
    if (type === 'pickup') {
      this.draftAreaId = null;
    }
  }

  selectArea(area: DeliveryArea): void {
    if (!area.isActive) {
      return;
    }
    this.draftAreaId = area.id;
  }

  canConfirm(): boolean {
    if (this.draftType === 'pickup') {
      return true;
    }
    return this.draftAreaId != null;
  }

  confirm(): void {
    if (!this.canConfirm()) {
      return;
    }
    if (this.draftType === 'pickup') {
      this.cartService.confirmPickup();
    } else {
      const area = this.areas.find((entry) => entry.id === this.draftAreaId);
      if (!area) {
        return;
      }
      this.cartService.confirmDelivery({
        id: area.id,
        city: area.city,
        area: area.area,
        charge: area.charge
      });
    }
    document.body.style.overflow = '';
    this.confirmed.emit();
  }

  close(): void {
    document.body.style.overflow = '';
    this.dismissed.emit();
  }

  areaLabel(area: DeliveryArea): string {
    return `${area.city} ${area.area}`;
  }

  selectedAreaLabel(): string {
    const area = this.areas.find((entry) => entry.id === this.draftAreaId);
    return area ? this.areaLabel(area) : '';
  }

  private resetDraft(): void {
    const storedType = this.cartService.fulfillmentType();
    const storedArea = this.cartService.deliveryArea();
    this.draftType = this.areaOnly ? 'delivery' : storedType;
    this.draftAreaId = storedArea?.id ?? null;
    this.areaSearch = '';
  }

  private loadAreas(): void {
    const cached = this.deliveryAreasService.publicAreas();
    if (cached.length > 0) {
      this.areas = cached;
      return;
    }
    this.deliveryAreasService.loadPublicAreas().subscribe({
      next: (rows) => {
        this.areas = rows;
      },
      error: () => {
        this.areas = [];
      }
    });
  }
}
