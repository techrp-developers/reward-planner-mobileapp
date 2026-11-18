import React from 'react';
import { AppState, NativeModules, type AppStateStatus } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { getGrantedPermissions, readRecords } from 'react-native-health-connect';
import { StepTrackerProvider, useStepTrackerContext } from '../src/modules/step_counter/context/StepTrackerContext';

jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  Object.defineProperty(native.Platform, 'OS', { configurable: true, value: 'android' });
  return native;
});
jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: { SDK_UNAVAILABLE: 1, SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2, SDK_AVAILABLE: 3 },
  getSdkStatus: jest.fn().mockResolvedValue(3),
  initialize: jest.fn().mockResolvedValue(true),
  getGrantedPermissions: jest.fn(),
  aggregateRecord: jest.fn().mockResolvedValue({ COUNT_TOTAL: 0 }),
  readRecords: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => mockQueryClient }));
jest.mock('../src/modules/step_counter/api/Stepsapi', () => ({ syncStepsToServer: jest.fn() }));
jest.mock('../src/modules/step_counter/api/ProfileAPI', () => ({
  fetchProfileStepStatus: jest.fn().mockResolvedValue({ is_completed: false }),
}));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { user_id: 42 } }),
}));

const mockQueryClient = { invalidateQueries: jest.fn() };
const granted = [{ accessType: 'read', recordType: 'Steps' }];
const permissions = getGrantedPermissions as jest.Mock;
const records = readRecords as jest.Mock;
const nativeRequest = jest.fn();
let notify: (state: AppStateStatus) => void;
let renderer: ReactTestRenderer;
let tracker: ReturnType<typeof useStepTrackerContext>;

function Probe() {
  tracker = useStepTrackerContext();
  return null;
}

beforeEach(() => {
  permissions.mockReset().mockResolvedValue([]);
  records.mockResolvedValue({ records: [] });
  nativeRequest.mockReset();
  NativeModules.AndroidStepsPermission = { request: nativeRequest };
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    notify = callback;
    return { remove: jest.fn() };
  });
});

afterEach(async () => {
  await act(async () => renderer.unmount());
  delete NativeModules.AndroidStepsPermission;
  jest.restoreAllMocks();
});

async function mount() {
  await act(async () => {
    renderer = create(<StepTrackerProvider><Probe /></StepTrackerProvider>);
  });
}

test('native callback is verified and duplicate resumes cannot advance while the request is pending', async () => {
  await mount();
  let complete = () => {};
  nativeRequest.mockImplementation(() => new Promise<void>(resolve => { complete = resolve; }));
  let request: Promise<boolean>;
  await act(async () => { request = tracker.requestStepsPermission(); });
  expect(nativeRequest).toHaveBeenCalledTimes(1);
  const beforeReturn = permissions.mock.calls.length;
  await act(async () => { notify('background'); notify('active'); notify('active'); });
  expect(permissions).toHaveBeenCalledTimes(beforeReturn);
  await act(async () => {
    permissions.mockResolvedValue(granted);
    complete();
    await expect(request).resolves.toBe(true);
  });
  expect(permissions).toHaveBeenCalledTimes(beforeReturn + 1);
  expect(tracker.grantedPermissions).toEqual(granted);
  expect(tracker.steps).toBe(0);
});

test('a resolved native request with no Steps grant leaves the device unconnected', async () => {
  await mount();
  nativeRequest.mockResolvedValue(undefined);
  await act(async () => { await expect(tracker.requestStepsPermission()).resolves.toBe(false); });
  expect(tracker.grantedPermissions).toEqual([]);
  expect(tracker.stepDataState).toBe('no_permission');
});

test('returning from external settings checks the live grant once without launching a dialog', async () => {
  await mount();
  const beforeReturn = permissions.mock.calls.length;
  permissions.mockResolvedValue(granted);
  await act(async () => { notify('background'); notify('active'); notify('active'); });
  expect(permissions).toHaveBeenCalledTimes(beforeReturn + 1);
  expect(nativeRequest).not.toHaveBeenCalled();
  expect(tracker.grantedPermissions).toEqual(granted);
});
