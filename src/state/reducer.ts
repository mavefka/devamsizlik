import type { Absence, AppData, SetupData, ThemePreference } from '../types';
import { createInitialAppData } from '../lib/defaults';
import { startNewTerm } from '../lib/term';

export type Action =
  | { type: 'completeSetup'; setup: SetupData }
  | { type: 'updateSetup'; setup: SetupData }
  | { type: 'startNewTerm'; setup: SetupData; now: string }
  | { type: 'addAbsence'; absence: Absence }
  | { type: 'updateAbsence'; absence: Absence }
  | { type: 'deleteAbsence'; id: string }
  | { type: 'deleteArchivedTerm'; id: string }
  | { type: 'setTheme'; theme: ThemePreference }
  | { type: 'replaceAll'; data: AppData }
  | { type: 'resetAll'; today: string };

export function appReducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'completeSetup':
      return { ...state, ...action.setup, onboarded: true };
    case 'updateSetup':
      return { ...state, ...action.setup };
    case 'startNewTerm':
      return startNewTerm(state, action.setup, action.now);
    case 'addAbsence':
      return { ...state, absences: [...state.absences, action.absence] };
    case 'updateAbsence':
      return { ...state, absences: state.absences.map((a) => (a.id === action.absence.id ? action.absence : a)) };
    case 'deleteAbsence':
      return { ...state, absences: state.absences.filter((a) => a.id !== action.id) };
    case 'deleteArchivedTerm':
      return { ...state, archive: state.archive.filter((t) => t.id !== action.id) };
    case 'setTheme':
      return { ...state, theme: action.theme };
    case 'replaceAll':
      return action.data;
    case 'resetAll':
      return { ...createInitialAppData(action.today), theme: state.theme };
  }
}
