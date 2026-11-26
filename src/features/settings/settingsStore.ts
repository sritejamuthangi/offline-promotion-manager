import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageProvider } from '@/core/imageSearch';
import { browserLocale, defaultPaperFor, defaultUnitFor, type PaperFamily } from '@/core/locale';
import type { Unit } from '@/core/units';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePreference;
  /** Preferred unit for showing sizes; 'auto' follows the device's region. */
  unit: Unit | 'auto';
  /** Preferred paper family; 'auto' follows the device's region. */
  paper: PaperFamily | 'auto';
  /** Optional online image search (Openverse, Wikimedia Commons). On unless turned off. */
  imageSearch: boolean;
  imageProvider: ImageProvider;
  /** Show only images that may be used commercially and changed. */
  imageCommercialOnly: boolean;
  setTheme: (theme: ThemePreference) => void;
  setUnit: (unit: Unit | 'auto') => void;
  setPaper: (paper: PaperFamily | 'auto') => void;
  setImageSearch: (enabled: boolean) => void;
  setImageProvider: (provider: ImageProvider) => void;
  setImageCommercialOnly: (only: boolean) => void;
}

/** localStorage key. index.html reads it before first paint to apply the theme. */
export const SETTINGS_STORAGE_KEY = 'opm-settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      unit: 'auto',
      paper: 'auto',
      imageSearch: true,
      imageProvider: 'openverse',
      imageCommercialOnly: true,
      setTheme: (theme) => set({ theme }),
      setUnit: (unit) => set({ unit }),
      setPaper: (paper) => set({ paper }),
      setImageSearch: (imageSearch) => set({ imageSearch }),
      setImageProvider: (imageProvider) => set({ imageProvider }),
      setImageCommercialOnly: (imageCommercialOnly) => set({ imageCommercialOnly }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      // New settings are optional, so older saved settings still load (missing keys use
      // the defaults above) without a version bump.
      version: 1,
      partialize: ({ theme, unit, paper, imageSearch, imageProvider, imageCommercialOnly }) => ({
        theme,
        unit,
        paper,
        imageSearch,
        imageProvider,
        imageCommercialOnly,
      }),
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
