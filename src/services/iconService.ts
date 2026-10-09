import { NativeModules, Platform } from 'react-native';
import { cmsApi } from '../config/cmsApiClient';

export const ICON_MAP = {
  ios: {
    default: 'AppIcon',
    diwali: 'DiwaliIcon',
    eid: 'EidIcon',
    christmas: 'ChristmasIcon',
    holi: 'HoliIcon',
    independence_day: 'IndependenceDayIcon',
  },
  android: {
    default: 'default',
    diwali: 'diwali',
    eid: 'eid',
    christmas: 'christmas',
    holi: 'holi',
    independence_day: 'independence_day',
    navratri: 'navratri',
    dasera: 'dasera',
  },
} as const;

type IconPlatform = keyof typeof ICON_MAP;
const APP_ICON_REQUEST_TIMEOUT_MS = 2500;

const getPlatform = (): IconPlatform | null =>
  Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null;

export const applyAppIcon = async (iconKey: string): Promise<void> => {
  const platform = getPlatform();
  if (!platform) return;
  const iconMap: Readonly<Record<string, string>> = ICON_MAP[platform];
  const key = Object.prototype.hasOwnProperty.call(iconMap, iconKey)
    ? iconKey
    : 'default';
  const bridge = platform === 'android'
    ? NativeModules.AppIconSwitcherModule
    : NativeModules.AppIconSwitcher;
  if (!bridge?.setAppIcon) throw new Error(`App icon native bridge is unavailable on ${platform}`);
  // Android owns ComponentName mapping; iOS receives its alternate asset name (null resets default).
  await bridge.setAppIcon(platform === 'ios' && key === 'default' ? null : iconMap[key]);
};

let refreshInFlight: Promise<void> | null = null;

export const refreshFestivalIcon = (): Promise<void> => {
  const platform = getPlatform();
  if (!platform) return Promise.resolve();
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { data } = await cmsApi.get('/content/resolved/app-icon', {
      params: { platform },
      timeout: APP_ICON_REQUEST_TIMEOUT_MS,
    });
    if (data?.success !== true || data.data?.platform !== platform || typeof data.data?.icon_key !== 'string') {
      throw new Error('Invalid resolved app-icon response');
    }
    // Fetch/validation failures never call the native bridge, preserving the current icon.
    await applyAppIcon(data.data.icon_key);
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
};
