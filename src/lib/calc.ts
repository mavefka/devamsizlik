import type { Absence, AppData, CourseConfig, Holiday, SetupData, Status, Term, WeeklySchedule } from '../types';
import { addDaysISO, iterateDays, monthKey, nextMonthKey, weekStartISO, weekdayOf } from './dates';

/*
 * Pure calculation functions. No React, no DOM, no Date.now() — "today" is
 * always passed in so everything is deterministic and unit-testable.
 */

export const WARNING_RATIO = 0.6;
export const CRITICAL_RATIO = 0.85;
const EPSILON = 1e-9;
const DEFAULT_DATE_LOOKBACK_DAYS = 14;

export type DayKind = 'outside-term' | 'holiday' | 'no-class' | 'class';

export function isWithinTerm(term: Term, iso: string): boolean {
  return iso >= term.start && iso <= term.end;
}

export function isHoliday(holidays: Holiday[], iso: string): boolean {
  return holidays.some((h) => iso >= h.start && iso <= h.end);
}

export function getDayKind(setup: SetupData, iso: string): DayKind {
  if (!isWithinTerm(setup.term, iso)) return 'outside-term';
  if (isHoliday(setup.holidays, iso)) return 'holiday';
  if (setup.schedule[weekdayOf(iso)].hours <= 0) return 'no-class';
  return 'class';
}

/** Class hours that actually take place on a date (0 outside term / on holidays). */
export function getClassHoursForDate(setup: SetupData, iso: string): number {
  return getDayKind(setup, iso) === 'class' ? setup.schedule[weekdayOf(iso)].hours : 0;
}

/** Sum of class hours in [from, to], clipped to the term. */
export function sumClassHours(setup: SetupData, from: string, to: string): number {
  const start = from > setup.term.start ? from : setup.term.start;
  const end = to < setup.term.end ? to : setup.term.end;
  let total = 0;
  for (const day of iterateDays(start, end)) total += getClassHoursForDate(setup, day);
  return total;
}

export function getTotalClassHours(setup: SetupData): number {
  return sumClassHours(setup, setup.term.start, setup.term.end);
}

/** Class hours from `today` (inclusive) until the end of the term. */
export function getRemainingClassHours(setup: SetupData, today: string): number {
  return sumClassHours(setup, today, setup.term.end);
}

/** Class hours from the term start until `today` (inclusive). */
export function getElapsedClassHours(setup: SetupData, today: string): number {
  return sumClassHours(setup, setup.term.start, today);
}

export function getWeeklyClassHours(schedule: WeeklySchedule): number {
  return schedule.reduce((sum, day) => sum + day.hours, 0);
}

/** Scheduled class hours a holiday removes from the term. */
export function getHolidayClassHours(setup: SetupData, holiday: Holiday): number {
  let total = 0;
  for (const day of iterateDays(holiday.start, holiday.end)) {
    if (isWithinTerm(setup.term, day)) total += setup.schedule[weekdayOf(day)].hours;
  }
  return total;
}

export function getUsedHours(absences: Absence[]): number {
  return absences.reduce((sum, a) => sum + a.hours, 0);
}

export function getLoggedHoursOnDate(absences: Absence[], iso: string, excludeId?: string): number {
  return absences
    .filter((a) => a.date === iso && a.id !== excludeId)
    .reduce((sum, a) => sum + a.hours, 0);
}

export function getStatus(used: number, allowed: number): Status {
  if (allowed <= 0) return used > 0 ? 'critical' : 'safe';
  const ratio = used / allowed;
  if (ratio > CRITICAL_RATIO) return 'critical';
  if (ratio >= WARNING_RATIO) return 'warning';
  return 'safe';
}

export interface Summary {
  used: number;
  allowed: number;
  /** Never negative. */
  remaining: number;
  /** Hours beyond the allowance (0 if within). */
  overBy: number;
  /** Used / allowed, clamped to [0, 1]. */
  ratio: number;
  status: Status;
}

export function getSummary(data: Pick<AppData, 'absences' | 'allowedHours'>): Summary {
  const used = getUsedHours(data.absences);
  const allowed = data.allowedHours;
  const ratio = allowed > 0 ? Math.min(1, used / allowed) : used > 0 ? 1 : 0;
  return {
    used,
    allowed,
    remaining: Math.max(0, allowed - used),
    overBy: Math.max(0, used - allowed),
    ratio,
    status: getStatus(used, allowed),
  };
}

export interface Simulation {
  deducted: number;
  usedAfter: number;
  remainingAfter: number;
  overBy: number;
  statusAfter: Status;
}

