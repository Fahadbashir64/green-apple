import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DeliveryArea } from '../../../../core/models/delivery-area.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DeliveryAreasService } from '../../../../core/services/delivery-areas.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-delivery-areas-page',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './admin-delivery-areas-page.component.html',
  styleUrl: './admin-delivery-areas-page.component.scss'
})
export class AdminDeliveryAreasPageComponent implements OnInit {
  readonly deliveryAreas = signal<DeliveryArea[]>([]);
  readonly editingId = signal<number | null>(null);

  newArea = { city: '', area: '', charge: 0 };
  editArea = { city: '', area: '', charge: 0 };
  savingArea = false;
  savingEdit = false;

  constructor(
    private readonly deliveryAreasService: DeliveryAreasService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      return;
    }
    this.reload();
  }

  reload(): void {
    this.deliveryAreasService.loadAdminAreas().subscribe({
      next: (areas) => this.deliveryAreas.set(areas),
      error: () => this.toastService.error('Could not load delivery areas.')
    });
  }

  addDeliveryArea(): void {
    const city = (this.newArea.city || '').trim();
    const area = (this.newArea.area || '').trim();
    const charge = Number(this.newArea.charge);
    if (!city || !area) {
      this.toastService.error('City and area are required.');
      return;
    }
    if (!Number.isFinite(charge) || charge < 0) {
      this.toastService.error('Delivery charge must be 0 or higher.');
      return;
    }
    this.savingArea = true;
    this.deliveryAreasService
      .createArea({ city, area, charge, isActive: true })
      .subscribe({
        next: () => {
          this.toastService.success('Delivery area saved.');
          this.newArea = { city: '', area: '', charge: 0 };
          this.reload();
        },
        error: () => this.toastService.error('Could not save delivery area.'),
        complete: () => (this.savingArea = false)
      });
  }

  startEdit(area: DeliveryArea): void {
    this.editingId.set(area.id);
    this.editArea = { city: area.city, area: area.area, charge: area.charge };
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(): void {
    const id = this.editingId();
    if (id == null) {
      return;
    }
    const city = (this.editArea.city || '').trim();
    const area = (this.editArea.area || '').trim();
    const charge = Number(this.editArea.charge);
    if (!city || !area) {
      this.toastService.error('City and area are required.');
      return;
    }
    if (!Number.isFinite(charge) || charge < 0) {
      this.toastService.error('Delivery charge must be 0 or higher.');
      return;
    }
    this.savingEdit = true;
    this.deliveryAreasService
      .updateArea(id, { city, area, charge })
      .subscribe({
        next: (updated) => {
          this.deliveryAreas.set(this.deliveryAreas().map((a) => (a.id === updated.id ? updated : a)));
          this.editingId.set(null);
          this.toastService.success('Delivery area updated.');
        },
        error: () => this.toastService.error('Could not update delivery area.'),
        complete: () => (this.savingEdit = false)
      });
  }

  toggleActive(area: DeliveryArea): void {
    this.deliveryAreasService.updateArea(area.id, { isActive: !area.isActive }).subscribe({
      next: (updated) => {
        this.deliveryAreas.set(this.deliveryAreas().map((a) => (a.id === updated.id ? updated : a)));
        this.toastService.info(updated.isActive ? 'Delivery area enabled.' : 'Delivery area disabled.');
      },
      error: () => this.toastService.error('Could not update delivery area.')
    });
  }

  deleteArea(area: DeliveryArea): void {
    this.deliveryAreasService.deleteArea(area.id).subscribe({
      next: () => {
        this.deliveryAreas.set(this.deliveryAreas().filter((a) => a.id !== area.id));
        this.toastService.info('Delivery area deleted.');
      },
      error: () => this.toastService.error('Could not delete delivery area.')
    });
  }
}
