import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { PayPalButtonsInstance } from '../../../types/paypal-checkout';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface PayPalConfig {
  enabled: boolean;
  clientId: string;
  currency: string;
}

export interface PayPalCreateResponse {
  paypalOrderId: string;
  total: number;
  currency: string;
}

const API_BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class PaypalService {
  private sdkLoaded = false;
  private sdkLoading: Promise<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  getConfig(): Observable<PayPalConfig> {
    return this.http.get<PayPalConfig>(`${API_BASE_URL}/payments/paypal/config`);
  }

  createServerOrder(orderDraft: Record<string, unknown>): Observable<PayPalCreateResponse> {
    return this.http.post<PayPalCreateResponse>(`${API_BASE_URL}/payments/paypal/create-order`, orderDraft, {
      headers: this.authService.authHeaders()
    });
  }

  captureServerOrder(paypalOrderId: string, orderDraft: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/payments/paypal/capture`, { paypalOrderId, order: orderDraft }, {
      headers: this.authService.authHeaders()
    });
  }

  loadSdk(clientId: string, currency: string): Promise<void> {
    if (this.sdkLoaded && window.paypal) {
      return Promise.resolve();
    }
    if (this.sdkLoading) {
      return this.sdkLoading;
    }

    this.sdkLoading = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-paypal-sdk="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => {
          this.sdkLoaded = true;
          resolve();
        });
        existing.addEventListener('error', () => reject(new Error('PayPal SDK failed to load')));
        if (window.paypal) {
          this.sdkLoaded = true;
          resolve();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
      script.async = true;
      script.dataset['paypalSdk'] = 'true';
      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('PayPal SDK failed to load'));
      document.body.appendChild(script);
    });

    return this.sdkLoading;
  }

  async renderButtons(
    container: HTMLElement,
    handlers: {
      createOrder: () => Promise<string>;
      onApprove: (paypalOrderId: string) => Promise<void>;
      onCancel?: () => void;
      onError?: (error: unknown) => void;
    }
  ): Promise<PayPalButtonsInstance | null> {
    if (!window.paypal?.Buttons) {
      throw new Error('PayPal SDK is not available');
    }

    container.replaceChildren();
    const buttons = window.paypal.Buttons({
      createOrder: handlers.createOrder,
      onApprove: async (data) => handlers.onApprove(data.orderID),
      onCancel: handlers.onCancel,
      onError: handlers.onError
    });
    await buttons.render(container);
    return buttons;
  }

  async createOrderId(orderDraft: Record<string, unknown>): Promise<string> {
    const response = await firstValueFrom(this.createServerOrder(orderDraft));
    return response.paypalOrderId;
  }
}