/** "What if I skip `hours` more?" */
export function simulateAbsence(allowed: number, used: number, hours: number): Simulation {
  const deducted = Math.max(0, hours);
  const usedAfter = used + deducted;
  return {
    deducted,
    usedAfter,
    remainingAfter: Math.max(0, allowed - usedAfter),
    overBy: Math.max(0, usedAfter - allowed),
    statusAfter: getStatus(usedAfter, allowed),
  };
}

/** How many full days of `dayHours` still fit into `remaining`. */
export function countSkippableDays(remaining: number, dayHours: number): number {
  return dayHours > 0 ? Math.max(0, Math.floor(remaining / dayHours)) : 0;
}

export type Projection =
  | { kind: 'ended' }
  | { kind: 'not-started' }
  | { kind: 'limit-reached'; overBy: number }
  | { kind: 'no-data' }
  | { kind: 'date'; date: string; rate: number }
  | { kind: 'safe-until-end'; projectedTotal: number; rate: number };

/**
 * Projects when the allowance runs out if the student keeps missing the same
 * share of class hours as so far (absent hours ÷ elapsed class hours).
 */
export function projectLimitDate(data: AppData, today: string): Projection {
  const { term } = data;
  if (today > term.end) return { kind: 'ended' };

  const used = getUsedHours(data.absences);
  const remaining = data.allowedHours - used;
  if (remaining <= 0) return { kind: 'limit-reached', overBy: used - data.allowedHours };
  if (today < term.start) return { kind: 'not-started' };

  const pastUsed = getUsedHours(data.absences.filter((a) => a.date <= today));
  const elapsed = getElapsedClassHours(data, today);
  if (pastUsed <= 0 || elapsed <= 0) return { kind: 'no-data' };

  const rate = Math.min(1, pastUsed / elapsed);
  let projected = 0;
  for (const day of iterateDays(addDaysISO(today, 1), term.end)) {
    projected += getClassHoursForDate(data, day) * rate;
    if (projected >= remaining - EPSILON) return { kind: 'date', date: day, rate };
  }
  return { kind: 'safe-until-end', projectedTotal: used + projected, rate };
}

export interface Bucket {
  /** Week start ISO date or "YYYY-MM". */
  key: string;
  hours: number;
}

export function getWeeklyBuckets(data: AppData): Bucket[] {
  const totals = new Map<string, number>();
  for (const a of data.absences) {
    const key = weekStartISO(a.date);
    totals.set(key, (totals.get(key) ?? 0) + a.hours);
  }
  const buckets: Bucket[] = [];
  for (let week = weekStartISO(data.term.start); week <= data.term.end; week = addDaysISO(week, 7)) {
    buckets.push({ key: week, hours: totals.get(week) ?? 0 });
  }
  return buckets;
}

export function getMonthlyBuckets(data: AppData): Bucket[] {
  const totals = new Map<string, number>();
  for (const a of data.absences) {
    const key = monthKey(a.date);
    totals.set(key, (totals.get(key) ?? 0) + a.hours);
  }
  const buckets: Bucket[] = [];
  const last = monthKey(data.term.end);
  for (let month = monthKey(data.term.start); month <= last; month = nextMonthKey(month)) {
    buckets.push({ key: month, hours: totals.get(month) ?? 0 });
  }
  return buckets;
}

