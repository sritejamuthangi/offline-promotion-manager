import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { browserLocale, defaultPaperFor, defaultUnitFor, type PaperFamily } from '@/core/locale';
import type { Unit } from '@/core/units';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePreference;
  /** Preferred unit for showing sizes; 'auto' follows the device's region. */
  unit: Unit | 'auto';
  /** Preferred paper family; 'auto' follows the device's region. */
  paper: PaperFamily | 'auto';
  setTheme: (theme: ThemePreference) => void;
  setUnit: (unit: Unit | 'auto') => void;
  setPaper: (paper: PaperFamily | 'auto') => void;
}

/** localStorage key. index.html reads it before first paint to apply the theme. */
export const SETTINGS_STORAGE_KEY = 'opm-settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      unit: 'auto',
      paper: 'auto',
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),
      setPaper: (paper) => set({ paper }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      partialize: ({ theme, unit, paper }) => ({ theme, unit, paper }),
    },
  ),
);

export function useEffectiveUnit(): Unit {
  const unit = useSettings((s) => s.unit);
  return unit === 'auto' ? defaultUnitFor(browserLocale()) : unit;
}

export function useEffectivePaper(): PaperFamily {
  const paper = useSettings((s) => s.paper);
  return paper === 'auto' ? defaultPaperFor(browserLocale()) : paper;
}
