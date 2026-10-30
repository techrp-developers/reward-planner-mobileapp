jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-firebase/app', () => ({ getApps: () => [], getApp: jest.fn() }));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: { getNotificationSettings: jest.fn(), openNotificationSettings: jest.fn() },
  AndroidImportance: { NONE: 0, LOW: 2, DEFAULT: 3, HIGH: 4 },
  AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1 },
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1 },
}));
jest.mock('../../src/config/apiConfig', () => ({
  SERVER_URL: 'http://localhost:5000',
  API_V1_URL: 'http://localhost:5000/v1',
}));
jest.mock('../../src/modules/services/api/api', () => ({ BASE_API_URL: 'http://localhost:5000/v1' }));
jest.mock('../../src/modules/common/auth/api/AuthAPI', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({}),
  clearAuthToken: jest.fn(),
}));
jest.mock('../../src/modules/common/auth/api/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import api from '../../src/modules/common/auth/api/axios';
import {
  declinePermissionPrompt,
  getNotificationPermissionState,
  openNotificationSystemSettings,
  requestNotificationPermission,
  shouldOfferPermissionPrompt,
} from '../../src/modules/common/notifications/pushPermission';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../src/modules/dashboard/notification/NotificationAPI';

const settings = notifee.getNotificationSettings as jest.Mock;
const setAndroidVersion = (version: number) => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  Object.defineProperty(Platform, 'Version', { value: version, configurable: true });
};

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  settings.mockResolvedValue({ authorizationStatus: 0 });
  setAndroidVersion(34);
});

describe('Android notification permission', () => {
  it('reports granted when the OS allows notifications', async () => {
    settings.mockResolvedValue({ authorizationStatus: 1 });
    expect(await getNotificationPermissionState()).toBe('granted');
    expect(await shouldOfferPermissionPrompt()).toBe(false);
  });

  it('offers the explanation once, then shows the real Android 13+ dialog', async () => {
    expect(await shouldOfferPermissionPrompt()).toBe(true);
    const request = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('granted');

    expect(await requestNotificationPermission()).toBe('granted');
    expect(request).toHaveBeenCalledWith('android.permission.POST_NOTIFICATIONS');
  });

  it('never requests again after a denial', async () => {
    const request = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue('denied');

    expect(await requestNotificationPermission()).toBe('denied');
    expect(await requestNotificationPermission()).toBe('denied');
    expect(request).toHaveBeenCalledTimes(1);
    expect(await shouldOfferPermissionPrompt()).toBe(false);
    expect(await getNotificationPermissionState()).toBe('denied');
  });

  it('treats "Not now" as the one ask, without the system dialog', async () => {
    const request = jest.spyOn(PermissionsAndroid, 'request');
    await declinePermissionPrompt();
    expect(await shouldOfferPermissionPrompt()).toBe(false);
    expect(await requestNotificationPermission()).toBe('denied');
    expect(request).not.toHaveBeenCalled();
  });

  it('recovers when the user later enables notifications in Settings', async () => {
    await declinePermissionPrompt();
    settings.mockResolvedValue({ authorizationStatus: 1 });
    expect(await getNotificationPermissionState()).toBe('granted');
  });

  it('never prompts on Android 12 and below', async () => {
    setAndroidVersion(31);
    const request = jest.spyOn(PermissionsAndroid, 'request');
    expect(await shouldOfferPermissionPrompt()).toBe(false);
    expect(await requestNotificationPermission()).toBe('denied');
    expect(request).not.toHaveBeenCalled();
  });

  it('opens app or per-channel Android settings', async () => {
    (notifee.openNotificationSettings as jest.Mock).mockResolvedValue(undefined);
    await openNotificationSystemSettings();
    await openNotificationSystemSettings('reward_planners_offers');
    expect(notifee.openNotificationSettings).toHaveBeenNthCalledWith(1, undefined);
    expect(notifee.openNotificationSettings).toHaveBeenNthCalledWith(2, 'reward_planners_offers');
  });
});

describe('notification preferences', () => {
  it('treats missing or unstored values as no consent', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { success: true, data: { stored: false } } });
    expect(await getNotificationPreferences()).toEqual(expect.objectContaining({
      marketing_enabled: false, engagement_enabled: false, stored: false,
    }));

    (api.get as jest.Mock).mockResolvedValue({ data: { data: { marketing_enabled: 'true' } } });
    expect((await getNotificationPreferences()).marketing_enabled).toBe(false);
  });

  it('sends only the field the user changed and returns persisted values', async () => {
    (api.put as jest.Mock).mockResolvedValue({
      data: { success: true, data: { marketing_enabled: true, engagement_enabled: false, language: 'mr', stored: true } },
    });
    const result = await updateNotificationPreferences({ marketing_enabled: true });

    expect(api.put).toHaveBeenCalledWith('/v1/notification/preferences', { marketing_enabled: true });
    expect(result).toEqual(expect.objectContaining({ marketing_enabled: true, language: 'mr', stored: true }));
  });
});
