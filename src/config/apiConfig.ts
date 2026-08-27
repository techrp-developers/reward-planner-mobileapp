import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'live';
export type LocalAndroidTarget = 'physical' | 'emulator';
export type LocalIosTarget = 'simulator' | 'physical';

// Customer app APIs stay live; CMS preview endpoints use CMS_API_BASE_URL below.
export const API_ENVIRONMENT: ApiEnvironment = 'live';

// Local development targets. Keep these explicit because React Native cannot
// reach the development PC through localhost on a physical phone.
export const LOCAL_ANDROID_TARGET: LocalAndroidTarget = 'physical';
export const LOCAL_IOS_TARGET: LocalIosTarget = 'simulator';

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

const DEVELOPMENT_PC_LAN_URL = 'http://192.168.1.177:5000';
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
export const CMS_API_BASE_URL = LOCAL_SERVER_URL;
export const CMS_V1_URL = `${CMS_API_BASE_URL}/v1`;
export const CMS_UPLOADS_URL = `${CMS_API_BASE_URL}/uploads/`;

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
    return `${CMS_API_BASE_URL}${trimmed}`;
  }

  return trimmed;
};
