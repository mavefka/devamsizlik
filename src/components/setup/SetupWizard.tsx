import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Plus, Trash2, ShieldCheck, Clock, CalendarDays, BookOpen } from 'lucide-react';
import type { SetupData, Holiday, ClassItem, TrackingUnit } from '../../types';
import { tr, WEEKDAYS } from '../../i18n/tr';
import { Button } from '../ui/Button';
import { Stepper } from '../ui/Stepper';
import { DEFAULT_ALLOWED_HOURS, DEFAULT_ALLOWED_DAYS } from '../../lib/defaults';
import { termEndFromWeeks, weeksBetween, formatDate } from '../../lib/dates';
import { getHolidayClassHours, getTotalClassHours, getWeeklyClassHours, extractCoursesFromSchedule } from '../../lib/calc';
import { getNationalHolidays } from '../../lib/holidays';
import { validateSetup } from '../../lib/validation';
import { createId } from '../../lib/id';
import { AppLogo } from '../ui/AppLogo';
import { useAuth } from '../../state/AuthContext';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/scrollLock';

export interface SetupWizardProps {
  initialSetup: SetupData;
  mode: 'initial' | 'edit' | 'newTerm';
  onComplete: (setup: SetupData) => void;
  onCancel?: () => void;
  onOpenLogin?: () => void;
  isOpen: boolean;
}

