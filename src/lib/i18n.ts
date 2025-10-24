// src/lib/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/common.json';
import fr from '../../public/locales/fr/common.json';
import pt from '../../public/locales/pt/common.json';

// Define resources type for TypeScript
interface resources {
  [language: string]: {
    common: Record<string, string>;
  };
}

const  resources = {
  en: { common: en },
  fr: { common: fr },
  pt: { common: pt },
};

// Initialize i18next
i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles escaping
    },
  });

export default i18next;