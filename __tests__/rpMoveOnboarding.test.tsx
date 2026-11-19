import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { SdkAvailabilityStatus } from 'react-native-health-connect';
import StepsTrackerScreen from '../src/modules/step_counter/component/StepCode/StepsTrackerScreen';
import { useOnboardingFlow } from '../src/modules/step_counter/component/StepCode/onboarding/useOnboardingFlow';
import { screenInsets, tileGrid } from '../src/modules/step_counter/utils/layout';
import { entryRouteFor, resumeRouteFor, routeForStage, stageOf, useContinueSetup } from '../src/modules/step_counter/utils/fitnessSetup';
import { readPendingFitnessSetup } from '../src/modules/step_counter/utils/pendingFitnessSetup';
import type { ProfilePlanResponse } from '../src/modules/step_counter/api/ProfileAPI';
import i18n from '../src/i18n';
import { translateSourceText } from '../src/i18n/sourceText';

jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  Object.defineProperty(native.Platform, 'OS', { configurable: true, value: 'android' });
  return native;
});
jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: { SDK_UNAVAILABLE: 1, SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2, SDK_AVAILABLE: 3 },
}));
jest.mock('../src/modules/step_counter/component/StepCode/useStepTracker', () => ({
  useStepTracker: () => mockTracker,
}));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { user_id: 42 } }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { resumePermission: true } }),
  useIsFocused: () => true,
  useFocusEffect: () => {},
}));
jest.mock('../src/modules/step_counter/component/StepCode/onboarding/components', () => ({
  StepOnboardingScreen: () => null,
  GradientPrimaryButton: () => null,
  InstructionInfoCard: () => null,
  OnboardingIllustration: () => null,
  OnboardingSuccess: () => null,
}));
jest.mock('../src/modules/step_counter/component/StepCode/onboarding/mocks', () => ({
  AndroidPermissionMock: () => null,
}));
jest.mock('../src/modules/step_counter/component/StepCode/onboarding/assets', () => ({
  ONBOARDING_ASSETS: {},
  warnMissingOnboardingAssets: () => {},
}));
jest.mock('../src/modules/step_counter/utils/useStepTheme', () => ({
  useStepStyles: () => ({ palette: {}, styles: {} }),
}));
jest.mock('../src/modules/step_counter/api/useProfilePlan', () => ({
  hasMeasurements: (plan: ProfilePlanResponse) => Number(plan?.bmi) > 0,
  useProfilePlanCache: () => ({ fetchFresh: mockFetchFresh }),
  useProfilePlanQuery: () => ({ isSuccess: true, isFetching: false }),
}));
jest.mock('../src/modules/step_counter/context/StepTrackerContext', () => ({
  hasStepsPerm: (permissions: { accessType: string; recordType: string }[]) =>
    permissions.some(permission => permission.accessType === 'read' && permission.recordType === 'Steps'),
}));

const mockTracker = {
  healthConnectStatus: '3',
  grantedPermissions: [] as { accessType: string; recordType: string }[],
  isSetupComplete: false,
  loading: false,
  requestStepsPermission: jest.fn(),
  openHealthConnect: jest.fn(),
  refreshStatus: jest.fn(),
};
const mockNavigation = { isFocused: () => true, navigate: jest.fn(), reset: jest.fn(), setOptions: jest.fn() };
const mockFetchFresh = jest.fn();
let renderer: ReactTestRenderer;
let flow: ReturnType<typeof useOnboardingFlow>;
let continueSetup: ReturnType<typeof useContinueSetup>['continueSetup'];

function Probe({ resumed = false }: { resumed?: boolean } = {}) {
  flow = useOnboardingFlow(resumed);
  ({ continueSetup } = useContinueSetup());
  return null;
}

beforeEach(() => {
  mockTracker.healthConnectStatus = String(SdkAvailabilityStatus.SDK_AVAILABLE);
  mockTracker.grantedPermissions = [];
  mockTracker.requestStepsPermission.mockReset();
  mockTracker.openHealthConnect.mockReset();
  mockNavigation.navigate.mockClear();
  mockNavigation.reset.mockClear();
  mockFetchFresh.mockReset();
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
});

async function mount(resumed = false) {
  await act(async () => { renderer = create(<Probe resumed={resumed} />); });
}

test('usable Android provider skips installation and opening Health Connect does not grant access', async () => {
  await mount();
  expect(Platform.OS).toBe('android');
  expect(flow.selected).toBe('android');
  await act(async () => flow.continueFromSelect());
  expect(flow.step).toBe('open');
  await act(async () => flow.launchHealthConnect());
  expect(await readPendingFitnessSetup(42)).toBe(true);
  expect(await readPendingFitnessSetup(43)).toBe(false);
  expect(mockTracker.openHealthConnect).toHaveBeenCalledTimes(1);
  expect(flow.ready).toBe(false);
  await act(async () => flow.go('permission'));
  mockTracker.requestStepsPermission.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  await act(async () => flow.requestAccess());
  expect(flow.step).toBe('permission');
  expect(flow.attempted).toBe(true);
  await act(async () => flow.requestAccess());
  expect(flow.step).toBe('success');
});

