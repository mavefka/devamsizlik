import type { AppData } from '../types';
import { exportAppData, parseAppData } from './importExport';

export const STORAGE_KEY = 'devamsizlik-takip:v1';

export function loadAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseAppData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Returns false if storage is full or unavailable (e.g. private mode). */
export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Triggers a browser download of the JSON backup. */
export function downloadBackup(data: AppData, today: string): void {
  const blob = new Blob([exportAppData(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devamsizlik-yedek-${today}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
