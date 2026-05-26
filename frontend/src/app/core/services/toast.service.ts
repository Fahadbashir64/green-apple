import { Injectable, computed, signal } from '@angular/core';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastOptions {
  type?: ToastType;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  private nextId = 1;

  readonly toasts = computed(() => this.toastsSignal());

  show(text: string, options: ToastOptions = {}): void {
    const id = this.nextId++;
    const type = options.type ?? 'info';
    const durationMs = options.durationMs ?? 2600;
    const toast: ToastMessage = { id, text, type };

    // Defer so callers can finish the current change-detection turn (avoids NG0100).
    queueMicrotask(() => {
      this.toastsSignal.update((list) => [...list, toast].slice(-4));
    });

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(text: string, durationMs = 2400): void {
    this.show(text, { type: 'success', durationMs });
  }

  error(text: string, durationMs = 2800): void {
    this.show(text, { type: 'error', durationMs });
  }

  info(text: string, durationMs = 2200): void {
    this.show(text, { type: 'info', durationMs });
  }

  dismiss(id: number): void {
    queueMicrotask(() => {
      this.toastsSignal.update((list) => list.filter((toast) => toast.id !== id));
    });
  }
}
