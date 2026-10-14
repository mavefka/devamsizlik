import { Settings, Plus, Sun, Moon, AlertCircle, User, Github } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { tr } from '../../i18n/tr';
import { Button } from '../ui/Button';
import { formatRange } from '../../lib/dates';

import { useAuth } from '../../state/AuthContext';

import { AppLogo } from '../ui/AppLogo';

export interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLogModal: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export function Header({
  onOpenSettings,
  onOpenLogModal,
  onOpenAuth,
  onOpenProfile,
}: HeaderProps) {
  const { data, dispatch, saveFailed } = useApp();
  const { user } = useAuth();

  const isDark =
    data.theme === 'dark' ||
    (data.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    dispatch({ type: 'setTheme', theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Term Info */}
        <div className="flex items-center gap-3 min-w-0">
          <AppLogo className="w-9 h-9" />
          <div className="hidden sm:block min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {tr.appName}
              </h1>
              {data.term.name && (
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                  {data.term.name}
                </span>
              )}
              <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
                {data.trackingUnit === 'course_hours'
                  ? '📚 Ders Bazlı Sistem'
                  : data.trackingUnit === 'days'
                    ? '📅 Gün Sistemi'
                    : '⏱️ Saat Sistemi'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {formatRange(data.term.start, data.term.end)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {saveFailed && (
            <div
              title={tr.settings.saveError}
              className="flex items-center text-rose-500 p-2"
            >
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          {/* Theme switcher (desktop only; mobile uses Settings) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 transition-transform duration-200 hover:rotate-45 text-amber-500 dark:text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* User Account / Profile */}
          {user ? (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Profilimi aç"
              title={user.displayName || user.username}
              className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:ring-2 hover:ring-zinc-400 transition-all shrink-0"
            >
              {user.avatarUrl ? (
                <>
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.avatar-header-fallback');
                      if (fallback) (fallback as HTMLElement).style.display = 'inline';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <span className="avatar-header-fallback" style={{ display: 'none' }}>
                    {(user.displayName || user.username)[0].toUpperCase()}
                  </span>
                </>
              ) : (
                <span>{(user.displayName || user.username)[0].toUpperCase()}</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label="Giriş yap veya kayıt ol"
              title="Giriş Yap"
              className="h-9 px-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Giriş</span>
            </button>
          )}

          {/* GitHub Repository */}
          <a
            href="https://github.com/mavefka/devamsizlik"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Deposu"
            title="GitHub (mavefka/devamsizlik)"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shrink-0"
          >
            <Github className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </a>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={tr.settings.title}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Log Absence Button (desktop only; mobile uses floating FAB) */}
          <div className="hidden sm:block">
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenLogModal}
              icon={<Plus className="w-4 h-4" />}
              className="shadow-xs"
            >
              {tr.nav.addAbsence}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
