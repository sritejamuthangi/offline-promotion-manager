import { Check } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { FONT_PAIRINGS, isPairing, pairingFonts } from '@/content/fontPairings';
import { isPalette, PALETTES, paletteColors } from '@/content/palettes';
import { applyThemeColors, applyThemeFonts } from '@/core/design/theme';
import { fontStack } from '@/core/fonts';
import { THEME_COLOR_KEYS } from '@/core/schema';
import { cn } from '@/lib/utils';
import { useEditor, useEditorStore } from './EditorContext';
import { FontSelect } from './FontSelect';
import { ColorField } from './fields';

const SWATCH_KEYS = ['primary', 'secondary', 'accent', 'surface', 'text'] as const;

const choiceClass =
  'relative w-full rounded-lg border bg-background p-1.5 text-start outline-none transition hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/30';

/** One-click colour palettes and font pairings, plus fine-tuning of the theme. */
export function StylesPanel() {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const headingId = useId();
  const bodyId = useId();

  return (
    <div className="space-y-6 p-4">
      <p className="text-muted-foreground text-xs">{t('styles.hint')}</p>

      <section className="space-y-2" aria-labelledby={`${headingId}-palettes`}>
        <h3 id={`${headingId}-palettes`} className="font-medium text-xs">
          {t('styles.palettesTitle')}
        </h3>
        <ul className="grid grid-cols-2 gap-2">
          {PALETTES.map((palette) => {
            const name = t(`styles.palettes.${palette.id}`);
            const active = isPalette(theme.colors, palette);
            return (
              <li key={palette.id}>
                <button
                  type="button"
                  className={choiceClass}
                  aria-pressed={active}
                  aria-label={t('styles.applyPalette', { name })}
                  title={name}
                  onClick={() =>
                    store.getState().edit((d) => applyThemeColors(d, paletteColors(palette.id)))
                  }
                >
                  <span
                    className="flex h-7 gap-1 rounded-md p-1 ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: palette.colors.background }}
                  >
                    {SWATCH_KEYS.map((key) => (
                      <span
                        key={key}
                        className="flex-1 rounded-sm"
                        style={{ backgroundColor: palette.colors[key] }}
                      />
                    ))}
                  </span>
                  <span className="mt-1 flex items-center gap-1 truncate text-xs">
                    {active && (
                      <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />
                    )}
                    {name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2" aria-labelledby={`${headingId}-pairings`}>
        <h3 id={`${headingId}-pairings`} className="font-medium text-xs">
          {t('styles.pairingsTitle')}
        </h3>
        <ul className="grid gap-2">
          {FONT_PAIRINGS.map((pairing) => {
            const name = t(`styles.pairings.${pairing.id}`);
            const active = isPairing(theme.fonts, pairing);
            return (
              <li key={pairing.id}>
                <button
                  type="button"
                  className={cn(choiceClass, 'px-3 py-2')}
                  aria-pressed={active}
                  aria-label={t('styles.applyPairing', {
                    name,
                    heading: pairing.heading,
                    body: pairing.body,
                  })}
                  onClick={() =>
                    store.getState().edit((d) => applyThemeFonts(d, pairingFonts(pairing.id)))
                  }
                >
                  <span
                    className="block truncate text-lg leading-tight"
                    style={{ fontFamily: fontStack(pairing.heading) }}
                  >
                    {name}
                  </span>
                  <span
                    className="block truncate text-muted-foreground text-xs"
                    style={{ fontFamily: fontStack(pairing.body) }}
                  >
                    {pairing.heading === pairing.body
                      ? pairing.heading
                      : `${pairing.heading} · ${pairing.body}`}
                  </span>
                  {active && (
                    <Check
                      className="absolute end-2 top-2 size-4 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="font-medium text-xs">{t('styles.customTitle')}</h3>
        {THEME_COLOR_KEYS.map((key) => (
          <ColorField
            key={key}
            label={t(`styles.slots.${key}`)}
            value={theme.colors[key]}
            theme={theme}
            onChange={(color) =>
              store.getState().edit((d) => {
                d.theme.colors[key] = color;
              })
            }
          />
        ))}
        <div className="grid gap-1.5">
          <Label htmlFor={headingId} className="text-muted-foreground text-xs">
            {t('styles.headingFont')}
          </Label>
          <FontSelect
            id={headingId}
            value={theme.fonts.heading}
            themeSlots={false}
            onChange={(font) =>
              store.getState().edit((d) => {
                d.theme.fonts.heading = font;
              })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={bodyId} className="text-muted-foreground text-xs">
            {t('styles.bodyFont')}
          </Label>
          <FontSelect
            id={bodyId}
            value={theme.fonts.body}
            themeSlots={false}
            onChange={(font) =>
              store.getState().edit((d) => {
                d.theme.fonts.body = font;
              })
            }
          />
        </div>
      </section>
    </div>
  );
}
