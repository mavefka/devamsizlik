import { useState, useEffect } from 'react';
import { useApp } from '../../state/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Stepper } from '../ui/Stepper';
import { validateAbsence } from '../../lib/validation';
import { findDefaultAbsenceDate, getClassHoursForDate, getCourseSummaries } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { formatDate, formatWeekday, weekdayOf } from '../../lib/dates';
import { createId } from '../../lib/id';
import type { Absence } from '../../types';
import { AlertCircle, AlertTriangle, Trash2, Check } from 'lucide-react';

export interface LogAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAbsence?: Absence | null;
  initialDate?: string;
  initialCourseName?: string;
  onDelete?: (id: string) => void;
}

export function LogAbsenceModal({
  isOpen,
  onClose,
  initialAbsence,
  initialDate,
  initialCourseName,
  onDelete,
}: LogAbsenceModalProps) {
  const { data, dispatch, today } = useApp();
  const isDays = data.trackingUnit === 'days';
  const isCourseHours = data.trackingUnit === 'course_hours';

  const isEditing = Boolean(initialAbsence);

  const [date, setDate] = useState<string>(today);
  const [hours, setHours] = useState<number>(1);
  const [courseName, setCourseName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const dayClasses = isCourseHours && date ? data.schedule[weekdayOf(date)]?.classes || [] : [];
  const courseSummaries = isCourseHours && data.courses ? getCourseSummaries(data.courses, data.absences) : [];
  const selectedCourseSummary = courseSummaries.find(
    (s) => s.course.name.trim().toLowerCase() === courseName.trim().toLowerCase(),
  );

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (!isOpen) return;

    if (initialAbsence) {
      setDate(initialAbsence.date);
      setHours(initialAbsence.hours);
      setCourseName(initialAbsence.courseName || '');
      setNote(initialAbsence.note || '');
    } else {
      const targetDate = initialDate || findDefaultAbsenceDate(data, today);
      setDate(targetDate);
      const classesOnTarget = data.schedule[weekdayOf(targetDate)]?.classes || [];
      const defaultCourse = initialCourseName || (classesOnTarget.length > 0 ? classesOnTarget[0].name : (data.courses?.[0]?.name || ''));
      setCourseName(defaultCourse);

      if (isDays) {
        setHours(1);
      } else if (isCourseHours) {
        const matchingClass = classesOnTarget.find((c) => c.name === defaultCourse);
        setHours(matchingClass ? matchingClass.hours : 2);
      } else {
        const defaultLoad = getClassHoursForDate(data, targetDate);
        setHours(defaultLoad > 0 ? defaultLoad : 1);
      }
      setNote('');
    }
  }, [isOpen, initialAbsence, initialDate, initialCourseName, data, today, isDays, isCourseHours]);

  // When date changes, adjust hours to fit the new date
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const v = validateAbsence(data, { date: newDate, hours: 1 }, today, initialAbsence?.id);
    if (!isEditing) {
      if (isDays) {
        setHours(v.maxHours >= 1 ? 1 : v.maxHours > 0 ? v.maxHours : 1);
      } else if (isCourseHours) {
        const classesOnNew = data.schedule[weekdayOf(newDate)]?.classes || [];
        if (classesOnNew.length > 0) {
          const matchingCurrent = classesOnNew.find((c) => c.name === courseName);
          if (matchingCurrent) {
            setHours(matchingCurrent.hours);
          } else {
            setCourseName(classesOnNew[0].name);
            setHours(classesOnNew[0].hours);
          }
        }
      } else if (v.maxHours > 0) {
        setHours(v.maxHours);
      }
    } else {
      if (v.maxHours > 0 && hours > v.maxHours) {
        setHours(v.maxHours);
      }
    }
  };

  const validation = validateAbsence(
    data,
    { date, hours },
    today,
    initialAbsence?.id,
  );

  const maxSelectable = Math.max(1, validation.maxHours || validation.dayHours || 12);
  const isValid = validation.errors.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (isEditing && initialAbsence) {
      dispatch({
        type: 'updateAbsence',
        absence: {
          ...initialAbsence,
          date,
          hours,
          courseName: isCourseHours ? (courseName || 'Ders') : undefined,
          note: note.trim(),
        },
      });
    } else {
      dispatch({
        type: 'addAbsence',
        absence: {
          id: createId(),
          date,
          hours,
          courseName: isCourseHours ? (courseName || 'Ders') : undefined,
          note: note.trim(),
          createdAt: new Date().toISOString(),
        },
      });
    }

    onClose();
  };

  const getErrorMessage = (err: string) => {
    switch (err) {
      case 'outside-term':
        return tr.absence.errors.outsideTerm(`${formatDate(data.term.start)} – ${formatDate(data.term.end)}`);
      case 'holiday':
        return tr.absence.errors.holiday;
      case 'no-class':
        return tr.absence.errors.noClass;
      case 'day-full':
        return tr.absence.errors.dayFull;
      case 'invalid-date':
        return tr.absence.errors.invalidDate;
      case 'invalid-hours':
      case 'exceeds-day':
        return tr.absence.errors.hours(validation.maxHours, data.trackingUnit);
      default:
        return 'Hatalı giriş';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? tr.absence.editTitle : tr.absence.addTitle}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {tr.absence.date}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
          />
          {date && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {formatDate(date)} · {formatWeekday(date)}
            </p>
          )}
        </div>

        {/* Course Selection when in course_hours mode */}
        {isCourseHours && (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {tr.courses.selectCourse}
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Devamsızlık yapılacak dersi seçin.
              </p>
            </div>

            {/* Quick chips for classes scheduled on this date */}
            {dayClasses.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Bu günün programındaki dersler:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {dayClasses.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCourseName(c.name);
                        setHours(c.hours);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        courseName === c.name
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {c.name} ({c.hours} sa)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dropdown if multiple courses exist or course not on this day */}
            <div className="pt-1">
              <select
                value={courseName}
                onChange={(e) => {
                  setCourseName(e.target.value);
                  const matchingClass = dayClasses.find((c) => c.name === e.target.value);
                  if (matchingClass) setHours(matchingClass.hours);
                }}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              >
                <option value="">-- Ders Seçin --</option>
                {(data.courses || []).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} (Haftada {c.weeklyHours} sa · Limit: {c.allowedHours} sa)
                  </option>
                ))}
              </select>
            </div>

            {/* Course limit summary callout */}
            {selectedCourseSummary && (
              <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>{selectedCourseSummary.course.name} Kalan Hak:</span>
                <strong>
                  {selectedCourseSummary.remaining} sa (Limit: {selectedCourseSummary.course.allowedHours} sa, Kullanılan: {selectedCourseSummary.used} sa)
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Quantity Selection: Days or Hours */}
        {isDays ? (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-2.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Devamsızlık Süresi
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tam gün veya yarım gün devamsızlık seçebilirsiniz.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setHours(1)}
                disabled={validation.maxHours > 0 && validation.maxHours < 1}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  hours === 1
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                } ${validation.maxHours > 0 && validation.maxHours < 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {hours === 1 && <Check className="w-3.5 h-3.5" />}
                Tam Gün (1 Gün)
              </button>

              <button
                type="button"
                onClick={() => setHours(0.5)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  hours === 0.5
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-2xs'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                {hours === 0.5 && <Check className="w-3.5 h-3.5" />}
                Yarım Gün (0.5 Gün)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {tr.absence.hours}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {tr.absence.hoursRange(maxSelectable)}
                </p>
              </div>

              <Stepper
                value={hours}
                onChange={setHours}
                min={1}
                max={maxSelectable}
                unit={tr.common.hoursShort}
                label={tr.absence.hours}
                size="md"
              />
            </div>

            {/* Quick full day button */}
            {validation.maxHours > 1 && hours !== validation.maxHours && (
              <button
                type="button"
                onClick={() => setHours(validation.maxHours)}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:underline"
              >
                {tr.absence.fullDay(validation.maxHours)}
              </button>
            )}
          </div>
        )}

        {/* Optional Note */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {tr.absence.note} <span className="text-zinc-400 font-normal">({tr.absence.noteOptional})</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tr.absence.notePlaceholder}
            className="w-full text-sm px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
          />
        </div>

        {/* Errors banner */}
        {validation.errors.length > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-1">
            {validation.errors.map((err) => (
              <div key={err} className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{getErrorMessage(err)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings banner */}
        {validation.warnings.length > 0 && validation.errors.length === 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
            {validation.warnings.map((warn) => (
              <div key={warn} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{tr.absence.warnings[warn]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          {isEditing && onDelete && initialAbsence ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(initialAbsence.id);
                onClose();
              }}
              icon={<Trash2 className="w-4 h-4" />}
            >
              {tr.common.delete}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {tr.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={!isValid}>
              {tr.absence.submit}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
