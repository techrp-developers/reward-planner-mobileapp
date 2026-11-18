export const LANGUAGES = {
  en: { nativeName: 'English', englishName: 'English', locale: 'en-IN' },
  hi: { nativeName: 'हिन्दी', englishName: 'Hindi', locale: 'hi-IN' },
  mr: { nativeName: 'मराठी', englishName: 'Marathi', locale: 'mr-IN' },
} as const;

export type AppLanguage = keyof typeof LANGUAGES;
export const DEFAULT_LANGUAGE: AppLanguage = 'en';
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES) as AppLanguage[];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
