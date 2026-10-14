import { useEffect, type ReactNode } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { tr } from '../../i18n/tr';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/scrollLock';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  onBack,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    lockBodyScroll();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container */}
      <div
        className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[88vh] animate-dialog-in my-auto`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 sm:pt-5 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-start gap-2.5 pr-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={tr.common.back}
                className="p-1.5 -ml-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={tr.common.close}
              className="p-1.5 -mr-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
