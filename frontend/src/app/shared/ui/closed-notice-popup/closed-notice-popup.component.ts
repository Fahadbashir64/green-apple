import { Component } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { WEEKDAY_I18N_KEYS, isClosedAllDay, WEEKLY_SCHEDULE, formatSlots } from '../../../core/constants/opening-hours';
import { OpeningHoursService } from '../../../core/services/opening-hours.service';

@Component({
  selector: 'app-closed-notice-popup',
  imports: [TranslatePipe],
  templateUrl: './closed-notice-popup.component.html',
  styleUrl: './closed-notice-popup.component.scss'
})
export class ClosedNoticePopupComponent {
  showOpeningTimes = false;

  constructor(
    public readonly openingHours: OpeningHoursService,
    private readonly translateService: TranslateService
  ) {}

  close(): void {
    this.openingHours.dismissNotice();
  }

  toggleOpeningTimes(): void {
    this.showOpeningTimes = !this.showOpeningTimes;
  }

  todayDayLabel(): string {
    return this.dayLabel(this.openingHours.todayWeekday());
  }

  todayStatusText(): string {
    const weekday = this.openingHours.todayWeekday();
    const day = this.dayLabel(weekday);
    if (isClosedAllDay(weekday)) {
      return this.translateService.instant('closedNotice.todayClosed', { day });
    }
    const hours = formatSlots(WEEKLY_SCHEDULE[weekday]?.slots);
    return this.translateService.instant('closedNotice.todayHours', { day, hours });
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
}
