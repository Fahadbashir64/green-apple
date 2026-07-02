export const RESTAURANT_CONTACT = {
  name: 'Green Apple',
  street: 'Lübbeckerstr. 256',
  city: '32479 Hille-Unterlübbe',
  phones: ['05171 58 777 88'],
  email: 'info@greensapples.de',
  mapQuery: 'Lübbeckerstr. 256, 32479 Hille-Unterlübbe'
} as const;

export interface HolidayHoursEntry {
  id: string;
  dateLabelDe: string;
  dateLabelEn: string;
  hours: string;
}

/** Special opening hours on public holidays (update yearly). */
export const HOLIDAY_HOURS: HolidayHoursEntry[] = [
  {
    id: 'unity-2026',
    dateLabelDe: '03.10.2026 Tag der Deutschen Einheit (Samstag)',
    dateLabelEn: '03 Oct 2026 German Unity Day (Saturday)',
    hours: '14:00-22:30'
  },
  {
    id: 'reformation-2026',
    dateLabelDe: '31.10.2026 Reformationstag (Samstag)',
    dateLabelEn: '31 Oct 2026 Reformation Day (Saturday)',
    hours: '14:00-22:30'
  },
  {
    id: 'christmas-2026',
    dateLabelDe: '25.12.2026 1. Weihnachtstag (Freitag)',
    dateLabelEn: '25 Dec 2026 Christmas Day (Friday)',
    hours: '14:00-22:30'
  }
];
