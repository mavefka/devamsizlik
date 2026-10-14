import { TrendingUp, Clock, CalendarDays } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { projectLimitDate, getRemainingClassHours, getTotalClassHours } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { formatLongDate, formatDate, daysBetween } from '../../lib/dates';

export function ProjectionCard() {
  const { data, today } = useApp();
  const projection = projectLimitDate(data, today);
  const remainingClasses = getRemainingClassHours(data, today);
  const totalClasses = getTotalClassHours(data);
  const daysLeft = daysBetween(today, data.term.end);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {tr.projection.title}
          </h3>
        </div>
      </div>

      {/* Projection message */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
        {projection.kind === 'date' && (
          <div className="space-y-1">
            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
              {tr.projection.datePrefix}{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-semibold underline decoration-rose-300 underline-offset-2">
                {formatLongDate(projection.date)}
              </strong>{' '}
              {tr.projection.dateSuffix}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {tr.projection.pace(projection.rate)}
            </p>
          </div>
        )}

        {projection.kind === 'safe-until-end' && (
          <div className="space-y-1">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              {tr.projection.safeUntilEnd}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {tr.projection.projectedTotal(Math.round(projection.projectedTotal), data.trackingUnit)} · {tr.projection.pace(projection.rate)}
            </p>
          </div>
        )}

        {projection.kind === 'no-data' && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {tr.projection.noData}
          </p>
        )}

        {projection.kind === 'limit-reached' && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {tr.projection.reached}
          </p>
        )}

        {projection.kind === 'ended' && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tr.projection.ended}
          </p>
        )}

        {projection.kind === 'not-started' && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tr.projection.notStarted(formatDate(data.term.start))}
          </p>
        )}
      </div>

      {/* Auxiliary metrics: Remaining class hours & term end */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/40 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">
              {data.trackingUnit === 'days' ? 'Kalan ders günü' : tr.projection.remainingClassHours}
            </span>
          </div>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {tr.common.unit(remainingClasses, data.trackingUnit)}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            toplam {tr.common.unit(totalClasses, data.trackingUnit)}
          </p>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/40 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{tr.projection.termEnd}</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {formatDate(data.term.end)}
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            {daysLeft > 0 ? tr.projection.daysLeft(daysLeft) : daysLeft === 0 ? tr.projection.daysLeft(0) : tr.projection.finished}
          </p>
        </div>
      </div>
    </div>
  );
}
