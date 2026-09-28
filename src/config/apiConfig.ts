import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export type ApiEnvironment = 'local' | 'live';

// Leave this as null for the normal behavior:
// - debug/development builds use the local API
// - production/release builds use the live API
// Set to 'live' or 'local' only when you need to force a target while testing.
const API_ENVIRONMENT_OVERRIDE: ApiEnvironment | null = 'live';

export const API_ENVIRONMENT: ApiEnvironment =
  API_ENVIRONMENT_OVERRIDE ?? (__DEV__ ? 'local' : 'live');
export const LOCAL_API_PORT = 5000;

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

// The ONLY place to edit when your dev machine's LAN IP changes (DHCP
// renewal, new Wi-Fi network, etc). Run `ipconfig` (Windows) / `ifconfig`
// (Mac/Linux) to find it — physical devices need this because 'localhost'
// on-device points back at the device itself, not your PC.
export const LOCAL_API_HOST = '192.168.1.111';

// Physical Android devices can use adb reverse to reach the dev machine at
// 127.0.0.1 when the local Wi-Fi cannot route to LOCAL_API_HOST.
export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = true;

// Resolve the right local host per target automatically:
// - Android emulator: 10.0.2.2 is the AVD's alias for the host machine.
// - iOS simulator: shares the host's network namespace, so localhost works.
// - Physical device (either OS): must hit the dev machine's real LAN IP.
const resolveLocalHost = (): string => {
  const isEmulator = DeviceInfo.isEmulatorSync();

  if (Platform.OS === 'android') {
    if (isEmulator) {
      return '10.0.2.2';
    }

    return USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL ? '127.0.0.1' : LOCAL_API_HOST;
  }

  if (Platform.OS === 'ios') {
    return isEmulator ? 'localhost' : LOCAL_API_HOST;
  }

  return LOCAL_API_HOST;
};

export const LOCAL_SERVER_HOST = IS_LOCAL_ENVIRONMENT ? resolveLocalHost() : '';
const LOCAL_SERVER_URL = `http://${LOCAL_SERVER_HOST}:${LOCAL_API_PORT}`;

const LIVE_SERVER_URL = 'https://rewardplanners.com';
const LIVE_IMAGE_CDN_URL = 'https://cdn.rewardplanners.com';

export const SERVER_URL = IS_LOCAL_ENVIRONMENT ? LOCAL_SERVER_URL : LIVE_SERVER_URL;
export const IMAGE_CDN_URL = IS_LOCAL_ENVIRONMENT ? SERVER_URL : LIVE_IMAGE_CDN_URL;

// Live traffic uses the reverse-proxy prefix; the local Express server does not.
export const API_BASE_URL =
  IS_LOCAL_ENVIRONMENT ? SERVER_URL : `${SERVER_URL}/api/crm`;
export const API_V1_URL = `${API_BASE_URL}/v1`;
export const API_V1_URL_WITH_SLASH = `${API_V1_URL}/`;
export const UPLOADS_URL = IS_LOCAL_ENVIRONMENT
  ? `${SERVER_URL}/uploads/`
  : `${IMAGE_CDN_URL}/public/`;

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

  const stripImageTrailingSlash = (value: string) =>
    value.replace(/(\.(?:png|jpe?g|webp|gif|svg|avif))\/(?=([?#]|$))/i, '$1');

  const normalizeUploadsPath = (path: string) =>
    stripImageTrailingSlash(
      path
        .replace(/^\/api\/crm\/uploads\//i, '/uploads/')
        .replace(/^\/uploads\//i, IS_LOCAL_ENVIRONMENT ? '/uploads/' : '/public/'),
    );

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
        return encodeURI(`${SERVER_URL}${pathAndQuery}`);
      }

      const isRewardPlannersHost =
        url.hostname === 'rewardplanners.com' ||
        url.hostname.endsWith('.rewardplanners.com');
      const normalizedProtocol = isRewardPlannersHost ? 'https:' : url.protocol;
      const normalizedPath = normalizeUploadsPath(url.pathname);
      const origin =
        isRewardPlannersHost &&
        (normalizedPath.startsWith('/uploads/') || normalizedPath.startsWith('/public/'))
          ? IMAGE_CDN_URL
          : `${normalizedProtocol}//${url.host}`;

      return encodeURI(
        `${origin}${normalizedPath}${url.search}${url.hash}`,
      );
    } catch {
      return encodeURI(stripImageTrailingSlash(trimmed));
    }
  }

  if (/^\/?api\/crm\/uploads\//i.test(trimmed)) {
    return encodeURI(
      `${UPLOADS_URL}${stripImageTrailingSlash(trimmed).replace(/^\/?api\/crm\/uploads\//i, '')}`,
    );
  }

  if (/^\/?uploads\//i.test(trimmed)) {
    return encodeURI(
      `${UPLOADS_URL}${stripImageTrailingSlash(trimmed).replace(/^\/?uploads\//i, '')}`,
    );
  }

  return encodeURI(stripImageTrailingSlash(trimmed));
};
