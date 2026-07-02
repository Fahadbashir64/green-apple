import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { HOLIDAY_HOURS, RESTAURANT_CONTACT } from '../../../core/constants/restaurant-contact';
import { WEEKDAY_I18N_KEYS } from '../../../core/constants/opening-hours';
import { OpeningHoursService } from '../../../core/services/opening-hours.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contact-popup',
  imports: [TranslatePipe],
  templateUrl: './contact-popup.component.html',
  styleUrl: './contact-popup.component.scss'
})
export class ContactPopupComponent implements OnDestroy {
  readonly contact = RESTAURANT_CONTACT;
  readonly holidays = HOLIDAY_HOURS;
  readonly showPayPal = environment.payments?.showPayPal === true;

  showHolidayTimings = false;
  showDisclaimer = false;
  readonly closed = output<void>();

  readonly mapEmbedSrc: SafeResourceUrl;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  constructor(
    public readonly openingHours: OpeningHoursService,
    private readonly translateService: TranslateService,
    sanitizer: DomSanitizer
  ) {
    const query = encodeURIComponent(RESTAURANT_CONTACT.mapQuery);
    this.mapEmbedSrc = sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${query}&hl=de&z=15&output=embed`
    );

    if (typeof document !== 'undefined') {
      this.doc.body.appendChild(this.host.nativeElement);
      this.doc.body.classList.add('contact-popup-open');
    }
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('contact-popup-open');
  }

  close(): void {
    this.closed.emit();
  }

  mapOpenUrl(): string {
    const query = encodeURIComponent(this.contact.mapQuery);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  dayLabel(weekday: number): string {
    const key = WEEKDAY_I18N_KEYS[weekday] ?? 'monday';
    return this.translateService.instant(`closedNotice.days.${key}`);
  }

  dayHours(weekday: number): string {
    if (this.openingHours.isWeekdayClosed(weekday)) {
      return this.translateService.instant('closedNotice.closed');
    }
    return this.openingHours.hoursForWeekday(weekday);
  }

  holidayLabel(entry: (typeof HOLIDAY_HOURS)[number]): string {
    return this.menuLang() === 'de' ? entry.dateLabelDe : entry.dateLabelEn;
  }

  private menuLang(): 'de' | 'en' {
    return this.translateService.currentLang?.startsWith('en') ? 'en' : 'de';
  }
}
