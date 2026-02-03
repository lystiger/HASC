// frontend/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // load translations from your server
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // pass the i18n instance to react-i18next.
  .init({
    fallbackLng: 'en', // fallback language if the detected language is not available
    debug: true, // console log for debugging, remove in production

    supportedLngs: ['en', 'vi'],
    load: 'languageOnly',

    // Where to find the language files
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    // Configuration for LanguageDetector
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'], // persist language selection
    },

    interpolation: {
      escapeValue: false, // react already safes from xss
    },

    react: {
      useSuspense: false, // avoid blank screen without a Suspense boundary
    }
  });

export default i18n;
