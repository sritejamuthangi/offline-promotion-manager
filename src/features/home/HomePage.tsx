import { useTranslation } from 'react-i18next';
import { DesignsSection } from './DesignsSection';
import { QuickCreate } from './QuickCreate';
import { TemplatesSection } from './TemplatesSection';

export function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand via-[oklch(0.55_0.24_330)] to-brand-2 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute -end-16 -top-20 -z-10 size-72 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute start-1/3 -bottom-28 -z-10 size-80 rounded-full bg-white/10 blur-3xl"
        />
        <h1 className="max-w-2xl text-balance font-bold text-3xl tracking-tight sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="mt-3 max-w-xl text-pretty text-base text-white/85 sm:text-lg">
          {t('home.subtitle')}
        </p>
      </section>

      <QuickCreate />
      <TemplatesSection />
      <DesignsSection />
    </div>
  );
}
