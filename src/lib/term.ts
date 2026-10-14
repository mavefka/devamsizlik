import type { AppData, ArchivedTerm, SetupData } from '../types';
import { getTotalClassHours, getUsedHours } from './calc';
import { addDaysISO, termEndFromWeeks, weekStartISO, weeksBetween } from './dates';
import { createId } from './id';

/** Summarizes the current term so it can be kept after a reset. */
export function archiveTerm(data: AppData, now: string): ArchivedTerm {
  return {
    id: createId(),
    name: data.term.name,
    start: data.term.start,
    end: data.term.end,
    allowedHours: data.allowedHours,
    usedHours: getUsedHours(data.absences),
    totalClassHours: getTotalClassHours(data),
    absenceCount: data.absences.length,
    archivedAt: now,
  };
}

/**
 * Archives the current term and starts a new one with the given setup.
 * Absence entries are cleared; theme and earlier archive entries are kept.
 */
export function startNewTerm(data: AppData, setup: SetupData, now: string): AppData {
  const archive = data.onboarded ? [archiveTerm(data, now), ...data.archive] : data.archive;
  return { ...data, ...setup, absences: [], archive, onboarded: true };
}

/**
 * Draft for the next term: keeps schedule and allowance, starts the Monday
 * after the current term (or this week if later) with the same length.
 */
export function suggestNextTermSetup(data: AppData, today: string): SetupData {
  const afterCurrent = weekStartISO(addDaysISO(data.term.end, 7));
  const thisWeek = weekStartISO(today);
  const start = afterCurrent > thisWeek ? afterCurrent : thisWeek;
  const weeks = weeksBetween(data.term.start, data.term.end);
  return {
    schedule: data.schedule.map((d) => ({ ...d, classes: d.classes.map((c) => ({ ...c })) })),
    allowedHours: data.allowedHours,
    trackingUnit: data.trackingUnit ?? 'hours',
    courses: data.courses?.map((c) => ({ ...c })),
    term: { name: '', start, end: termEndFromWeeks(start, weeks) },
    holidays: [],
  };
}
