/** Restaurant local timezone (Gifhorn, Germany). */
export const RESTAURANT_TIMEZONE = 'Europe/Berlin';

export interface TimeSlot {
  open: string;
  close: string;
}

export interface DaySchedule {
  closed?: boolean;
  slots?: TimeSlot[];
}

/** JS weekday: 0 = Sunday … 6 = Saturday */
export const WEEKLY_SCHEDULE: Record<number, DaySchedule> = {
  0: { slots: [{ open: '14:00', close: '22:30' }] },
  1: { closed: true },
  2: { slots: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:30' }] },
  3: { slots: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:30' }] },
  4: { slots: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:30' }] },
  5: { slots: [{ open: '11:00', close: '14:00' }, { open: '17:00', close: '22:30' }] },
  6: { slots: [{ open: '14:00', close: '22:30' }] }
};

/** Monday → Sunday display order for opening hours table */
export const OPENING_HOURS_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_I18N_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const;

export function parseTimeToMinutes(value: string): number {
  const [h, m] = String(value).split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return h * 60 + m;
}

export function berlinWallClock(now = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[String(parts.find((p) => p.type === 'weekday')?.value ?? 'Sun')] ?? 0;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { weekday, minutes: hour * 60 + minute };
}

export function isRestaurantOpen(now = new Date()): boolean {
  const { weekday, minutes } = berlinWallClock(now);
  const schedule = WEEKLY_SCHEDULE[weekday];
  if (!schedule || schedule.closed || !schedule.slots?.length) {
    return false;
  }
  return schedule.slots.some((slot) => {
    const open = parseTimeToMinutes(slot.open);
    const close = parseTimeToMinutes(slot.close);
    return minutes >= open && minutes < close;
  });
}

export function isClosedAllDay(weekday: number): boolean {
  const schedule = WEEKLY_SCHEDULE[weekday];
  return Boolean(schedule?.closed) || !schedule?.slots?.length;
}

export function formatSlots(slots: TimeSlot[] | undefined): string {
  if (!slots?.length) {
    return '';
  }
  return slots.map((slot) => `${slot.open}-${slot.close}`).join(' & ');
}
