import { useApp } from '../../state/AppContext';
import { getSummary, getOverallCourseSummary } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { ProgressRing } from '../ui/ProgressRing';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

export function StatusHero() {
  const { data } = useApp();
  const summary = getSummary(data);

  const unit = data.trackingUnit || 'hours';
  const isDays = unit === 'days';
  const isCourseHours = unit === 'course_hours';

  const overallCourses = isCourseHours && data.courses && data.courses.length > 0
    ? getOverallCourseSummary(data.courses, data.absences)
    : null;

  const isOver = overallCourses ? overallCourses.overCount > 0 : summary.overBy > 0;
  const isExactLimit = !overallCourses && summary.remaining === 0 && summary.allowed > 0 && !isOver;

  // Status badge icon and styles
  const statusBadge = overallCourses
    ? overallCourses.overCount > 0
      ? {
          label: `${overallCourses.overCount} Derste Aşım!`,
          icon: <Flame className="w-3.5 h-3.5" />,
          className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/70 dark:border-rose-800',
        }
      : overallCourses.criticalCount > 0
        ? {
            label: `${overallCourses.criticalCount} Derste Kritik!`,
            icon: <AlertOctagon className="w-3.5 h-3.5" />,
            className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900',
          }
        : overallCourses.warningCount > 0
          ? {
              label: `${overallCourses.warningCount} Ders Sınırda`,
              icon: <AlertTriangle className="w-3.5 h-3.5" />,
              className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900',
            }
          : {
              label: `${overallCourses.safeCount}/${overallCourses.totalCourses} Ders Güvende`,
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
            }
    : isOver
      ? {
          label: tr.status.over,
          icon: <Flame className="w-3.5 h-3.5" />,
          className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/70 dark:border-rose-800',
        }
      : summary.status === 'critical'
        ? {
            label: tr.status.critical,
            icon: <AlertOctagon className="w-3.5 h-3.5" />,
            className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900',
          }
        : summary.status === 'warning'
          ? {
              label: tr.status.warning,
              icon: <AlertTriangle className="w-3.5 h-3.5" />,
              className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900',
            }
          : {
              label: tr.status.safe,
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
            };

  // Headline message
  let headline = '';
  if (overallCourses) {
    if (overallCourses.overCount > 0) {
      headline = tr.courses.overDesc(overallCourses.mostAtRisk?.course.name || 'Ders', overallCourses.mostAtRisk?.overBy || 1);
    } else if (overallCourses.criticalCount > 0) {
      headline = tr.courses.atRiskDesc(overallCourses.mostAtRisk?.course.name || 'Ders', overallCourses.mostAtRisk?.remaining || 1);
    } else if (overallCourses.warningCount > 0) {
      headline = `${overallCourses.mostAtRisk?.course.name} dersinde devamsızlık %${Math.round((overallCourses.mostAtRisk?.ratio || 0) * 100)} seviyesine yükseldi (${overallCourses.mostAtRisk?.remaining} sa kaldı).`;
    } else {
      headline = tr.courses.allSafe;
    }
  } else if (data.allowedHours === 0) {
    headline = tr.summary.noAllowance;
  } else if (isOver) {
    headline = tr.summary.over(summary.overBy, unit);
  } else if (isExactLimit) {
    headline = tr.summary.reached(unit);
  } else {
    headline = tr.summary.headline[summary.status](summary.remaining, unit);
  }

  const percent = overallCourses
    ? overallCourses.totalAllowed > 0
      ? Math.round((overallCourses.totalUsed / overallCourses.totalAllowed) * 100)
      : 0
    : Math.round(summary.ratio * 100);

  const displayUsed = overallCourses ? overallCourses.totalUsed : summary.used;
  const displayAllowed = overallCourses ? overallCourses.totalAllowed : summary.allowed;

  return (
    <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left: Primary numeric indicator */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs select-none">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${statusBadge.className}`}>
              {statusBadge.icon}
              {statusBadge.label}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 font-normal">
              %{percent} {tr.summary.usage.toLowerCase()}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              {isCourseHours ? '📚 Ders Bazlı' : isDays ? '📅 Gün' : '⏱️ Saat'}
            </span>
          </div>

          {/* Big number */}
          <div>
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                {overallCourses
                  ? `${overallCourses.safeCount}/${overallCourses.totalCourses}`
                  : isOver
                    ? `+${summary.overBy}`
                    : summary.remaining}
              </span>
              <span className="text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400">
                {overallCourses
                  ? 'Ders Güvende'
                  : isOver
                    ? tr.summary.overUnit(unit)
                    : tr.summary.remainingUnit(unit)}
              </span>
            </div>

            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mt-1.5 max-w-md">
              {headline}
            </p>
          </div>

          {/* Quick breakdown pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {tr.summary.used}:
              </span>{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {tr.common.unit(displayUsed, unit)}
              </span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {tr.summary.allowed}:
              </span>{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {tr.common.unit(displayAllowed, unit)}
              </span>
            </div>
            {overallCourses && overallCourses.mostAtRisk && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <div>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">En Riskli:</span>{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {overallCourses.mostAtRisk.course.name} ({overallCourses.mostAtRisk.remaining} sa kaldı)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Progress ring */}
        <div className="shrink-0 flex items-center justify-center">
          <ProgressRing
            usedRatio={
              overallCourses
                ? overallCourses.mostAtRisk ? overallCourses.mostAtRisk.ratio : 0
                : data.allowedHours > 0
                  ? summary.used / data.allowedHours
                  : 0
            }
            status={overallCourses ? overallCourses.overallStatus : summary.status}
            isOver={isOver}
            size={136}
            strokeWidth={11}
          >
            <div className="flex flex-col items-center select-none">
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                %{percent}
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {displayUsed}/{displayAllowed} {tr.common.unitShort(unit)}
              </span>
            </div>
          </ProgressRing>
        </div>
      </div>
    </div>
  );
}
