import type { Absence, AppData } from '../types';
import { createSchedule } from './defaults';

/*
 * Shared test fixture: a 4-week term, Mon 5 Oct – Fri 30 Oct 2026, with the
 * default 7/7/4/4 schedule (22 h/week) and 29 Oct (Thursday) as a holiday.
 * Total class hours = 4 × 22 − 4 = 84.
 */
export function makeData(overrides: Partial<AppData> = {}): AppData {
  return {
    version: 1,
    schedule: createSchedule([7, 7, 4, 4, 0, 0, 0]),
    allowedHours: 28,
    term: { name: 'Test', start: '2026-10-05', end: '2026-10-30' },
    holidays: [{ id: 'h1', start: '2026-10-29', end: '2026-10-29', label: 'Cumhuriyet Bayramı' }],
    absences: [],
    archive: [],
    theme: 'system',
    onboarded: true,
    ...overrides,
  };
}

export function absence(date: string, hours: number, id = `${date}-${hours}`): Absence {
  return { id, date, hours, note: '', createdAt: '2026-10-01T00:00:00.000Z' };
}
