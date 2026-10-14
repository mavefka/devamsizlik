export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'text-xs py-1 px-2.5',
    md: 'text-xs sm:text-sm py-1.5 px-3',
  }[size];

  return (
    <div
      role="tablist"
      className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 select-none"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={`${sizeClasses} font-medium rounded-lg transition-all duration-150 ${
              isSelected
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
