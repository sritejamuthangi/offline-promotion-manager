import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

/**
 * Translations. To add a language: copy `locales/en.json` to `locales/<code>.json`,
 * translate the values (never the keys), register it below and in SUPPORTED_LANGUAGES.
 */
export const resources = {
  en: { translation: en },
} as const;

export const SUPPORTED_LANGUAGES = [{ code: 'en', nativeName: 'English' }] as const;

function applyDocumentLanguage(language: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.documentElement.dir = i18n.dir(language);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false }, // React already escapes output
});

i18n.on('languageChanged', applyDocumentLanguage);
applyDocumentLanguage(i18n.language);

export default i18n;
