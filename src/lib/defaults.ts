import type { AppData, SetupData, WeeklySchedule } from '../types';
import { termEndFromWeeks, weekStartISO } from './dates';

/** Language prep example: Mon 7, Tue 7, Wed 4, Thu 4, Fri–Sun 0. */
export const DEFAULT_DAY_HOURS = [7, 7, 4, 4, 0, 0, 0];
export const DEFAULT_ALLOWED_HOURS = 28;
export const DEFAULT_ALLOWED_DAYS = 15;
export const DEFAULT_TERM_WEEKS = 14;

export function createSchedule(hours: number[] = DEFAULT_DAY_HOURS): WeeklySchedule {
  return hours.map((h) => ({ hours: h, classes: [] }));
}

export function createDefaultSetup(today: string): SetupData {
  const start = weekStartISO(today);
  return {
    schedule: createSchedule(),
    allowedHours: DEFAULT_ALLOWED_HOURS,
    trackingUnit: 'hours',
    term: { name: '', start, end: termEndFromWeeks(start, DEFAULT_TERM_WEEKS) },
    holidays: [],
  };
}

export function createInitialAppData(today: string): AppData {
  return {
    version: 1,
    ...createDefaultSetup(today),
    absences: [],
    archive: [],
    theme: 'system',
    onboarded: false,
  };
}

export function pickSetup(data: AppData): SetupData {
  return {
    schedule: data.schedule,
    allowedHours: data.allowedHours,
    trackingUnit: data.trackingUnit ?? 'hours',
    courses: data.courses,
    term: data.term,
    holidays: data.holidays,
  };
}
