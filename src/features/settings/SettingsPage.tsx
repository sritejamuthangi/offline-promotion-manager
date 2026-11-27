import { Globe, HardDrive, Info, Monitor, Moon, ShieldAlert, ShieldCheck, Sun } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAboutDialog } from '@/app/about';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { browserLocale, defaultPaperFor, defaultUnitFor, type PaperFamily } from '@/core/locale';
import { UNITS, type Unit } from '@/core/units';
import { formatBytes } from '@/lib/format';
import { getStorageStatus, requestPersistentStorage, type StorageStatus } from '@/storage';
import { BackupCard } from './BackupCard';
import { OfflineCard } from './OfflineCard';
import { type ThemePreference, useSettings } from './settingsStore';

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">{t('settings.title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
      <div className="mt-8 grid gap-6">
        <AppearanceCard />
        <MeasurementsCard />
        <OnlineCard />
        <StorageCard />
        <OfflineCard />
        <BackupCard />
        <AboutCard />
      </div>
    </div>
  );
}

function AppearanceCard() {
  const { t } = useTranslation();
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const labelId = useId();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.appearanceTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <span id={labelId} className="font-medium text-sm">
          {t('theme.label')}
        </span>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(value) => value && setTheme(value as ThemePreference)}
          aria-labelledby={labelId}
        >
          <ToggleGroupItem value="system">
            <Monitor aria-hidden="true" />
            {t('theme.system')}
          </ToggleGroupItem>
          <ToggleGroupItem value="light">
            <Sun aria-hidden="true" />
            {t('theme.light')}
          </ToggleGroupItem>
          <ToggleGroupItem value="dark">
            <Moon aria-hidden="true" />
            {t('theme.dark')}
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}

function MeasurementsCard() {
  const { t } = useTranslation();
  const unit = useSettings((s) => s.unit);
  const paper = useSettings((s) => s.paper);
  const setUnit = useSettings((s) => s.setUnit);
  const setPaper = useSettings((s) => s.setPaper);
  const unitId = useId();
  const paperId = useId();
  const locale = browserLocale();
  const paperLabel = (family: PaperFamily) =>
    family === 'letter' ? t('settings.paperLetter') : t('settings.paperA4');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.measureTitle')}</CardTitle>
        <CardDescription>{t('settings.measureDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={unitId}>{t('settings.unitLabel')}</Label>
          <NativeSelect
            id={unitId}
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit | 'auto')}
          >
            <option value="auto">
              {t('settings.automatic', { value: t(`units.${defaultUnitFor(locale)}`) })}
            </option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`units.${u}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={paperId}>{t('settings.paperLabel')}</Label>
          <NativeSelect
            id={paperId}
            value={paper}
            onChange={(e) => setPaper(e.target.value as PaperFamily | 'auto')}
          >
            <option value="auto">
              {t('settings.automatic', { value: paperLabel(defaultPaperFor(locale)) })}
            </option>
            <option value="a4">{t('settings.paperA4')}</option>
            <option value="letter">{t('settings.paperLetter')}</option>
          </NativeSelect>
        </div>
      </CardContent>
    </Card>
  );
}

function OnlineCard() {
  const { t } = useTranslation();
  const imageSearch = useSettings((s) => s.imageSearch);
  const setImageSearch = useSettings((s) => s.setImageSearch);
  const id = useId();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('settings.onlineTitle')}
        </CardTitle>
        <CardDescription>{t('settings.onlineDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <input
            id={id}
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={imageSearch}
            aria-describedby={`${id}-hint`}
            onChange={(event) => setImageSearch(event.target.checked)}
          />
          <div className="grid gap-1">
            <Label htmlFor={id}>{t('settings.imageSearch')}</Label>
            <p id={`${id}-hint`} className="text-muted-foreground text-sm">
              {t('settings.imageSearchHint')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StorageCard() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<StorageStatus | null>(null);

  const refresh = useCallback(() => {
    getStorageStatus()
      .then(setStatus)
      .catch(() => setStatus({ supported: false, persisted: false }));
  }, []);

  useEffect(refresh, [refresh]);

  const protect = async () => {
    const granted = await requestPersistentStorage();
    if (granted) toast.success(t('settings.protectGranted'));
    else toast(t('settings.protectDenied'));
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('settings.storageTitle')}
        </CardTitle>
        <CardDescription>{t('settings.storageDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        {status && (
          <>
            <p>
              {status.usage !== undefined && status.quota !== undefined
                ? t('settings.storageUsage', {
                    used: formatBytes(status.usage, i18n.language),
                    quota: formatBytes(status.quota, i18n.language),
                  })
                : t('settings.storageUnknown')}
            </p>
            {status.persisted ? (
              <p className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('settings.protected')}
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {t('settings.notProtected')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => void protect()}
                >
                  {t('settings.protect')}
                </Button>
              </div>
            )}
          </>
        )}
        <p className="text-muted-foreground">{t('settings.clearWarning')}</p>
      </CardContent>
    </Card>
  );
}

function AboutCard() {
  const { t } = useTranslation();
  const openAbout = useAboutDialog((s) => s.setOpen);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.aboutTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => openAbout(true)}>
          <Info />
          {t('settings.openAbout')}
        </Button>
      </CardContent>
    </Card>
  );
}
