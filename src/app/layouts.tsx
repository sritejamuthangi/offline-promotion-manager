import { Link, Outlet } from '@tanstack/react-router';
import { LayoutTemplate, Settings, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APP } from '@/config/app';
import { OfflineNotices } from '@/pwa/OfflineNotices';
import { PageSeo } from '@/seo/PageSeo';
import { AboutDialog, useAboutDialog } from './about';
import { ThemeMenu, ThemeSync } from './theme';

/** Wraps every screen: theme, toasts and the About dialog. */
export function RootLayout() {
  return (
    <>
      <PageSeo />
      <ThemeSync />
      <Outlet />
      <AboutDialog />
      <OfflineNotices />
      <Toaster position="bottom-center" />
    </>
  );
}

/** Layout for regular pages (home, settings): header, content, footer. */
export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Logo className="size-8 shrink-0" />
          <span className="truncate sm:hidden">{APP.shortName}</span>
          <span className="hidden truncate sm:inline">{APP.name}</span>
        </Link>
        <nav aria-label={t('nav.mainNavigation')} className="ms-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
            <Link
              to="/templates"
              aria-label={t('nav.templates')}
              activeProps={{ 'aria-current': 'page' }}
            >
              <LayoutTemplate />
              {/* Phones keep the app name; the icon still names the page for assistive tech. */}
              <span className="hidden sm:inline">{t('nav.templates')}</span>
            </Link>
          </Button>
          <ThemeMenu />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon">
                <Link to="/settings" aria-label={t('nav.settings')}>
                  <Settings />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('nav.settings')}</TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const { t } = useTranslation();
  const openAbout = useAboutDialog((s) => s.setOpen);
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {t('footer.privacy')}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => openAbout(true)}
            className="rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t('footer.about')}
          </button>
          <span>{t('footer.openSource')}</span>
          <a
            href={APP.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t('footer.builtBy', { name: APP.author.name })}
          </a>
        </div>
      </div>
    </footer>
  );
}
