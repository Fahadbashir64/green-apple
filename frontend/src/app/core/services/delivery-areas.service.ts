import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { DeliveryArea } from '../models/delivery-area.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class DeliveryAreasService {
  private readonly publicAreasSignal = signal<DeliveryArea[]>([]);
  private readonly adminAreasSignal = signal<DeliveryArea[]>([]);

  readonly publicAreas = this.publicAreasSignal.asReadonly();
  readonly adminAreas = this.adminAreasSignal.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  loadPublicAreas(): Observable<DeliveryArea[]> {
    return this.http.get<DeliveryArea[]>(`${API_BASE_URL}/orders/delivery-areas`).pipe(
      map((rows) => rows.map(this.normalize)),
      tap((rows) => this.publicAreasSignal.set(rows))
    );
  }

  loadAdminAreas(): Observable<DeliveryArea[]> {
    return this.http
      .get<DeliveryArea[]>(`${API_BASE_URL}/orders/delivery-areas/admin`, {
        headers: this.authService.authHeaders()
      })
      .pipe(
        map((rows) => rows.map(this.normalize)),
        tap((rows) => this.adminAreasSignal.set(rows))
      );
  }

  createArea(payload: { city: string; area: string; charge: number; isActive?: boolean }): Observable<DeliveryArea> {
    return this.http
      .post<DeliveryArea>(`${API_BASE_URL}/orders/delivery-areas`, payload, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(this.normalize));
  }

  updateArea(
    id: number,
    payload: { city?: string; area?: string; charge?: number; isActive?: boolean }
  ): Observable<DeliveryArea> {
    return this.http
      .patch<DeliveryArea>(`${API_BASE_URL}/orders/delivery-areas/${id}`, payload, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(this.normalize));
  }

  deleteArea(id: number): Observable<void> {
    return this.http
      .delete(`${API_BASE_URL}/orders/delivery-areas/${id}`, {
        headers: this.authService.authHeaders()
      })
      .pipe(map(() => void 0));
  }

  private normalize = (area: DeliveryArea): DeliveryArea => ({
    ...area,
    id: Number(area.id),
    city: String(area.city ?? '').trim(),
    area: String(area.area ?? '').trim(),
    charge: Number(area.charge) || 0,
    isActive: Boolean(area.isActive)
  });
}
