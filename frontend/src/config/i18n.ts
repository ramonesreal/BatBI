import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import pt from '../locales/pt.json';

i18n
  .use(LanguageDetector)       // Auto-detects browser/OS language
  .use(initReactI18next)       // Binds i18n instance to React
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: 'en',         // Default to English if detection fails
    supportedLngs: ['en', 'pt'],
    interpolation: {
      escapeValue: false,      // React already escapes output — no double-escaping needed
    },
    detection: {
      // Detection order: localStorage preference → browser language → HTML lang attribute
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'batbi_language',
    },
  });

export default i18n;
