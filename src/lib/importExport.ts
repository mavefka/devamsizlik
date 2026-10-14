import type { Absence, AppData, ArchivedTerm, ClassItem, DaySchedule, Holiday, ThemePreference, WeeklySchedule } from '../types';
import { isValidISODate } from './dates';
import { createId } from './id';
import { MAX_ALLOWED_HOURS, MAX_DAY_HOURS } from './validation';

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

function parseSchedule(raw: unknown): WeeklySchedule | null {
  if (!Array.isArray(raw) || raw.length !== 7) return null;
  const days: DaySchedule[] = [];
  for (const day of raw) {
    if (!isRecord(day) || !isIntInRange(day.hours, 0, MAX_DAY_HOURS)) return null;
    const classes: ClassItem[] = [];
    if (Array.isArray(day.classes)) {
      for (const c of day.classes) {
        if (!isRecord(c) || !isIntInRange(c.hours, 1, MAX_DAY_HOURS)) return null;
        classes.push({ id: str(c.id) || createId(), name: str(c.name), hours: c.hours });
      }
    }
    days.push({ hours: day.hours, classes });
  }
  return days;
}

function parseHolidays(raw: unknown): Holiday[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  const holidays: Holiday[] = [];
  for (const h of raw) {
    if (!isRecord(h)) return null;
    const start = h.start;
    const end = h.end ?? h.start;
    if (!isValidISODate(start) || !isValidISODate(end) || end < start) return null;
    holidays.push({ id: str(h.id) || createId(), start, end, label: str(h.label) });
  }
  return holidays;
}

function parseAbsences(raw: unknown): Absence[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  const absences: Absence[] = [];
  for (const a of raw) {
    if (!isRecord(a)) return null;
    const date = a.date;
    if (!isValidISODate(date) || !isIntInRange(a.hours, 1, MAX_DAY_HOURS)) return null;
    absences.push({
      id: str(a.id) || createId(),
      date,
      hours: a.hours,
      note: str(a.note),
      createdAt: str(a.createdAt, new Date(0).toISOString()),
    });
  }
  return absences;
}

function parseArchive(raw: unknown): ArchivedTerm[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((t): ArchivedTerm[] => {
    if (!isRecord(t)) return [];
    const { start, end } = t;
    if (!isValidISODate(start) || !isValidISODate(end)) return [];
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    return [
      {
        id: str(t.id) || createId(),
        name: str(t.name),
        start,
        end,
        allowedHours: num(t.allowedHours),
        usedHours: num(t.usedHours),
        totalClassHours: num(t.totalClassHours),
        absenceCount: num(t.absenceCount),
        archivedAt: str(t.archivedAt),
      },
    ];
  });
}

/** Validates unknown JSON and normalizes it into AppData, or returns null. */
export function parseAppData(raw: unknown): AppData | null {
  if (!isRecord(raw) || raw.version !== 1) return null;

  const schedule = parseSchedule(raw.schedule);
  if (!schedule) return null;

  if (!isIntInRange(raw.allowedHours, 0, MAX_ALLOWED_HOURS)) return null;

  const term = raw.term;
  if (!isRecord(term)) return null;
  const { start, end } = term;
  if (!isValidISODate(start) || !isValidISODate(end) || end < start) return null;

  const holidays = parseHolidays(raw.holidays);
  const absences = parseAbsences(raw.absences);
  if (!holidays || !absences) return null;

  const theme = THEMES.includes(raw.theme as ThemePreference) ? (raw.theme as ThemePreference) : 'system';

  return {
    version: 1,
    schedule,
    allowedHours: raw.allowedHours,
    term: { name: str(term.name), start, end },
    holidays,
    absences,
    archive: parseArchive(raw.archive),
    theme,
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : true,
  };
}

export function exportAppData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: 'parse' | 'invalid' };

export function importAppData(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'parse' };
  }
  const data = parseAppData(raw);
  return data ? { ok: true, data: { ...data, onboarded: true } } : { ok: false, error: 'invalid' };
}
