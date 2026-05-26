import { Injectable } from '@angular/core';

import { Order } from '../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QzTrayService {
  /** Windows virtual drivers that open "Save as PDF" instead of printing on paper. */
  private static readonly VIRTUAL_PRINTER =
    /pdf|xps|onenote|fax|document writer|save as|send to|anydesk|virtual|redirected|snagit|cutepdf|adobe|bullzip|dopdf|primo/i;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private qz: any = null;
  private connectPromise: Promise<void> | null = null;
  private securityConfigured = false;

  isEnabled(): boolean {
    return environment.qzTray?.enabled === true;
  }

  async printOrderReceipt(order: Order): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const qz = await this.loadQz();
    await this.ensureConnected(qz);
    await this.configureSecurityIfNeeded(qz);

    const printerName = await this.resolvePrinterName(qz);
    const receiptWidthMm = environment.qzTray?.receiptWidthMm ?? 72;
    const pageWidthPx = Math.round(receiptWidthMm * 3.78);

    const config = qz.configs.create(printerName, {
      units: 'mm',
      size: { width: receiptWidthMm, height: null, custom: true },
      orientation: 'portrait',
      scaleContent: true,
      margins: { top: 3, right: 3, bottom: 3, left: 3 },
      copies: environment.qzTray?.copies ?? 1,
      jobName: `Order ${order.orderNumber || order.id}`,
      colorType: 'grayscale'
    });

    const html = this.buildReceiptHtml(order, receiptWidthMm);
    await qz.print(config, [
      {
        type: 'pixel',
        format: 'html',
        flavor: 'plain',
        data: html,
        options: { pageWidth: pageWidthPx }
      }
    ]);
  }

  private async loadQz(): Promise<any> {
    if (this.qz) {
      return this.qz;
    }
    const mod = await import('qz-tray');
    this.qz = mod.default;
    return this.qz;
  }

  private async ensureConnected(qz: any): Promise<void> {
    if (qz.websocket.isActive()) {
      return;
    }
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }
    this.connectPromise = (async () => {
      try {
        await qz.websocket.connect();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('already exists') && qz.websocket.isActive()) {
          return;
        }
        throw err;
      }
    })();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async configureSecurityIfNeeded(qz: any): Promise<void> {
    if (this.securityConfigured) {
      return;
    }
    const certUrl = environment.qzTray?.certificateUrl?.trim();
    const signUrl = environment.qzTray?.signRequestUrl?.trim();
    if (certUrl && signUrl && qz.security) {
      qz.security.setCertificatePromise((resolve: (v: string) => void, reject: (e: Error) => void) => {
        fetch(certUrl, { cache: 'no-store', credentials: 'omit' })
          .then((r) => {
            if (!r.ok) {
              throw new Error(`QZ certificate fetch failed: ${r.status}`);
            }
            return r.text();
          })
          .then(resolve)
          .catch((e: unknown) => reject(e instanceof Error ? e : new Error(String(e))));
      });
      qz.security.setSignaturePromise((toSign: string) => {
        return (resolve: (v: string) => void, reject: (e: Error) => void) => {
          fetch(signUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: toSign,
            credentials: 'include',
            cache: 'no-store'
          })
            .then((r) => {
              if (!r.ok) {
                throw new Error(`QZ sign failed: ${r.status}`);
              }
              return r.text();
            })
            .then(resolve)
            .catch((e: unknown) => reject(e instanceof Error ? e : new Error(String(e))));
        };
      });
    }
    this.securityConfigured = true;
  }

  private isVirtualPrinter(name: string): boolean {
    return QzTrayService.VIRTUAL_PRINTER.test(name);
  }

  private pickPhysicalPrinter(names: string[]): string | null {
    return names.find((name) => name?.trim() && !this.isVirtualPrinter(name)) ?? null;
  }

  private async resolvePrinterName(qz: any): Promise<string> {
    const configured = environment.qzTray?.printerName?.trim();
    if (configured) {
      if (this.isVirtualPrinter(configured)) {
        console.warn('[QZ Tray] printerName looks like a PDF/virtual driver:', configured);
      }
      return configured;
    }

    let defaultPrinter: string | null = null;
    try {
      defaultPrinter = await qz.printers.getDefault();
    } catch {
      defaultPrinter = null;
    }
    if (defaultPrinter && !this.isVirtualPrinter(defaultPrinter)) {
      return defaultPrinter;
    }

    const found = await qz.printers.find();
    const list: string[] =
      typeof found === 'string' ? [found] : Array.isArray(found) ? (found as string[]) : [];
    const physical = this.pickPhysicalPrinter(list);
    if (physical) {
      return physical;
    }

    if (defaultPrinter) {
      throw new Error(
        `Windows default printer is "${defaultPrinter}" (PDF/virtual). Set qzTray.printerName in environment.ts to your real printer name.`
      );
    }

    throw new Error(
      'No physical printer found. Install a printer in Windows and set qzTray.printerName in environment.ts.'
    );
  }

  private buildReceiptHtml(order: Order, widthMm: number): string {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const money = (n: number) =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(Number.isFinite(n) ? n : 0);

    const fulfillment =
      order.fulfillmentType === 'pickup' ? 'Abholung' : order.fulfillmentType === 'delivery' ? 'Lieferung' : order.fulfillmentType;
    const pay = order.paymentMethod === 'paypal' ? 'PayPal' : 'Barzahlung';

    const lines = order.items
      .map((it) => {
        const size = it.sizeLabel ? ` (${esc(it.sizeLabel)})` : '';
        const name = esc(it.itemName) + size;
        return `<tr class="line"><td class="line-name">${it.quantity}× ${name}</td><td class="line-price">${money(it.lineTotal)}</td></tr>`;
      })
      .join('');

    const sub =
      order.subtotal != null
        ? `<tr class="line"><td class="line-name">Zwischensumme</td><td class="line-price">${money(order.subtotal)}</td></tr>`
        : '';
    const del =
      order.deliveryFee != null && order.deliveryFee > 0
        ? `<tr class="line"><td class="line-name">Liefergebühr</td><td class="line-price">${money(order.deliveryFee)}</td></tr>`
        : '';

    const orderLabel = order.orderNumber || order.id;
    const when = new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt));

    const innerWidthMm = Math.max(58, widthMm - 8);

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      @page { size: ${widthMm}mm auto; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body { width: ${innerWidthMm}mm; max-width: ${innerWidthMm}mm; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.35; color: #000; }
      .receipt { width: 100%; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word; }
      h1 { font-size: 12px; margin: 0 0 4px; text-align: center; line-height: 1.2; }
      .meta { font-size: 9px; margin-bottom: 6px; text-align: center; }
      .block { margin-bottom: 6px; word-break: break-word; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .line-name { width: 68%; padding: 2px 4px 2px 0; vertical-align: top; word-break: break-word; }
      .line-price { width: 32%; padding: 2px 0; text-align: right; vertical-align: top; word-break: break-word; }
      .total .line-name, .total .line-price { font-weight: 700; padding-top: 4px; font-size: 11px; }
      hr { border: none; border-top: 1px dashed #666; margin: 6px 0; }
      .thanks { text-align: center; margin-top: 8px; font-size: 9px; }
    </style></head><body><div class="receipt">
      <h1>Green Apple — Bestellung</h1>
      <div class="meta">Nr. <strong>${esc(orderLabel)}</strong><br/>${esc(when)}</div>
      <hr/>
      <div class="block"><strong>Kunde</strong><br/>
        ${esc(order.customer.name)}<br/>
        ${esc(order.customer.phone)}${
          order.customer.address
            ? `<br/>${esc(order.customer.address)}`
            : ''
        }
      </div>
      <div class="block"><strong>${esc(fulfillment)}</strong> · ${esc(pay)} · Status: ${esc(order.status)}</div>
      <hr/>
      <table>${lines}</table>
      ${sub || del ? `<table style="margin-top:4px;">${sub}${del}</table>` : ''}
      <table class="total"><tr class="line"><td class="line-name">Gesamt</td><td class="line-price">${money(order.total)}</td></tr></table>
      <p class="thanks">Vielen Dank!</p>
    </div></body></html>`;
  }
}
