export function AppLogo({
  className = 'w-9 h-9',
  rounded = 'rounded-xl',
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={`${className} ${rounded} overflow-hidden shadow-xs shrink-0 select-none flex items-center justify-center`}>
      <svg viewBox="0 0 32 32" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="9" className="fill-zinc-900 dark:fill-zinc-100" />
        <circle cx="16" cy="16" r="8" fill="none" className="stroke-zinc-700 dark:stroke-zinc-300" strokeWidth="2.75" />
        <path
          d="M16 8a8 8 0 0 1 8 8"
          fill="none"
          className="stroke-emerald-500 dark:stroke-emerald-600"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
