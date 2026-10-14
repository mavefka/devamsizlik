import { Minus, Plus } from 'lucide-react';
import { tr } from '../../i18n/tr';

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 16,
  step = 1,
  unit,
  label,
  disabled = false,
  size = 'md',
}: StepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const handleDecrease = () => {
    if (canDecrease) onChange(Math.max(min, value - step));
  };

  const handleIncrease = () => {
    if (canIncrease) onChange(Math.min(max, value + step));
  };

  const sizeClasses = {
    sm: {
      btn: 'w-7 h-7 sm:w-8 sm:h-8 text-xs rounded-lg sm:rounded-xl',
      text: 'text-xs sm:text-sm font-semibold min-w-[2rem] sm:min-w-[2.25rem]',
      icon: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
    },
    md: {
      btn: 'w-9 h-9 text-sm rounded-xl',
      text: 'text-base font-semibold min-w-[3rem]',
      icon: 'w-4 h-4',
    },
    lg: {
      btn: 'w-11 h-11 text-base rounded-xl',
      text: 'text-xl font-bold min-w-[3.5rem]',
      icon: 'w-5 h-5',
    },
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 shrink-0">
      <button
        type="button"
        disabled={!canDecrease}
        onClick={handleDecrease}
        aria-label={tr.common.decrease(label)}
        className={`${sizeClasses.btn} flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95`}
      >
        <Minus className={sizeClasses.icon} />
      </button>

      <div className={`${sizeClasses.text} text-center select-none text-zinc-900 dark:text-zinc-100 tabular-nums px-1`}>
        {value}
        {unit && <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-0.5">{unit}</span>}
      </div>

      <button
        type="button"
        disabled={!canIncrease}
        onClick={handleIncrease}
        aria-label={tr.common.increase(label)}
        className={`${sizeClasses.btn} flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95`}
      >
        <Plus className={sizeClasses.icon} />
      </button>
    </div>
  );
}
