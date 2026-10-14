import { BookOpen, Plus, ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { getCourseSummaries, getOverallCourseSummary } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import type { CourseSummary } from '../../lib/calc';

export interface CourseCardsProps {
  onOpenLogModal: (date?: string, courseName?: string) => void;
}

export function CourseCards({ onOpenLogModal }: CourseCardsProps) {
  const { data } = useApp();

  if (data.trackingUnit !== 'course_hours') return null;

  const courses = data.courses || [];
  if (courses.length === 0) return null;

  const summaries = getCourseSummaries(courses, data.absences);
  const overall = getOverallCourseSummary(courses, data.absences);

  const getStatusBadge = (s: CourseSummary) => {
    if (s.overBy > 0) {
      return {
        label: `${s.overBy} sa aşıldı!`,
        icon: <Flame className="w-3 h-3" />,
        className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        barColor: 'bg-rose-500',
      };
    }
    if (s.status === 'critical') {
      return {
        label: `${s.remaining} sa kaldı!`,
        icon: <AlertOctagon className="w-3 h-3" />,
        className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900',
        barColor: 'bg-rose-500',
      };
    }
    if (s.status === 'warning') {
      return {
        label: `${s.remaining} sa kaldı`,
        icon: <AlertTriangle className="w-3 h-3" />,
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        barColor: 'bg-amber-500',
      };
    }
    return {
      label: 'Güvende',
      icon: <ShieldCheck className="w-3 h-3" />,
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      barColor: 'bg-emerald-500',
    };
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {tr.courses.title}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {overall.safeCount}/{overall.totalCourses} ders güvende · Toplam {overall.totalUsed} sa devamsızlık
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
          📚 Ders Bazlı Takip
        </span>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summaries.map((s) => {
          const badge = getStatusBadge(s);
          const percent = Math.round(s.ratio * 100);

          return (
            <div
              key={s.course.id}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-800 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {s.course.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Haftada {s.course.weeklyHours} sa · Limit: {s.course.allowedHours} sa
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mt-3">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(s.used > 0 ? 5 : 0, percent))}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${badge.barColor}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Kullanılan:{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums">
                        {s.used} / {s.course.allowedHours} sa
                      </strong>{' '}
                      (%{percent})
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {s.overBy > 0 ? `+${s.overBy} sa aşıldı` : `${s.remaining} sa kaldı`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onOpenLogModal(undefined, s.course.name)}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Devamsızlık Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
