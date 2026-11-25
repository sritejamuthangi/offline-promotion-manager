import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ThemePreference, useSettings } from '@/features/settings/settingsStore';
import { useMediaQuery } from '@/lib/hooks';

export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useSettings((s) => s.theme);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

/** Keeps the `dark` class on <html> in sync with the chosen theme. */
export function ThemeSync(): null {
  const theme = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}

const THEME_OPTIONS = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
] as const satisfies ReadonlyArray<{ value: ThemePreference; icon: unknown }>;

export function ThemeMenu() {
  const { t } = useTranslation();
  const preference = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const resolved = useResolvedTheme();
  const Icon = resolved === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme.change')}>
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setTheme(value as ThemePreference)}
        >
          {THEME_OPTIONS.map(({ value, icon: OptionIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <OptionIcon />
              {t(`theme.${value}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
