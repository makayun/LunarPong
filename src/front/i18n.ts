import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import cs from '../locales/cs.json';
import ru from '../locales/ru.json';
import de from '../locales/de.json'; // add more if needed

i18n
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: true,
    resources: {
      en: { translation: en },
	  cs: { translation: cs },
      ru: { translation: ru },
      de: { translation: de },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
