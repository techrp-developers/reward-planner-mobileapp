import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'live';
export type LocalAndroidTarget = 'physical' | 'emulator';
export type LocalIosTarget = 'simulator' | 'physical';

// Set to 'local' to point the app at your dev machine (DEVELOPMENT_PC_LAN_URL
// below); 'live' points it at the production server instead.
export const API_ENVIRONMENT: ApiEnvironment = 'local';

// Local development targets. Keep these explicit because React Native cannot
// reach the development PC through localhost on a physical phone.
export const LOCAL_ANDROID_TARGET: LocalAndroidTarget = 'physical';
export const LOCAL_IOS_TARGET: LocalIosTarget = 'simulator';

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

const DEVELOPMENT_PC_LAN_URL = 'http://192.168.1.186:5000';
const ANDROID_EMULATOR_SERVER_URL = 'http://10.0.2.2:5000';
const IOS_SIMULATOR_SERVER_URL = 'http://localhost:5000';

const getLocalAndroidServerUrl = (target: LocalAndroidTarget) =>
  target === 'emulator' ? ANDROID_EMULATOR_SERVER_URL : DEVELOPMENT_PC_LAN_URL;

const getLocalIosServerUrl = (target: LocalIosTarget) =>
  target === 'simulator' ? IOS_SIMULATOR_SERVER_URL : DEVELOPMENT_PC_LAN_URL;

const LOCAL_SERVER_URL = Platform.select({
  android: getLocalAndroidServerUrl(LOCAL_ANDROID_TARGET),
  ios: getLocalIosServerUrl(LOCAL_IOS_TARGET),
  default: DEVELOPMENT_PC_LAN_URL,
}) as string;

export const LOCAL_API_BASE_URL = LOCAL_SERVER_URL;

const LIVE_SERVER_URL = 'https://rewardplanners.com';

export const SERVER_URL =
  IS_LOCAL_ENVIRONMENT ? LOCAL_SERVER_URL : LIVE_SERVER_URL;

// Live traffic uses the reverse-proxy prefix; the local Express server does not.
export const API_BASE_URL =
  IS_LOCAL_ENVIRONMENT ? SERVER_URL : `${SERVER_URL}/api/crm`;
export const API_V1_URL = `${API_BASE_URL}/v1`;
export const API_V1_URL_WITH_SLASH = `${API_V1_URL}/`;
export const UPLOADS_URL =
  IS_LOCAL_ENVIRONMENT
    ? `${SERVER_URL}/uploads/`
    : `${API_BASE_URL}/uploads/`;

// Local content-management preview server for homepage/navbar banners/offers.
// Always resolves to the dev machine (never gated by API_ENVIRONMENT) since
// the CMS preview server only ever runs locally, independent of whether
// customer traffic is pointed at live or local.
export const CMS_API_BASE_URL = LOCAL_SERVER_URL;
export const CMS_V1_URL = `${CMS_API_BASE_URL}/v1`;
export const CMS_UPLOADS_URL = `${CMS_API_BASE_URL}/uploads/`;

let hasWarnedAboutUnreachableCmsApi = false;

const warnIfLocalCmsApiIsUnreachable = async () => {
  if (!__DEV__ || hasWarnedAboutUnreachableCmsApi) {
    return;
  }

  const timeoutMs = 3000;
  const sanityCheckUrl = `${CMS_API_BASE_URL}/content/modules`;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      fetch(sanityCheckUrl, { method: 'GET' }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('CMS API sanity check timed out')),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    if (!hasWarnedAboutUnreachableCmsApi) {
      hasWarnedAboutUnreachableCmsApi = true;
      console.warn(
        `⚠️ CMS_API_BASE_URL (${CMS_API_BASE_URL}) is unreachable. Your dev machine's LAN IP may have changed — run ipconfig/ifconfig and update DEVELOPMENT_PC_LAN_URL in apiConfig.ts.`,
        error,
      );
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

warnIfLocalCmsApiIsUnreachable();

// Single centralized resolver for every CMS-sourced image URL (navbar
// background, promotional banner, offers banner gallery, module icons).
// The CMS database stores whatever host the content-management server saw
// at upload time (localhost/127.0.0.1) — this rewrites it to whatever host
// the current device actually needs, and leaves already-correct or
// external/live URLs untouched.
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

  if (
    trimmed.startsWith('http://localhost:5000') ||
    trimmed.startsWith('http://127.0.0.1:5000')
  ) {
    return trimmed
      .replace('http://localhost:5000', CMS_API_BASE_URL)
      .replace('http://127.0.0.1:5000', CMS_API_BASE_URL);
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${CMS_UPLOADS_URL}${trimmed.replace(/^\/uploads\//, '')}`;
  }

  return trimmed;
};
