import { createContext, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import type { AppData, ThemePreference } from '../types';
import { todayISO } from '../lib/dates';
import { createInitialAppData } from '../lib/defaults';
import { loadAppData, saveAppData } from '../lib/storage';
import { appReducer, type Action } from './reducer';
import { useAuth } from './AuthContext';

interface AppContextValue {
  data: AppData;
  dispatch: Dispatch<Action>;
  /** Local ISO date, refreshed when the tab regains focus or the day changes. */
  today: string;
  saveFailed: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return today;
}

function useApplyTheme(preference: ThemePreference) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#09090b' : '#fafafa');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const today = useToday();
  const { user, loadDataFromServer, saveDataToServer } = useAuth();
  const [data, dispatch] = useReducer(appReducer, undefined, () => loadAppData() ?? createInitialAppData(todayISO()));
  const [saveFailed, setSaveFailed] = useState(false);
  const isInitialServerLoadDone = useRef(false);

  // When user logs in, fetch from server
  useEffect(() => {
    if (user) {
      // Backup current local data before syncing to avoid any accidental loss
      try {
        const local = loadAppData();
        if (local && (local.absences.length > 0 || local.holidays.length > 0 || (local.courses && local.courses.length > 0) || local.onboarded)) {
          localStorage.setItem('devamsizlik-guest-backup', JSON.stringify(local));
        }
      } catch (e) {
        console.error('Guest backup error:', e);
      }

      loadDataFromServer().then((serverData) => {
        if (serverData) {
          dispatch({ type: 'replaceAll', data: serverData });
        } else {
          // If server has no data yet, push local data to server
          saveDataToServer(data);
        }
        isInitialServerLoadDone.current = true;
      });
    } else {
      isInitialServerLoadDone.current = false;
    }
  }, [user?.id]);

  // When data changes: save to local storage, and if user is logged in, debounce save to server
  useEffect(() => {
    setSaveFailed(!saveAppData(data));

    if (user && isInitialServerLoadDone.current) {
      const timer = setTimeout(() => {
        saveDataToServer(data);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [data, user?.id]);

  useApplyTheme(data.theme);

  return <AppContext.Provider value={{ data, dispatch, today, saveFailed }}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
