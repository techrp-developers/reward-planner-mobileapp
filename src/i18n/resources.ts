import en_auth from './locales/en/auth.json';
import en_busBooking from './locales/en/busBooking.json';
import en_chat from './locales/en/chat.json';
import en_common from './locales/en/common.json';
import en_dashboard from './locales/en/dashboard.json';
import en_fitness from './locales/en/fitness.json';
import en_games from './locales/en/games.json';
import en_insurance from './locales/en/insurance.json';
import en_language from './locales/en/language.json';
import en_notifications from './locales/en/notifications.json';
import en_payments from './locales/en/payments.json';
import en_polls from './locales/en/polls.json';
import en_products from './locales/en/products.json';
import en_profile from './locales/en/profile.json';
import en_services from './locales/en/services.json';
import en_status from './locales/en/status.json';
import en_stepCounter from './locales/en/stepCounter.json';
import hi_auth from './locales/hi/auth.json';
import hi_busBooking from './locales/hi/busBooking.json';
import hi_chat from './locales/hi/chat.json';
import hi_common from './locales/hi/common.json';
import hi_dashboard from './locales/hi/dashboard.json';
import hi_fitness from './locales/hi/fitness.json';
import hi_games from './locales/hi/games.json';
import hi_insurance from './locales/hi/insurance.json';
import hi_language from './locales/hi/language.json';
import hi_notifications from './locales/hi/notifications.json';
import hi_payments from './locales/hi/payments.json';
import hi_polls from './locales/hi/polls.json';
import hi_products from './locales/hi/products.json';
import hi_profile from './locales/hi/profile.json';
import hi_services from './locales/hi/services.json';
import hi_status from './locales/hi/status.json';
import hi_stepCounter from './locales/hi/stepCounter.json';
import mr_auth from './locales/mr/auth.json';
import mr_busBooking from './locales/mr/busBooking.json';
import mr_chat from './locales/mr/chat.json';
import mr_common from './locales/mr/common.json';
import mr_dashboard from './locales/mr/dashboard.json';
import mr_fitness from './locales/mr/fitness.json';
import mr_games from './locales/mr/games.json';
import mr_insurance from './locales/mr/insurance.json';
import mr_language from './locales/mr/language.json';
import mr_notifications from './locales/mr/notifications.json';
import mr_payments from './locales/mr/payments.json';
import mr_polls from './locales/mr/polls.json';
import mr_products from './locales/mr/products.json';
import mr_profile from './locales/mr/profile.json';
import mr_services from './locales/mr/services.json';
import mr_status from './locales/mr/status.json';
import mr_stepCounter from './locales/mr/stepCounter.json';

export const resources = {
  en: {
    auth: en_auth,
    busBooking: en_busBooking,
    chat: en_chat,
    common: en_common,
    dashboard: en_dashboard,
    fitness: en_fitness,
    games: en_games,
    insurance: en_insurance,
    language: en_language,
    notifications: en_notifications,
    payments: en_payments,
    polls: en_polls,
    products: en_products,
    profile: en_profile,
    services: en_services,
    status: en_status,
    stepCounter: en_stepCounter,
  },
  hi: {
    auth: hi_auth,
    busBooking: hi_busBooking,
    chat: hi_chat,
    common: hi_common,
    dashboard: hi_dashboard,
    fitness: hi_fitness,
    games: hi_games,
    insurance: hi_insurance,
    language: hi_language,
    notifications: hi_notifications,
    payments: hi_payments,
    polls: hi_polls,
    products: hi_products,
    profile: hi_profile,
    services: hi_services,
    status: hi_status,
    stepCounter: hi_stepCounter,
  },
  mr: {
    auth: mr_auth,
    busBooking: mr_busBooking,
    chat: mr_chat,
    common: mr_common,
    dashboard: mr_dashboard,
    fitness: mr_fitness,
    games: mr_games,
    insurance: mr_insurance,
    language: mr_language,
    notifications: mr_notifications,
    payments: mr_payments,
    polls: mr_polls,
    products: mr_products,
    profile: mr_profile,
    services: mr_services,
    status: mr_status,
    stepCounter: mr_stepCounter,
  },
};

export type TranslationNamespace = keyof typeof resources.en;
export type TranslationKey<Namespace extends TranslationNamespace> = keyof (typeof resources.en)[Namespace] & string;
