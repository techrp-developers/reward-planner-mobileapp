import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export type ApiEnvironment = 'local' | 'live';

// Leave this as null for the normal behavior:
// - debug/development builds use the local API
// - production/release builds use the live API
// Set to 'live' or 'local' only when you need to force a target while testing.
const API_ENVIRONMENT_OVERRIDE: ApiEnvironment | null = null;

export const API_ENVIRONMENT: ApiEnvironment =
  API_ENVIRONMENT_OVERRIDE ?? (__DEV__ ? 'local' : 'live');
export const LOCAL_API_PORT = 5000;

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

// The ONLY place to edit when your dev machine's LAN IP changes (DHCP
// renewal, new Wi-Fi network, etc). Run `ipconfig` (Windows) / `ifconfig`
// (Mac/Linux) to find it — physical devices need this because 'localhost'
// on-device points back at the device itself, not your PC.
export const LOCAL_API_HOST = '192.168.1.220';

// Keep false for normal Wi-Fi/LAN development. Set true only when developing
// over USB with `adb reverse tcp:5000 tcp:5000`.
export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = true;

// Resolve the right local host per target automatically:
// - Android emulator: 10.0.2.2 is the AVD's alias for the host machine.
// - iOS simulator: shares the host's network namespace, so localhost works.
// - Physical device (either OS): must hit the dev machine's real LAN IP.
const resolveLocalHost = (): string => {
  const isEmulator = DeviceInfo.isEmulatorSync();

  if (Platform.OS === 'android') {
    if (!isEmulator && USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL) {
      return 'localhost';
    }

    return isEmulator ? '10.0.2.2' : LOCAL_API_HOST;
  }

  if (Platform.OS === 'ios') {
    return isEmulator ? 'localhost' : LOCAL_API_HOST;
  }

  return LOCAL_API_HOST;
};

export const LOCAL_SERVER_HOST = IS_LOCAL_ENVIRONMENT ? resolveLocalHost() : '';
const LOCAL_SERVER_URL = `http://${LOCAL_SERVER_HOST}:${LOCAL_API_PORT}`;

const LIVE_SERVER_URL = 'https://rewardplanners.com';

export const SERVER_URL = IS_LOCAL_ENVIRONMENT ? LOCAL_SERVER_URL : LIVE_SERVER_URL;

// Live traffic uses the reverse-proxy prefix; the local Express server does not.
export const API_BASE_URL =
  IS_LOCAL_ENVIRONMENT ? SERVER_URL : `${SERVER_URL}/api/crm`;
export const API_V1_URL = `${API_BASE_URL}/v1`;
export const API_V1_URL_WITH_SLASH = `${API_V1_URL}/`;
export const UPLOADS_URL =
  IS_LOCAL_ENVIRONMENT
    ? `${SERVER_URL}/uploads/`
    : `${API_BASE_URL}/uploads/`;

const LOCAL_BACKEND_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  LOCAL_API_HOST,
]);

if (__DEV__) {
  console.log(`[API] Environment: ${API_ENVIRONMENT}`);
  console.log(`[API] Platform: ${Platform.OS} (${DeviceInfo.isEmulatorSync() ? 'emulator/simulator' : 'physical device'})`);
  console.log(`[API] Local host: ${LOCAL_SERVER_HOST || '(not used)'}`);
  console.log(`[API] Local port: ${LOCAL_API_PORT}`);
  console.log(`[API] Base URL: ${API_BASE_URL}`);
}

export const normalizeLocalCmsImageUrl = (
  imageUrl: string | null | undefined,
): string | null => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  const trimmed = imageUrl.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const isLocalBackendHost = LOCAL_BACKEND_HOSTS.has(url.hostname);
      const isLocalCmsPort =
        url.port === String(LOCAL_API_PORT) ||
        (!url.port && url.protocol === 'http:');

      if (IS_LOCAL_ENVIRONMENT && isLocalBackendHost && isLocalCmsPort) {
        // RN's built-in URL polyfill force-appends a trailing "/" to
        // .pathname for any URL with no query/hash, corrupting file paths
        // (e.g. "...jpg" -> "...jpg/"). Slice the path off the original
        // string instead of trusting url.pathname/search/hash.
        const originMatch = trimmed.match(/^https?:\/\/[^/]+/i);
        const pathAndQuery = originMatch ? trimmed.slice(originMatch[0].length) : '';
        return `${SERVER_URL}${pathAndQuery}`;
      }
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${UPLOADS_URL}${trimmed.replace(/^\/uploads\//, '')}`;
  }

  return trimmed;
};
