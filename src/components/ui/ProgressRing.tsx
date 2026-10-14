import { Status } from '../../types';
import { tr } from '../../i18n/tr';

export interface ProgressRingProps {
  usedRatio: number; // 0 to 1+
  status: Status;
  isOver?: boolean;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({
  usedRatio,
  status,
  isOver = false,
  size = 148,
  strokeWidth = 11,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedRatio = Math.min(1, Math.max(0, usedRatio));
  const strokeDashoffset = circumference - clampedRatio * circumference;
  const percentage = Math.round(usedRatio * 100);

  // Status colors
  const strokeColor = isOver
    ? 'text-rose-600 dark:text-rose-500 stroke-rose-600 dark:stroke-rose-500'
    : status === 'critical'
      ? 'text-rose-500 dark:text-rose-400 stroke-rose-500 dark:stroke-rose-400'
      : status === 'warning'
        ? 'text-amber-500 dark:text-amber-400 stroke-amber-500 dark:stroke-amber-400'
        : 'text-emerald-500 dark:text-emerald-400 stroke-emerald-500 dark:stroke-emerald-400';

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={tr.summary.ringLabel(percentage)}
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-100 dark:stroke-zinc-800"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className={`${strokeColor} transition-[stroke-dashoffset] duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={clampedRatio > 0 ? 'round' : 'butt'}
          fill="none"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {children}
      </div>
    </div>
  );
}
