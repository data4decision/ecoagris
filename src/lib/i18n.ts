import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../public/locales/en/common.json";
import fr from "../../public/locales/fr/common.json";
import pt from "../../public/locales/pt/common.json";

const resources = {
  en: { common: en },
  fr: { common: fr },
  pt: { common: pt },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
