export interface PayPalButtonsInstance {
  render(container: HTMLElement): Promise<void>;
  close(): void;
}

export interface PayPalButtonsConfig {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

export interface PayPalNamespace {
  Buttons(config: PayPalButtonsConfig): PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
