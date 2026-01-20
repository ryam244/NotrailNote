import { create } from 'zustand';
import type { UserSettings } from '@/types';

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;

  // Actions
  setSettings: (settings: UserSettings) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  setTheme: (theme: UserSettings['theme']) => void;
  setFontSize: (fontSize: UserSettings['fontSize']) => void;
  toggleFocusMode: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  fontSize: 'medium',
  focusMode: false,
  github: undefined,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: true,

  setSettings: (settings) => set({ settings }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  setTheme: (theme) =>
    set((state) => ({
      settings: { ...state.settings, theme },
    })),

  setFontSize: (fontSize) =>
    set((state) => ({
      settings: { ...state.settings, fontSize },
    })),

  toggleFocusMode: () =>
    set((state) => ({
      settings: { ...state.settings, focusMode: !state.settings.focusMode },
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));
