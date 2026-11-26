import { useTranslation } from 'react-i18next';
import { NativeSelect } from '@/components/ui/native-select';
import { FONTS, getFont } from '@/core/fonts';
import { useEditor } from './EditorContext';

const INCLUDED = FONTS.filter((font) => font.bundled);
const DEVICE = FONTS.filter((font) => !font.bundled);

/**
 * Picks a font: the theme's heading and body slots (which follow one-click styles), fonts
 * included with the app, or fonts installed on this device.
 */
export function FontSelect({
  id,
  value,
  onChange,
  themeSlots = true,
}: {
  id: string;
  value: string;
  onChange: (font: string) => void;
  /** Offer `$heading` and `$body` (not for the theme's own font settings). */
  themeSlots?: boolean;
}) {
  const { t } = useTranslation();
  const fonts = useEditor((s) => s.doc.theme.fonts);
  const known = (themeSlots && value.startsWith('$')) || getFont(value) !== undefined;
  return (
    <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      {themeSlots && (
        <optgroup label={t('editor.fontGroups.theme')}>
          <option value="$heading">{`${t('editor.themeHeading')} (${fonts.heading})`}</option>
          <option value="$body">{`${t('editor.themeBody')} (${fonts.body})`}</option>
        </optgroup>
      )}
      <optgroup label={t('editor.fontGroups.included')}>
        {INCLUDED.map((font) => (
          <option key={font.family} value={font.family}>
            {font.family}
          </option>
        ))}
      </optgroup>
      <optgroup label={t('editor.fontGroups.device')}>
        {DEVICE.map((font) => (
          <option key={font.family} value={font.family}>
            {font.family}
          </option>
        ))}
      </optgroup>
      {!known && (
        <optgroup label={t('editor.fontGroups.other')}>
          <option value={value}>{value}</option>
        </optgroup>
      )}
    </NativeSelect>
  );
}
