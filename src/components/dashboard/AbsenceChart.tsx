import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { getWeeklyBuckets, getMonthlyBuckets } from '../../lib/calc';
import { tr } from '../../i18n/tr';
import { SegmentedControl } from '../ui/SegmentedControl';
import { formatDayMonth, formatMonthShort } from '../../lib/dates';

export function AbsenceChart() {
  const { data } = useApp();
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [activeBucket, setActiveBucket] = useState<{ key: string; hours: number } | null>(null);

  const buckets = view === 'weekly' ? getWeeklyBuckets(data) : getMonthlyBuckets(data);
  const totalLogged = data.absences.reduce((s, a) => s + a.hours, 0);

  // Maximum hours for bar height scaling
  const maxHours = Math.max(1, ...buckets.map((b) => b.hours));

  const viewOptions = [
    { value: 'weekly' as const, label: tr.chart.weekly },
    { value: 'monthly' as const, label: tr.chart.monthly },
  ];

  const formatLabel = (key: string) => {
    return view === 'weekly' ? formatDayMonth(key) : formatMonthShort(key);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Segmented Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {tr.chart.title}
            </h3>
          </div>
        </div>

        <SegmentedControl
          options={viewOptions}
          value={view}
          onChange={(v) => {
            setView(v);
            setActiveBucket(null);
          }}
          size="sm"
        />
      </div>

      {totalLogged === 0 ? (
        <div className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {tr.chart.empty}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Active tooltip indicator */}
          <div className="h-5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            {activeBucket ? (
              <span className="font-medium text-zinc-900 dark:text-zinc-100 animate-fade-in">
                {view === 'weekly'
                  ? `${formatLabel(activeBucket.key)} haftası: ${tr.common.unit(activeBucket.hours, data.trackingUnit)}`
                  : `${formatLabel(activeBucket.key)}: ${tr.common.unit(activeBucket.hours, data.trackingUnit)}`}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-400">
                Detay görmek için sütunlara dokun
              </span>
            )}
          </div>

          {/* SVG/HTML Minimal Bar Chart */}
          <div className="h-36 pt-2 flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {buckets.map((b) => {
              const heightPct = Math.max(b.hours > 0 ? 8 : 2, (b.hours / maxHours) * 100);
              const isSelected = activeBucket?.key === b.key;

              return (
                <div
                  key={b.key}
                  className="flex-1 min-w-[20px] max-w-[48px] h-full flex flex-col justify-end items-center group cursor-pointer"
                  onMouseEnter={() => setActiveBucket(b)}
                  onMouseLeave={() => setActiveBucket(null)}
                  onClick={() => setActiveBucket(isSelected ? null : b)}
                  onTouchStart={() => setActiveBucket(b)}
                >
                  {/* Bar */}
                  <div className="w-full flex justify-center items-end h-[100px]">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                        b.hours === 0
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 group-hover:bg-zinc-200'
                          : isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 shadow-sm'
                            : 'bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-600'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 truncate max-w-full group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                    {formatLabel(b.key)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
