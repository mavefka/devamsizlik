import type { AppData, SetupData } from '../types';
import {
  getClassHoursForDate,
  getDayKind,
  getLoggedHoursOnDate,
  getTotalClassHours,
  getUsedHours,
  getWeeklyClassHours,
} from './calc';
import { daysBetween, isValidISODate } from './dates';

export const MAX_DAY_HOURS = 16;
export const MAX_ALLOWED_HOURS = 9999;
export const MAX_TERM_DAYS = 731;
export const MAX_TERM_WEEKS = 104;

/* ---------- Absence entries ---------- */

export type AbsenceError =
  | 'invalid-date'
  | 'outside-term'
  | 'holiday'
  | 'no-class'
  | 'day-full'
  | 'invalid-hours'
  | 'exceeds-day';

export type AbsenceWarning = 'future' | 'has-entries' | 'over-limit';

export interface AbsenceValidation {
  errors: AbsenceError[];
  warnings: AbsenceWarning[];
  /** Scheduled class hours that day (0 when not a class day). */
  dayHours: number;
  /** Hours already logged on that date by other entries. */
  alreadyLogged: number;
  /** Max hours this entry may have. */
  maxHours: number;
}

export interface AbsenceDraft {
  date: string;
  hours: number;
}

/**
 * Validates a new or edited entry. Multiple entries per day are allowed as long
 * as their total stays within that day's class hours.
 */
export function validateAbsence(
  data: AppData,
  draft: AbsenceDraft,
  today: string,
  excludeId?: string,
): AbsenceValidation {
  const result: AbsenceValidation = { errors: [], warnings: [], dayHours: 0, alreadyLogged: 0, maxHours: 0 };

  if (!isValidISODate(draft.date)) {
    result.errors.push('invalid-date');
    return result;
  }

  const kind = getDayKind(data, draft.date);
  if (kind !== 'class') {
    result.errors.push(kind);
    return result;
  }

  result.dayHours = getClassHoursForDate(data, draft.date);
  result.alreadyLogged = getLoggedHoursOnDate(data.absences, draft.date, excludeId);
  result.maxHours = Math.max(0, result.dayHours - result.alreadyLogged);

  if (result.maxHours === 0) {
    result.errors.push('day-full');
  } else if (data.trackingUnit === 'days') {
    if (typeof draft.hours !== 'number' || draft.hours <= 0 || draft.hours % 0.5 !== 0) {
      result.errors.push('invalid-hours');
    } else if (draft.hours > result.maxHours) {
      result.errors.push('exceeds-day');
    }
  } else if (!Number.isInteger(draft.hours) || draft.hours < 1) {
    result.errors.push('invalid-hours');
  } else if (draft.hours > result.maxHours) {
    result.errors.push('exceeds-day');
  }

  if (draft.date > today) result.warnings.push('future');
  if (result.alreadyLogged > 0) result.warnings.push('has-entries');

  const usedByOthers = getUsedHours(data.absences.filter((a) => a.id !== excludeId));
  if (usedByOthers + Math.max(0, draft.hours) > data.allowedHours) result.warnings.push('over-limit');

  return result;
}

/* ---------- Setup ---------- */

export type SetupIssue =
  | 'hours-invalid'
  | 'schedule-empty'
  | 'term-start-invalid'
  | 'term-end-invalid'
  | 'term-order'
  | 'term-too-long'
  | 'allowed-invalid'
  | 'holiday-invalid'
  | 'term-no-classes';

export function validateSetup(setup: SetupData): SetupIssue[] {
  const issues: SetupIssue[] = [];
  const { term } = setup;

  const hoursValid =
    setup.schedule.length === 7 &&
    setup.schedule.every((d) => Number.isInteger(d.hours) && d.hours >= 0 && d.hours <= MAX_DAY_HOURS);
  if (!hoursValid) issues.push('hours-invalid');
  else if (getWeeklyClassHours(setup.schedule) === 0) issues.push('schedule-empty');

  const startValid = isValidISODate(term.start);
  const endValid = isValidISODate(term.end);
  if (!startValid) issues.push('term-start-invalid');
  if (!endValid) issues.push('term-end-invalid');

  let datesValid = false;
  if (startValid && endValid) {
    if (term.end < term.start) issues.push('term-order');
    else if (daysBetween(term.start, term.end) > MAX_TERM_DAYS) issues.push('term-too-long');
    else datesValid = true;
  }

  if (!Number.isFinite(setup.allowedHours) || setup.allowedHours < 0 || setup.allowedHours > MAX_ALLOWED_HOURS) {
    issues.push('allowed-invalid');
  }

  if (setup.holidays.some((h) => !isValidISODate(h.start) || !isValidISODate(h.end) || h.end < h.start)) {
    issues.push('holiday-invalid');
  }

  if (datesValid && hoursValid && !issues.includes('schedule-empty') && getTotalClassHours(setup) === 0) {
    issues.push('term-no-classes');
  }

  return issues;
}
