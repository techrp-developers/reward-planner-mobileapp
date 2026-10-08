import { NativeModules, Platform } from 'react-native';
import { applyAppIcon, refreshFestivalIcon } from '../iconService';
import { cmsApi } from '../../config/cmsApiClient';

jest.mock('../../config/cmsApiClient', () => ({ cmsApi: { get: jest.fn() } }));

const get = cmsApi.get as jest.Mock;
const androidSwitch = jest.fn().mockResolvedValue(null);
const iosSwitch = jest.fn().mockResolvedValue(null);

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  NativeModules.AppIconSwitcherModule = { setAppIcon: androidSwitch };
  NativeModules.AppIconSwitcher = { setAppIcon: iosSwitch };
});

test('Android sends its platform and passes the key to native', async () => {
  get.mockResolvedValue({ data: { success: true, data: { platform: 'android', icon_key: 'independence_day' } } });
  await refreshFestivalIcon();
  expect(get).toHaveBeenCalledWith('/content/resolved/app-icon', { params: { platform: 'android' } });
  expect(androidSwitch).toHaveBeenCalledWith('independence_day');
});

test('Navratri and Dasera reach Android native switching but restore default on unregistered iOS', async () => {
  for (const key of ['navratri', 'dasera']) await applyAppIcon(key);
  expect(androidSwitch.mock.calls).toEqual([['navratri'], ['dasera']]);
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  for (const key of ['navratri', 'dasera']) await applyAppIcon(key);
  expect(iosSwitch.mock.calls).toEqual([[null], [null]]);
});

test('unknown and prototype-like keys restore default', async () => {
  for (const key of ['unknown_festival', 'independence-day', 'toString', '__proto__']) await applyAppIcon(key);
  expect(androidSwitch.mock.calls).toEqual(Array(4).fill(['default']));
});

test('network failures and malformed responses preserve the icon', async () => {
  get.mockRejectedValueOnce(new Error('offline'));
  await expect(refreshFestivalIcon()).rejects.toThrow('offline');
  for (const data of [
    { success: false },
    { success: true, data: { platform: 'ios', icon_key: 'diwali' } },
    { success: true, data: { platform: 'android' } },
  ]) {
    get.mockResolvedValueOnce({ data });
    await expect(refreshFestivalIcon()).rejects.toThrow('Invalid resolved app-icon response');
  }
  expect(androidSwitch).not.toHaveBeenCalled();
});

test('overlapping startup and foreground refreshes share one request', async () => {
  get.mockResolvedValue({ data: { success: true, data: { platform: 'android', icon_key: 'holi' } } });
  await Promise.all([refreshFestivalIcon(), refreshFestivalIcon()]);
  expect(get).toHaveBeenCalledTimes(1);
  expect(androidSwitch).toHaveBeenCalledTimes(1);
});

test('iOS maps alternate names and resets default with null', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  get.mockResolvedValue({ data: { success: true, data: { platform: 'ios', icon_key: 'diwali' } } });
  await refreshFestivalIcon();
  expect(get).toHaveBeenCalledWith('/content/resolved/app-icon', { params: { platform: 'ios' } });
  expect(iosSwitch).toHaveBeenCalledWith('DiwaliIcon');
  await applyAppIcon('default');
  expect(iosSwitch).toHaveBeenLastCalledWith(null);
  expect(androidSwitch).not.toHaveBeenCalled();
});
