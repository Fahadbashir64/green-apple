import { Injectable, computed, signal } from '@angular/core';

import {
  OPENING_HOURS_WEEKDAY_ORDER,
  WEEKLY_SCHEDULE,
  berlinWallClock,
  formatSlots,
  isClosedAllDay,
  isRestaurantOpen
} from '../constants/opening-hours';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpeningHoursService {
  private readonly enabled = environment.closedNotice?.enabled !== false;
  private readonly tickSignal = signal(0);
  /** In-memory only — resets on refresh/reload so the notice shows again when closed. */
  private readonly noticeVisibleSignal = signal(true);

  readonly weekdayOrder = OPENING_HOURS_WEEKDAY_ORDER;

  readonly isOpen = computed(() => {
    this.tickSignal();
    return isRestaurantOpen();
  });

  readonly todayWeekday = computed(() => {
    this.tickSignal();
    return berlinWallClock().weekday;
  });

  constructor() {
    if (typeof window !== 'undefined' && this.enabled) {
      window.setInterval(() => this.tickSignal.update((n) => n + 1), 60_000);
    }
  }

  isClosedNoticeEnabled(): boolean {
    return this.enabled;
  }

  canOrder(): boolean {
    if (!this.enabled) {
      return true;
    }
    return this.isOpen();
  }

  shouldShowNotice(): boolean {
    if (!this.enabled) {
      return false;
    }
    return !this.isOpen() && this.noticeVisibleSignal();
  }

  showNotice(): void {
    if (!this.enabled || this.isOpen()) {
      return;
    }
    this.noticeVisibleSignal.set(true);
  }

  dismissNotice(): void {
    this.noticeVisibleSignal.set(false);
  }

  isWeekdayClosed(weekday: number): boolean {
    return isClosedAllDay(weekday);
  }

  hoursForWeekday(weekday: number): string {
    if (isClosedAllDay(weekday)) {
      return '';
    }
    return formatSlots(WEEKLY_SCHEDULE[weekday]?.slots);
  }
}