export function SetupWizard({
  initialSetup,
  mode,
  onComplete,
  onCancel,
  onOpenLogin,
  isOpen,
}: SetupWizardProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [setup, setSetup] = useState<SetupData>(() => ({
    ...initialSetup,
    trackingUnit: initialSetup.trackingUnit || 'hours',
  }));
  const isDays = setup.trackingUnit === 'days';
  const isCourseHours = setup.trackingUnit === 'course_hours';
  const [endMode, setEndMode] = useState<'weeks' | 'end'>('weeks');
  const [weeksCount, setWeeksCount] = useState<number>(() =>
    weeksBetween(initialSetup.term.start, initialSetup.term.end),
  );

  // Class naming expand toggles
  const [expandedClassesDay, setExpandedClassesDay] = useState<number | null>(null);

  // New holiday input state
  const [holidayStart, setHolidayStart] = useState(initialSetup.term.start);
  const [holidayEnd, setHolidayEnd] = useState(initialSetup.term.start);
  const [holidayLabel, setHolidayLabel] = useState('');
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [nationalFeedback, setNationalFeedback] = useState<string | null>(null);
  const [showWeekend, setShowWeekend] = useState(
    () => (initialSetup.schedule[5]?.hours ?? 0) > 0 || (initialSetup.schedule[6]?.hours ?? 0) > 0,
  );

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const weeklyHours = getWeeklyClassHours(setup.schedule);
  const totalClassHours = getTotalClassHours(setup);
  const issues = validateSetup(setup);

  const handleTrackingUnitChange = (unit: TrackingUnit) => {
    setSetup((prev) => {
      if (prev.trackingUnit === unit) return prev;
      if (unit === 'days') {
        const schedule = prev.schedule.map((d) => ({
          ...d,
          hours: d.hours > 0 ? 1 : 0,
          classes: [],
        }));
        const allowedHours = prev.allowedHours > 40 ? DEFAULT_ALLOWED_DAYS : prev.allowedHours;
        return { ...prev, trackingUnit: 'days', schedule, allowedHours };
      } else if (unit === 'course_hours') {
        let schedule = prev.schedule;
        const totalClasses = schedule.reduce((sum, d) => sum + d.classes.length, 0);
        if (totalClasses === 0) {
          const defaultNames = ['Matematik', 'Fizik', 'Algoritmalar', 'Yönetim Bilişim', 'İngilizce', 'Ders 6', 'Ders 7'];
          schedule = schedule.map((d, i) => {
            if (d.hours > 0) {
              return {
                ...d,
                classes: [{ id: createId(), name: defaultNames[i] || `Ders ${i + 1}`, hours: d.hours }],
              };
            }
            return d;
          });
        }
        const courses = extractCoursesFromSchedule(schedule, weeksCount, 0.3, prev.courses);
        const allowedHours = courses.reduce((sum, c) => sum + c.allowedHours, 0) || DEFAULT_ALLOWED_HOURS;
        return { ...prev, trackingUnit: 'course_hours', schedule, courses, allowedHours };
      } else {
        const allowedHours = prev.allowedHours <= 20 ? DEFAULT_ALLOWED_HOURS : prev.allowedHours;
        return { ...prev, trackingUnit: 'hours', allowedHours };
      }
    });
  };

  const handleDayHoursChange = (dayIndex: number, hours: number) => {
    setSetup((prev) => {
      const schedule = prev.schedule.map((d, i) => (i === dayIndex ? { ...d, hours, classes: [] } : d));
      return { ...prev, schedule };
    });
  };

  const handleAddClass = (dayIndex: number) => {
    const currentDay = setup.schedule[dayIndex];
    const currentDayHours = currentDay?.hours || 0;
    const initialHours =
      currentDay?.classes.length === 0 && currentDayHours > 0 ? currentDayHours : 2;

    const newClass: ClassItem = {
      id: createId(),
      name: '',
      hours: initialHours,
    };
    setSetup((prev) => {
      const schedule = prev.schedule.map((d, i) => {
        if (i !== dayIndex) return d;
        const classes = [...d.classes, newClass];
        const hours = classes.reduce((sum, c) => sum + c.hours, 0);
        return { ...d, classes, hours };
      });
      const courses =
        prev.trackingUnit === 'course_hours'
          ? extractCoursesFromSchedule(schedule, weeksCount, 0.3, prev.courses)
          : prev.courses;
      const allowedHours =
        prev.trackingUnit === 'course_hours' && courses
          ? courses.reduce((s, c) => s + c.allowedHours, 0)
          : prev.allowedHours;
      return { ...prev, schedule, courses, allowedHours };
    });
    setExpandedClassesDay(dayIndex);
  };

  const handleUpdateClass = (dayIndex: number, classId: string, name: string, hours: number) => {
    setSetup((prev) => {
      const schedule = prev.schedule.map((d, i) => {
        if (i !== dayIndex) return d;
        const classes = d.classes.map((c) => (c.id === classId ? { ...c, name, hours } : c));
        const totalH = classes.reduce((sum, c) => sum + c.hours, 0);
        return { ...d, classes, hours: totalH };
      });
      const courses = prev.trackingUnit === 'course_hours'
        ? extractCoursesFromSchedule(schedule, weeksCount, 0.3, prev.courses)
        : prev.courses;
      const allowedHours = prev.trackingUnit === 'course_hours' && courses
        ? courses.reduce((s, c) => s + c.allowedHours, 0)
        : prev.allowedHours;
      return { ...prev, schedule, courses, allowedHours };
    });
  };

  const handleRemoveClass = (dayIndex: number, classId: string) => {
    setSetup((prev) => {
      const schedule = prev.schedule.map((d, i) => {
        if (i !== dayIndex) return d;
        const classes = d.classes.filter((c) => c.id !== classId);
        const hours = classes.reduce((sum, c) => sum + c.hours, 0);
        return { ...d, classes, hours };
      });
      const courses = prev.trackingUnit === 'course_hours'
        ? extractCoursesFromSchedule(schedule, weeksCount, 0.3, prev.courses)
        : prev.courses;
      const allowedHours = prev.trackingUnit === 'course_hours' && courses
        ? courses.reduce((s, c) => s + c.allowedHours, 0)
        : prev.allowedHours;
      return { ...prev, schedule, courses, allowedHours };
    });
  };

  const handleCourseAllowedChange = (courseId: string, allowedHours: number) => {
    setSetup((prev) => {
      const courses = (prev.courses || []).map((c) =>
        c.id === courseId ? { ...c, allowedHours: Math.max(0, allowedHours) } : c,
      );
      const totalAllowed = courses.reduce((sum, c) => sum + c.allowedHours, 0);
      return { ...prev, courses, allowedHours: totalAllowed };
    });
  };

  const handleApplyPercentageToAllCourses = (percentage: number) => {
    setSetup((prev) => {
      const courses = (prev.courses || []).map((c) => ({
        ...c,
        allowedHours: Math.max(1, Math.round(c.weeklyHours * weeksCount * percentage)),
      }));
      const totalAllowed = courses.reduce((sum, c) => sum + c.allowedHours, 0);
      return { ...prev, courses, allowedHours: totalAllowed };
    });
  };

  const handleTermStartChange = (start: string) => {
    setSetup((prev) => {
      const end = endMode === 'weeks' ? termEndFromWeeks(start, weeksCount) : prev.term.end;
      return { ...prev, term: { ...prev.term, start, end } };
    });
  };

  const handleTermWeeksChange = (weeks: number) => {
    setWeeksCount(weeks);
    setSetup((prev) => ({
      ...prev,
      term: { ...prev.term, end: termEndFromWeeks(prev.term.start, weeks) },
    }));
  };

  const handleTermEndChange = (end: string) => {
    setSetup((prev) => {
      if (end >= prev.term.start) {
        setWeeksCount(weeksBetween(prev.term.start, end));
      }
      return { ...prev, term: { ...prev.term, end } };
    });
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError(null);
    if (!holidayStart) {
      setHolidayError(tr.setup.holidayInvalidStart);
      return;
    }
    const end = holidayEnd || holidayStart;
    if (end < holidayStart) {
      setHolidayError(tr.setup.holidayInvalidOrder);
      return;
    }

    const newHoliday: Holiday = {
      id: createId(),
      start: holidayStart,
      end,
      label: holidayLabel.trim() || 'Tatil',
    };

    setSetup((prev) => ({
      ...prev,
      holidays: [...prev.holidays, newHoliday],
    }));

    setHolidayLabel('');
  };

  const handleRemoveHoliday = (id: string) => {
    setSetup((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((h) => h.id !== id),
    }));
  };

  const handleAddNationalHolidays = () => {
    const list = getNationalHolidays(setup.term.start, setup.term.end);
    if (list.length === 0) {
      setNationalFeedback(tr.setup.noNational);
      return;
    }

    const existingDates = new Set(setup.holidays.map((h) => h.start));
    const toAdd = list.filter((n) => !existingDates.has(n.date));

    if (toAdd.length === 0) {
      setNationalFeedback(tr.setup.noNational);
      return;
    }

    const newHolidays: Holiday[] = toAdd.map((n) => ({
      id: createId(),
      start: n.date,
      end: n.date,
      label: n.label,
    }));

    setSetup((prev) => ({
      ...prev,
      holidays: [...prev.holidays, ...newHolidays],
    }));

    setNationalFeedback(tr.setup.nationalAdded(toAdd.length));
    setTimeout(() => setNationalFeedback(null), 4000);
  };

  const canProceed = () => {
    if (step === 0) return weeklyHours > 0;
    if (step === 1) return setup.allowedHours >= 0 && setup.term.end >= setup.term.start;
    return issues.length === 0;
  };

  const handleFinish = () => {
    if (issues.length === 0) {
      onComplete(setup);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-dialog-in overflow-hidden my-auto">
        {/* Wizard Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 sm:pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppLogo className="w-5 h-5" rounded="rounded-md" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {tr.setup.stepOf(step + 1, 3)}
              </span>
            </div>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                {tr.common.cancel}
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            {tr.setup.steps[step].title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tr.setup.steps[step].description}
          </p>

          {/* Stepper Dots / Bars */}
          <div className="flex gap-1.5 mt-3 sm:mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step
                    ? 'bg-zinc-900 dark:bg-zinc-100'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
          {/* STEP 0: WEEKLY SCHEDULE */}
          {step === 0 && (
            <div className="space-y-4">
              {user ? (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">
                    <strong>@{user.username}</strong> hesabıyla giriş yapıldı — verileriniz bulutta saklanacak.
                  </span>
                </div>
              ) : onOpenLogin ? (
                <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl text-xs">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Zaten bir hesabınız var mı?</span>
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Giriş Yap &rarr;
                  </button>
                </div>
              ) : null}

              {/* Tracking Unit Selection */}
              <div className="p-3.5 bg-zinc-100/70 dark:bg-zinc-800/60 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {tr.setup.trackingUnitLabel}
                  </span>
                  <div className="grid grid-cols-3 sm:flex bg-white dark:bg-zinc-900 p-0.5 rounded-lg text-xs shadow-2xs border border-zinc-200/60 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => handleTrackingUnitChange('course_hours')}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                        isCourseHours
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Ders Bazlı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrackingUnitChange('hours')}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                        setup.trackingUnit === 'hours'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Genel Saat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrackingUnitChange('days')}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all ${
                        isDays
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Gün Sistemi</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isCourseHours
                    ? 'Üniversitelerdeki gibi her dersin haftalık saati ve devamsızlık limiti ayrı ayrı takip edilir.'
                    : tr.setup.trackingUnitHint}
                </p>
              </div>

              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {isCourseHours ? (
                    <span>
                      Toplam:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {setup.courses?.length || 0} ders · Haftalık {weeklyHours} saat
                      </strong>
                    </span>
                  ) : isDays ? (
                    <span>
                      {tr.setup.weeklyDaysTotal}:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">{weeklyHours} gün</strong>
                    </span>
                  ) : (
                    <span>
                      {tr.setup.weeklyTotal}:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">{tr.common.hours(weeklyHours)}</strong>
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {isCourseHours
                    ? 'Derslerinizi günlere dağıtın'
                    : isDays
                      ? 'Ders günlerini işaretleyin'
                      : 'Ders saatlerini girin'}
                </span>
              </div>

              {/* Day rows */}
              <div className="space-y-2.5">
                {setup.schedule.slice(0, showWeekend ? 7 : 5).map((day, idx) => {
                  const dayName = WEEKDAYS[idx];
                  const hasClasses = day.classes.length > 0;
                  const isExpanded = expandedClassesDay === idx;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {dayName}
                          </span>
                          {!isDays && !isCourseHours && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedClassesDay(null);
                                } else {
                                  setExpandedClassesDay(idx);
                                  if (day.classes.length === 0) {
                                    handleAddClass(idx);
                                  }
                                }
                              }}
                              className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-left mt-0.5"
                            >
                              {hasClasses
                                ? `${day.classes.length} ders (${isExpanded ? 'kapat' : 'düzenle'})`
                                : `+ ${tr.setup.addClassNames}`}
                            </button>
                          )}
                        </div>

                        {isDays ? (
                          <button
                            type="button"
                            onClick={() => handleDayHoursChange(idx, day.hours > 0 ? 0 : 1)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              day.hours > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800'
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {day.hours > 0 ? <Check className="w-3.5 h-3.5" /> : null}
                            {day.hours > 0 ? 'Ders Var (1 Gün)' : 'Ders Yok'}
                          </button>
                        ) : isCourseHours ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {hasClasses && (
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums bg-white dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                                {day.hours} sa
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddClass(idx)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Ders Ekle
                            </button>
                          </div>
                        ) : !hasClasses ? (
                          <Stepper
                            value={day.hours}
                            onChange={(h) => handleDayHoursChange(idx, h)}
                            min={0}
                            max={12}
                            unit={tr.common.hoursShort}
                            label={dayName}
                            size="sm"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                            {tr.common.hours(day.hours)}
                          </div>
                        )}
                      </div>

                      {/* Optional Named Classes List */}
                      {(isCourseHours ? hasClasses : isExpanded) && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50 space-y-2">
                          {isCourseHours ? (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Ders adını ve bu gündeki saatini girin:
                            </p>
                          ) : (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {tr.setup.classHint}
                            </p>
                          )}
                          {day.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="p-2 sm:p-2 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center gap-2 transition-all shadow-2xs"
                            >
                              {/* Course name input & mobile trash button */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={cls.name}
                                  onChange={(e) => handleUpdateClass(idx, cls.id, e.target.value, cls.hours)}
                                  placeholder="ör. Matematik"
                                  className="w-full min-w-0 text-xs px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveClass(idx, cls.id)}
                                  className="sm:hidden p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
                                  aria-label={tr.setup.removeClass}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Hours stepper & desktop trash button */}
                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-700/40">
                                <span className="sm:hidden text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                  Ders Saati:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Stepper
                                    value={cls.hours}
                                    onChange={(h) => handleUpdateClass(idx, cls.id, cls.name, h)}
                                    min={1}
                                    max={8}
                                    unit={tr.common.hoursShort}
                                    label={cls.name || 'Ders'}
                                    size="sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveClass(idx, cls.id)}
                                    className="hidden sm:inline-flex p-1 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors shrink-0"
                                    aria-label={tr.setup.removeClass}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {day.classes.length === 0 && (
                            <p className="text-xs text-zinc-400 py-1">
                              Henüz ders eklenmedi.
                            </p>
                          )}

                          {/* Add class button & close button */}
                          <div className="pt-1 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleAddClass(idx)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Ders Ekle
                            </button>
                            {!isCourseHours && (
                              <button
                                type="button"
                                onClick={() => setExpandedClassesDay(null)}
                                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1 px-2"
                              >
                                Kapat
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showWeekend && (
                <button
                  type="button"
                  onClick={() => setShowWeekend(true)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium py-1 transition-colors"
                >
                  + Hafta sonu günlerini göster (Cumartesi, Pazar)
                </button>
              )}

              {weeklyHours === 0 && (
                <p className="text-xs text-rose-500 font-medium">
                  {tr.setup.issues['schedule-empty']}
                </p>
              )}
            </div>
          )}

          {/* STEP 1: TERM & ALLOWED HOURS */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Term Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {tr.setup.termName} <span className="text-zinc-400">({tr.setup.optional})</span>
                </label>
                <input
                  type="text"
                  value={setup.term.name}
                  onChange={(e) =>
                    setSetup((prev) => ({ ...prev, term: { ...prev.term, name: e.target.value } }))
                  }
                  placeholder={tr.setup.termNamePlaceholder}
                  className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {tr.setup.start}
                </label>
                <input
                  type="date"
                  value={setup.term.start}
                  onChange={(e) => handleTermStartChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                />
              </div>

              {/* Duration or End Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {tr.setup.endBy}
                  </label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setEndMode('weeks')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        endMode === 'weeks'
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                          : 'text-zinc-500'
                      }`}
                    >
                      {tr.setup.endModes.weeks}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndMode('end')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        endMode === 'end'
                          ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                          : 'text-zinc-500'
                      }`}
                    >
                      {tr.setup.endModes.end}
                    </button>
                  </div>
                </div>

                {endMode === 'weeks' ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                    <div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {tr.setup.weeks}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {tr.setup.endsOn(formatDate(setup.term.end))}
                      </p>
                    </div>
                    <Stepper
                      value={weeksCount}
                      onChange={handleTermWeeksChange}
                      min={1}
                      max={52}
                      label={tr.setup.weeks}
                      size="sm"
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="date"
                      value={setup.term.end}
                      onChange={(e) => handleTermEndChange(e.target.value)}
                      min={setup.term.start}
                      className="w-full text-sm px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Total Allowed Absence Hours or Days or Per-Course */}
              {isCourseHours ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {tr.setup.courseAllowanceTitle}
                      </label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {tr.setup.courseAllowanceDesc}
                      </p>
                    </div>
                    {/* Quick percentage buttons for all courses */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApplyPercentageToAllCourses(0.2)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors font-medium"
                      >
                        %20 Kuralı
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPercentageToAllCourses(0.3)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs transition-colors"
                      >
                        %30 (Standart)
                      </button>
                    </div>
                  </div>

                  {/* Course Cards List */}
                  <div className="space-y-2.5">
                    {(!setup.courses || setup.courses.length === 0) ? (
                      <p className="text-xs text-zinc-400 py-3 text-center">
                        Programınızda henüz ders eklenmemiş. Önceki adıma dönüp derslerinizi ekleyin.
                      </p>
                    ) : (
                      setup.courses.map((course) => {
                        const totalTermCourseHours = course.weeklyHours * weeksCount;
                        const percent20 = Math.max(1, Math.round(totalTermCourseHours * 0.2));
                        const percent30 = Math.max(1, Math.round(totalTermCourseHours * 0.3));

                        return (
                          <div
                            key={course.id}
                            className="p-3.5 bg-white dark:bg-zinc-800/90 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                                  {course.name}
                                </span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  Haftada {course.weeklyHours} sa · {weeksCount} haftada ~{totalTermCourseHours} sa
                                </span>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-700/40">
                                <span className="sm:hidden text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                  Devamsızlık Hakkı:
                                </span>
                                <Stepper
                                  value={course.allowedHours}
                                  onChange={(h) => handleCourseAllowedChange(course.id, h)}
                                  min={0}
                                  max={80}
                                  unit="sa"
                                  label={`${course.name} devamsızlık hakkı`}
                                  size="sm"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-zinc-100 dark:border-zinc-700/40">
                              <span className="text-[11px] text-zinc-400 mr-1">Hızlı Seç:</span>
                              {[percent20, percent30, 8, 12, 16]
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleCourseAllowedChange(course.id, preset)}
                                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                                      course.allowedHours === preset
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                                    }`}
                                  >
                                    {preset === percent20
                                      ? `%20 (${preset} sa)`
                                      : preset === percent30
                                        ? `%30 (${preset} sa)`
                                        : `${preset} sa`}
                                  </button>
                                ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {tr.setup.allowedLabel(setup.trackingUnit)}
                      </label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {tr.setup.allowedHint(setup.trackingUnit)}
                      </p>
                    </div>
                    <Stepper
                      value={setup.allowedHours}
                      onChange={(h) => setSetup((prev) => ({ ...prev, allowedHours: h }))}
                      min={0}
                      max={isDays ? 60 : 200}
                      unit={isDays ? 'gün' : tr.common.hoursShort}
                      label={tr.setup.allowedLabel(setup.trackingUnit)}
                      size="md"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {isDays ? (
                      [10, 15, 20, 25, 30].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSetup((prev) => ({ ...prev, allowedHours: preset }))}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            setup.allowedHours === preset
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                              : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {preset} Gün
                        </button>
                      ))
                    ) : (
                      [15, 20, 25, 30].map((percent) => {
                        const calculatedHours = Math.round((totalClassHours * percent) / 100);
                        return (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => setSetup((prev) => ({ ...prev, allowedHours: calculatedHours }))}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                              setup.allowedHours === calculatedHours
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            %{percent} ({calculatedHours} sa)
                          </button>
                        );
                      })
                    )}
                  </div>

                  {totalClassHours > 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                      {tr.setup.allowanceShare(setup.allowedHours / totalClassHours, setup.trackingUnit)} ({setup.allowedHours} {isDays ? 'gün' : 'saat'} / {totalClassHours} {isDays ? 'gün' : 'saat'})
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: HOLIDAYS */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Quick National Holidays Button */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {tr.setup.addNational}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {tr.setup.nationalHint}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddNationalHolidays}
                >
                  {tr.setup.addNational}
                </Button>
              </div>

              {nationalFeedback && (
                <div className="p-2.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                  {nationalFeedback}
                </div>
              )}

              {/* Add Holiday Form */}
              <form onSubmit={handleAddHoliday} className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {tr.setup.addHoliday}
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                      {tr.setup.holidayStart}
                    </label>
                    <input
                      type="date"
                      value={holidayStart}
                      onChange={(e) => setHolidayStart(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                      {tr.setup.holidayEnd}
                    </label>
                    <input
                      type="date"
                      value={holidayEnd}
                      min={holidayStart}
                      onChange={(e) => setHolidayEnd(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={holidayLabel}
                    onChange={(e) => setHolidayLabel(e.target.value)}
                    placeholder={tr.setup.holidayLabelPlaceholder}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {holidayError && (
                  <p className="text-xs text-rose-500">{holidayError}</p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}>
                    {tr.setup.addHoliday}
                  </Button>
                </div>
              </form>

              {/* Holiday list */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {setup.holidays.length > 0 ? `${setup.holidays.length} Tatil` : tr.setup.noHolidays}
                </span>

                {setup.holidays.map((h) => {
                  const impact = getHolidayClassHours(setup, h);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {h.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {h.start === h.end ? formatDate(h.start) : `${formatDate(h.start)} – ${formatDate(h.end)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {isDays ? (impact > 0 ? `−${impact} gün` : 'Ders gününü etkilemiyor') : tr.setup.holidayImpact(impact)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(h.id)}
                          aria-label={tr.setup.removeHoliday(h.label)}
                          className="p-1 text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary note */}
              <div className="p-3 bg-zinc-100/70 dark:bg-zinc-800/40 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
                {isDays
                  ? `Tatiller düşüldükten sonra dönemde toplam ${totalClassHours} ders günü var.`
                  : tr.setup.totalAfterHolidays(totalClassHours)}
              </div>
            </div>
          )}

          {/* Validation issues banner */}
          {issues.length > 0 && step === 2 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-1">
              {issues.map((iss) => (
                <p key={iss} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {tr.setup.issues[iss]}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
          <div>
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                {tr.common.back}
              </Button>
            )}
          </div>

          <div>
            {step < 2 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!canProceed()}
                onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
              >
                {tr.common.next}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={issues.length > 0}
                onClick={handleFinish}
                icon={<Check className="w-4 h-4" />}
              >
                {tr.setup.finish[mode]}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
