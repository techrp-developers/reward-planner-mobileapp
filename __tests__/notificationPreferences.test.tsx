import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Alert, Switch } from 'react-native';
import NotificationSettings from '../src/modules/dashboard/notification/NotificationSettings';
import api from '../src/modules/common/auth/api/axios';

jest.mock('../src/modules/common/auth/api/axios', () => ({
  __esModule: true, default: { get: jest.fn(), put: jest.fn() },
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock('../src/modules/ecommerce/constants/heading/OrderHeading', () => () => null);

const defaults = { language: 'en', marketing_enabled: false, engagement_enabled: false,
  quiet_hours_start: null, quiet_hours_end: null, stored: false };
let tree: ReactTestRenderer;
const response = (data: object) => ({ data: { success: true, data } });
const toggle = (label: string) => tree.root.findAllByType(Switch).find(n => n.props.accessibilityLabel === label)!;

beforeEach(() => {
  jest.clearAllMocks();
  (api.get as jest.Mock).mockResolvedValue(response(defaults));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.restoreAllMocks();
});

test('loads without writing consent, and saves only the explicitly changed flag', async () => {
  await act(async () => { tree = create(<NotificationSettings />); });
  expect(api.get).toHaveBeenCalledWith('/v1/notification/preferences');
  expect(api.put).not.toHaveBeenCalled();
  expect(toggle('Marketing notifications').props.value).toBe(false);
  (api.put as jest.Mock).mockResolvedValue(response({ ...defaults, marketing_enabled: true, stored: true }));
  await act(async () => { await toggle('Marketing notifications').props.onValueChange(true); });
  expect(api.put).toHaveBeenLastCalledWith('/v1/notification/preferences', { marketing_enabled: true });
  expect(toggle('Marketing notifications').props.value).toBe(true);
  (api.put as jest.Mock).mockResolvedValue(response({ ...defaults, stored: true }));
  await act(async () => { await toggle('Marketing notifications').props.onValueChange(false); });
  expect(api.put).toHaveBeenLastCalledWith('/v1/notification/preferences', { marketing_enabled: false });
});

test('a failed save keeps consent off and reports the failure', async () => {
  await act(async () => { tree = create(<NotificationSettings />); });
  (api.put as jest.Mock).mockRejectedValue({ response: { status: 503 } });
  await act(async () => { await toggle('Marketing notifications').props.onValueChange(true); });
  expect(toggle('Marketing notifications').props.value).toBe(false);
  expect(Alert.alert).toHaveBeenCalledWith('Not saved', expect.any(String));
});

test('quiet hours update both fields without granting consent', async () => {
  await act(async () => { tree = create(<NotificationSettings />); });
  (api.put as jest.Mock).mockResolvedValue(response({ ...defaults, quiet_hours_start: '22:00', quiet_hours_end: '07:00' }));
  await act(async () => { await toggle('Quiet hours (22:00 - 07:00)').props.onValueChange(true); });
  expect(api.put).toHaveBeenLastCalledWith('/v1/notification/preferences', { quiet_hours_start: '22:00', quiet_hours_end: '07:00' });
});

test('unavailable storage shows retry instead of editable default consent', async () => {
  (api.get as jest.Mock).mockRejectedValue({ response: { status: 503 } });
  await act(async () => { tree = create(<NotificationSettings />); });
  expect(tree.root.findAllByType(Switch)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('Tap to retry');
  expect(api.put).not.toHaveBeenCalled();
});
