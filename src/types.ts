/** 0 = Monday … 6 = Sunday (ISO weekday order, matches Turkish week convention). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Optional named class within a day. */
export interface ClassItem {
  id: string;
  name: string;
  hours: number;
  courseId?: string;
}

export interface DaySchedule {
  /** Total class hours on this weekday. When `classes` is non-empty this equals their sum. */
  hours: number;
  classes: ClassItem[];
}

/** Always 7 entries, Monday first. */
export type WeeklySchedule = DaySchedule[];

export interface Term {
  name: string;
  /** ISO date "YYYY-MM-DD", inclusive. */
  start: string;
  /** ISO date "YYYY-MM-DD", inclusive. */
  end: string;
}

export interface Holiday {
  id: string;
  start: string;
  /** Inclusive; equals `start` for a single day. */
  end: string;
  label: string;
}

export interface Absence {
  id: string;
  date: string;
  hours: number;
  note: string;
  createdAt: string;
  courseId?: string;
  courseName?: string;
}

/** Summary of a finished term kept after starting a new one. */
export interface ArchivedTerm {
  id: string;
  name: string;
  start: string;
  end: string;
  allowedHours: number;
  usedHours: number;
  totalClassHours: number;
  absenceCount: number;
  archivedAt: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type TrackingUnit = 'hours' | 'days' | 'course_hours';

export interface CourseConfig {
  id: string;
  name: string;
  weeklyHours: number;
  allowedHours: number;
  color?: string;
}

/** Everything the user configures during onboarding. */
export interface SetupData {
  schedule: WeeklySchedule;
  allowedHours: number;
  trackingUnit?: TrackingUnit;
  courses?: CourseConfig[];
  term: Term;
  holidays: Holiday[];
}

export interface AppData extends SetupData {
  version: 1;
  absences: Absence[];
  archive: ArchivedTerm[];
  theme: ThemePreference;
  onboarded: boolean;
}

export type Status = 'safe' | 'warning' | 'critical';
