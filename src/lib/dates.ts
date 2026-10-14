import { addDays, differenceInCalendarDays, format, getDay, isValid, parseISO, startOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Weekday } from '../types';

/*
 * All dates in the app are stored as local ISO date strings ("YYYY-MM-DD").
 * They compare correctly with plain string comparison, which keeps the
 * calculation code simple and timezone-safe.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromISODate(iso: string): Date {
  return parseISO(iso);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isValidISODate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE_PATTERN.test(value) && isValid(parseISO(value));
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(fromISODate(iso), days));
}

/** Calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(fromISODate(to), fromISODate(from));
}

export function weekdayOf(iso: string): Weekday {
  return ((getDay(fromISODate(iso)) + 6) % 7) as Weekday;
}

/** Monday of the week containing `iso`. */
export function weekStartISO(iso: string): string {
  return toISODate(startOfWeek(fromISODate(iso), { weekStartsOn: 1 }));
}

/** "YYYY-MM" */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function nextMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}

/** Yields every ISO date from `start` to `end`, inclusive. */
export function* iterateDays(start: string, end: string): Generator<string> {
  if (!isValidISODate(start) || !isValidISODate(end)) return;
  for (let day = start; day <= end; day = addDaysISO(day, 1)) yield day;
}

export function termEndFromWeeks(start: string, weeks: number): string {
  return addDaysISO(start, weeks * 7 - 1);
}

export function weeksBetween(start: string, end: string): number {
  return Math.max(1, Math.ceil((daysBetween(start, end) + 1) / 7));
}

/* ---------- Turkish display formatters ---------- */

const fmt = (iso: string, pattern: string) => format(fromISODate(iso), pattern, { locale: tr });

/** 13 Ekim 2026, Salı */
export const formatLongDate = (iso: string) => fmt(iso, 'd MMMM yyyy, EEEE');
/** 13 Ekim 2026 */
export const formatDate = (iso: string) => fmt(iso, 'd MMMM yyyy');
/** 13 Ekim */
export const formatDayMonth = (iso: string) => fmt(iso, 'd MMMM');
/** 13 Eki */
export const formatShortDate = (iso: string) => fmt(iso, 'd MMM');
/** Salı */
export const formatWeekday = (iso: string) => fmt(iso, 'EEEE');
/** Ekim 2026 (takes "YYYY-MM") */
export const formatMonth = (key: string) => fmt(`${key}-01`, 'MMMM yyyy');
/** Eki (takes "YYYY-MM") */
export const formatMonthShort = (key: string) => fmt(`${key}-01`, 'MMM');

/** 5 – 11 Ekim 2026 / 28 Eylül – 4 Ekim 2026 / 29 Aralık 2025 – 4 Ocak 2026 */
export function formatRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(5, 7) === end.slice(5, 7);
  if (sameMonth) return `${fmt(start, 'd')} – ${fmt(end, 'd MMMM yyyy')}`;
  if (sameYear) return `${fmt(start, 'd MMMM')} – ${fmt(end, 'd MMMM yyyy')}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}
