import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'live';

// Change only this value to switch every app API call.
export const API_ENVIRONMENT: ApiEnvironment = 'local';
export const LOCAL_API_PORT = 5000;

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

const LOCALHOST_SERVER_URL = `http://localhost:${LOCAL_API_PORT}`;

const LOCAL_SERVER_URL = Platform.select({
  android: LOCALHOST_SERVER_URL,
  ios: LOCALHOST_SERVER_URL,
  default: LOCALHOST_SERVER_URL,
}) as string;

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
      const isLoopbackHost =
        url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      const isLocalCmsPort =
        url.port === String(LOCAL_API_PORT) ||
        (!url.port && url.protocol === 'http:');

      if (isLoopbackHost && isLocalCmsPort) {
        return `${API_BASE_URL}${url.pathname}${url.search}${url.hash}`;
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