test('provider update is separate from an unsupported device', async () => {
  mockTracker.healthConnectStatus = String(SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED);
  await mount();
  await act(async () => flow.continueFromSelect());
  expect(flow.step).toBe('install');
  mockTracker.healthConnectStatus = String(SdkAvailabilityStatus.SDK_AVAILABLE);
  await act(async () => renderer.update(<Probe />));
  expect(flow.step).toBe('open');
  await act(async () => renderer.unmount());
  mockTracker.healthConnectStatus = String(SdkAvailabilityStatus.SDK_UNAVAILABLE);
  await mount();
  await act(async () => flow.continueFromSelect());
  expect(flow.step).toBe('unavailable');
});

test('narrow plan grids wrap and bar layout allocates the device inset once', () => {
  expect(tileGrid(250, 4, 1.3)).toEqual({ cols: 2, tileWidth: 121 });
  const insets = { top: 32, bottom: 24, left: 0, right: 0 };
  expect(screenInsets(insets, true, 98)).toEqual({ ...insets, bottom: 122 });
  expect(screenInsets(insets, false, 98)).toEqual(insets);
});

test('backend data resumes setup at the first incomplete stage and keeps completed profiles during permission recovery', () => {
  const basic = { bmi: null, current_goal: null } as ProfilePlanResponse;
  const measured = { ...basic, bmi: '22.1' };
  const completed = { ...measured, current_goal: { daily_steps: 5000, start_date: '2026-11-18' } };
  expect(entryRouteFor(stageOf(null, false), null)).toEqual({ name: 'StepWelcome' });
  expect(routeForStage(stageOf(null, true))).toEqual({ name: 'StepForm' });
  expect(entryRouteFor(stageOf(basic, true), basic)).toEqual({ name: 'StepForm', params: { startAt: 'body' } });
  expect(entryRouteFor(stageOf(measured, true), measured)).toEqual({ name: 'BMICart' });
  expect(entryRouteFor(stageOf(completed, true), completed)).toEqual({ name: 'Dashboard' });
  expect(entryRouteFor(stageOf(completed, false), completed)).toEqual({ name: 'StepsTrackerScreen' });
  expect(resumeRouteFor(stageOf(null, false))).toEqual({ name: 'StepsTrackerScreen', params: { resumePermission: true } });
});

test('restored permission page stays in RP Move until the provider reports a verified grant', async () => {
  await mount(true);
  expect(flow.step).toBe('permission');
  await act(async () => renderer.update(<Probe resumed />));
  expect(flow.step).toBe('permission');
  mockTracker.grantedPermissions = [{ accessType: 'read', recordType: 'Steps' }];
  await act(async () => renderer.update(<Probe resumed />));
  expect(flow.step).toBe('success');
  mockFetchFresh.mockResolvedValue(null);
  await act(async () => { await Promise.all([continueSetup(), continueSetup()]); });
  expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
  expect(mockNavigation.navigate).toHaveBeenCalledWith('StepForm', undefined);
});

test('the restored Android screen opens StepForm once when a grant appears on return', async () => {
  mockFetchFresh.mockResolvedValue(null);
  await act(async () => { renderer = create(<StepsTrackerScreen />); });
  expect(mockNavigation.navigate).not.toHaveBeenCalled();

  mockTracker.grantedPermissions = [{ accessType: 'read', recordType: 'Steps' }];
  await act(async () => renderer.update(<StepsTrackerScreen />));
  await act(async () => renderer.update(<StepsTrackerScreen />));

  expect(mockFetchFresh).toHaveBeenCalledTimes(1);
  expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
  expect(mockNavigation.navigate).toHaveBeenCalledWith('StepForm', undefined);
});

test('verified access resolves a saved profile to its missing goal', async () => {
  mockTracker.grantedPermissions = [{ accessType: 'read', recordType: 'Steps' }];
  mockFetchFresh.mockResolvedValue({ bmi: '22.1', current_goal: null });
  await mount();
  await act(async () => continueSetup());
  expect(mockNavigation.navigate).toHaveBeenCalledWith('BMICart', undefined);
});

test('known fitness copy resolves in the selected language and unknown data passes through', async () => {
  try {
    await i18n.changeLanguage('mr');
    expect(translateSourceText('stepCounter', 'Underweight')).not.toBe('Underweight');
    expect(translateSourceText('stepCounter', 'Server value with no matching label')).toBe('Server value with no matching label');
  } finally {
    await i18n.changeLanguage('en');
  }
});
