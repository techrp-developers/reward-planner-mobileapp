import { uses24HourClock } from 'react-native-localize';
import i18n from './index';
import { DEFAULT_LANGUAGE, isAppLanguage, LANGUAGES } from './languages';

export function getAppLanguage() {
  const language = i18n.language;
  return isAppLanguage(language) ? language : DEFAULT_LANGUAGE;
}

export function getAppLocale() {
  return LANGUAGES[getAppLanguage()].locale;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return Number.isFinite(value)
    ? value.toLocaleString(getAppLocale(), { numberingSystem: 'latn', ...options })
    : '0';
}

export function formatDisplayTime(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleTimeString(getAppLocale(), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !uses24HourClock(),
    ...options,
  });
}

export function formatINR(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(getAppLocale(), {
    ...options,
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'symbol',
  }).format(value);
}
