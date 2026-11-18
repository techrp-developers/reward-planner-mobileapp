import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './languages';
import { resources } from './resources';

const i18n = createInstance();
export const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'common',
  ns: Object.keys(resources.en),
  initAsync: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});

export default i18n;