/** Newest first; ties broken by creation time. */
export function sortAbsencesDesc(absences: Absence[]): Absence[] {
  return [...absences].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export interface WeekGroup {
  weekStart: string;
  total: number;
  items: Absence[];
}

export function groupAbsencesByWeek(absences: Absence[]): WeekGroup[] {
  const groups: WeekGroup[] = [];
  for (const absence of sortAbsencesDesc(absences)) {
    const weekStart = weekStartISO(absence.date);
    let group = groups[groups.length - 1];
    if (!group || group.weekStart !== weekStart) {
      group = { weekStart, total: 0, items: [] };
      groups.push(group);
    }
    group.items.push(absence);
    group.total += absence.hours;
  }
  return groups;
}

/** Suggests today if it's a loggable class day, otherwise the most recent one. */
export function findDefaultAbsenceDate(data: AppData, today: string): string {
  for (let i = 0; i <= DEFAULT_DATE_LOOKBACK_DAYS; i++) {
    const day = addDaysISO(today, -i);
    if (day < data.term.start) break;
    const classHours = getClassHoursForDate(data, day);
    if (classHours > getLoggedHoursOnDate(data.absences, day)) return day;
  }
  return today;
}

/** False when schedule/term edits made an existing entry no longer fit its day. */
export function isAbsenceConsistent(data: AppData, absence: Absence): boolean {
  const classHours = getClassHoursForDate(data, absence.date);
  return classHours > 0 && getLoggedHoursOnDate(data.absences, absence.date) <= classHours;
}

/* ---------- Course-Based Attendance (Ders Bazlı Devamsızlık) ---------- */

export const COURSE_COLORS = [
  'emerald',
  'blue',
  'violet',
  'amber',
  'rose',
  'cyan',
  'indigo',
  'teal',
  'fuchsia',
  'orange',
];

export interface CourseSummary {
  course: CourseConfig;
  used: number;
  remaining: number;
  overBy: number;
  ratio: number;
  status: Status;
}

export interface OverallCourseSummary {
  summaries: CourseSummary[];
  totalCourses: number;
  criticalCount: number;
  warningCount: number;
  safeCount: number;
  overCount: number;
  totalUsed: number;
  totalAllowed: number;
  overallStatus: Status;
  mostAtRisk?: CourseSummary;
}

/**
 * Automatically extracts unique courses from weekly schedule, aggregating weekly hours.
 * Sets default allowed absence based on term length (default 14 weeks) and percentage (default 30%).
 */
export function extractCoursesFromSchedule(
  schedule: WeeklySchedule,
  weeksCount: number = 14,
  defaultPercentage: number = 0.3,
  existingCourses?: CourseConfig[],
): CourseConfig[] {
  const map = new Map<string, { name: string; weeklyHours: number; color?: string; id?: string }>();

  if (existingCourses) {
    for (const ec of existingCourses) {
      const key = ec.name.trim().toLowerCase();
      if (key) {
        map.set(key, { name: ec.name.trim(), weeklyHours: 0, color: ec.color, id: ec.id });
      }
    }
  }

  for (const day of schedule) {
    for (const cls of day.classes) {
      const name = cls.name.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.weeklyHours += cls.hours;
      } else {
        map.set(key, { name, weeklyHours: cls.hours });
      }
    }
  }

  const result: CourseConfig[] = [];
  let colorIdx = 0;

  for (const [key, item] of map.entries()) {
    if (item.weeklyHours === 0 && !existingCourses?.some((ec) => ec.name.trim().toLowerCase() === key)) {
      continue;
    }
    const existing = existingCourses?.find((ec) => ec.name.trim().toLowerCase() === key);
    const allowedHours = existing
      ? existing.allowedHours
      : Math.max(1, Math.round(item.weeklyHours * weeksCount * defaultPercentage));
    const color = item.color || existing?.color || COURSE_COLORS[colorIdx % COURSE_COLORS.length];
    colorIdx++;

    result.push({
      id: item.id || existing?.id || `course-${result.length + 1}`,
      name: item.name,
      weeklyHours: item.weeklyHours,
      allowedHours,
      color,
    });
  }

  return result;
}

export function getCourseSummaries(courses: CourseConfig[], absences: Absence[]): CourseSummary[] {
  return courses.map((course) => {
    const courseNameKey = course.name.trim().toLowerCase();
    const courseAbsences = absences.filter(
      (a) => a.courseId === course.id || (a.courseName && a.courseName.trim().toLowerCase() === courseNameKey),
    );
    const used = courseAbsences.reduce((sum, a) => sum + a.hours, 0);
    const allowed = course.allowedHours;
    const remaining = Math.max(0, allowed - used);
    const overBy = Math.max(0, used - allowed);
    const ratio = allowed > 0 ? Math.min(1, used / allowed) : used > 0 ? 1 : 0;
    const status = getStatus(used, allowed);

    return {
      course,
      used,
      remaining,
      overBy,
      ratio,
      status,
    };
  });
}

export function getOverallCourseSummary(courses: CourseConfig[], absences: Absence[]): OverallCourseSummary {
  const summaries = getCourseSummaries(courses, absences);
  let totalUsed = 0;
  let totalAllowed = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let safeCount = 0;
  let overCount = 0;

  let mostAtRisk: CourseSummary | undefined;
  let highestRatio = -1;

  for (const s of summaries) {
    totalUsed += s.used;
    totalAllowed += s.course.allowedHours;

    if (s.overBy > 0) {
      overCount++;
      criticalCount++;
    } else if (s.status === 'critical') {
      criticalCount++;
    } else if (s.status === 'warning') {
      warningCount++;
    } else {
      safeCount++;
    }

    if (s.ratio > highestRatio) {
      highestRatio = s.ratio;
      mostAtRisk = s;
    }
  }

  let overallStatus: Status = 'safe';
  if (criticalCount > 0 || overCount > 0) {
    overallStatus = 'critical';
  } else if (warningCount > 0) {
    overallStatus = 'warning';
  }

  return {
    summaries,
    totalCourses: courses.length,
    criticalCount,
    warningCount,
    safeCount,
    overCount,
    totalUsed,
    totalAllowed,
    overallStatus,
    mostAtRisk,
  };
}

