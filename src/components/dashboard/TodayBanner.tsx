import { Calendar, Plus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { getDayKind, getClassHoursForDate, getLoggedHoursOnDate } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { formatWeekday, weekdayOf } from '../../lib/dates';
import { Button } from '../ui/Button';
import { createId } from '../../lib/id';

export interface TodayBannerProps {
  onOpenLogModal: (date?: string, courseName?: string) => void;
}

export function TodayBanner({ onOpenLogModal }: TodayBannerProps) {
  const { data, dispatch, today } = useApp();

  const kind = getDayKind(data, today);
  const classHours = getClassHoursForDate(data, today);
  const loggedHours = getLoggedHoursOnDate(data.absences, today);
  const remainingToday = Math.max(0, classHours - loggedHours);
  const weekdayName = formatWeekday(today);

  const unit = data.trackingUnit || 'hours';
  const isDays = unit === 'days';
  const isCourseHours = unit === 'course_hours';

  const todayClasses = isCourseHours ? data.schedule[weekdayOf(today)]?.classes || [] : [];

  // If outside term, show nothing or brief notification
  if (kind === 'outside-term') return null;

  const handleQuickLogFullDay = () => {
    if (remainingToday <= 0) return;
    dispatch({
      type: 'addAbsence',
      absence: {
        id: createId(),
        date: today,
        hours: remainingToday,
        note: '',
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleQuickLogCourse = (courseName: string, hours: number) => {
    dispatch({
      type: 'addAbsence',
      absence: {
        id: createId(),
        date: today,
        hours,
        courseName,
        note: '',
        createdAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/60 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {tr.common.today} · {weekdayName}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">
            {kind === 'holiday'
              ? tr.today.holiday
              : kind === 'no-class'
                ? tr.today['no-class']
                : isCourseHours && todayClasses.length > 0
                  ? `Bugün: ${todayClasses.map((c) => `${c.name} (${c.hours} sa)`).join(', ')} var`
                  : tr.today.class(classHours, unit)}
          </p>
        </div>
      </div>

      {kind === 'class' && (
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {isCourseHours && todayClasses.length > 0 ? (
            <>
              {todayClasses.map((cls) => {
                const isLogged = data.absences.some(
                  (a) => a.date === today && a.courseName === cls.name,
                );
                return isLogged ? (
                  <div
                    key={cls.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {cls.name} ({cls.hours} sa) yazıldı
                  </div>
                ) : (
                  <Button
                    key={cls.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickLogCourse(cls.name, cls.hours)}
                    className="text-xs"
                  >
                    + {cls.name} ({cls.hours} sa)
                  </Button>
                );
              })}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenLogModal(today)}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {tr.nav.addAbsence}
              </Button>
            </>
          ) : loggedHours > 0 && remainingToday === 0 ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
              <CheckCircle2 className="w-4 h-4" />
              {tr.absence.alreadyLogged(loggedHours, unit)}
            </div>
          ) : (
            <>
              {remainingToday === classHours && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickLogFullDay}
                  className="text-xs"
                >
                  {tr.absence.fullDay(remainingToday, unit)}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenLogModal(today)}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {remainingToday < classHours ? (isDays ? 'Devamsızlık Ekle' : 'Saat Ekle') : tr.nav.addAbsence}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
