import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, children, className = '', disabled, ...props },
  ref,
) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm shadow-zinc-950/10 active:bg-zinc-950 dark:active:bg-zinc-300',
    secondary:
      'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700/80 active:bg-zinc-200/80 dark:active:bg-zinc-700',
    outline:
      'border border-zinc-200 text-zinc-800 hover:bg-zinc-100/70 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/60 dark:hover:border-zinc-700',
    ghost:
      'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80 active:bg-zinc-200/60 dark:active:bg-zinc-800',
    danger:
      'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/50',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs h-8 px-3 gap-1.5',
    md: 'text-sm h-10 px-4 gap-2',
    lg: 'text-base h-12 px-5 gap-2.5',
    icon: 'h-10 w-10 p-0 shrink-0',
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
});
