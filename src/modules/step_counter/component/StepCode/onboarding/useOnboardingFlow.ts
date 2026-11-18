import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { SdkAvailabilityStatus } from 'react-native-health-connect';

import { useStepTracker } from '../useStepTracker';
import { hasStepsPerm } from '../../../context/StepTrackerContext';
import { useAuth } from '../../../../common/auth/context/AuthContext';
import { logFitnessAndroid, savePendingFitnessSetup } from '../../../utils/pendingFitnessSetup';
import i18n from '../../../../../i18n';

export type DevicePlatform = 'android' | 'ios';

export type OnboardingStep =
  | 'select'
  // Android
  | 'install'
  | 'unavailable'
  | 'open'
  | 'permission'
  // iOS
  | 'apple'
  | 'settings'
  | 'find'
  | 'allow'
  | 'success';

export const CURRENT_PLATFORM: DevicePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

const HC_STORE_PACKAGE = 'com.google.android.apps.healthdata';

/**
 * Onboarding state machine on top of StepTrackerContext. All native work
 * (SDK status, permission requests, resume re-checks, setup flag) stays in the
 * context; this hook only decides which step to show. Success is reached
 * exclusively through requestStepsPermission() resolving true.
 */
export function useOnboardingFlow(resumePermission = false) {
  const tracker = useStepTracker();
  const { user } = useAuth();
  const userId = user?.user_id;
  const {
    healthConnectStatus, grantedPermissions, isSetupComplete, loading,
    requestStepsPermission, openHealthConnect, refreshStatus,
  } = tracker;
  const isIOS = CURRENT_PLATFORM === 'ios';

  const [history, setHistory] = useState<OnboardingStep[]>(() => {
    if (isIOS || !resumePermission) return ['select'];
    switch (Number(healthConnectStatus)) {
      case SdkAvailabilityStatus.SDK_AVAILABLE: return ['permission'];
      case SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: return ['install'];
      default: return ['unavailable'];
    }
  });
  const [selected, setSelected] = useState<DevicePlatform>(CURRENT_PLATFORM);
  const [busy, setBusy] = useState(false);
  // A native request on the current step finished without success; the
  // screen derives the exact reason from live tracker state.
  const [attempted, setAttempted] = useState(false);
  const [installShown, setInstallShown] = useState(history.includes('install'));
  const [recoveryShown, setRecoveryShown] = useState(false);
  const [openedHc, setOpenedHc] = useState(false);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const step = history[history.length - 1];
  const sdkStatus = Number(healthConnectStatus);
  const sdkAvailable = sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE;
  const hcNeedsUpdate = sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  // The context leaves the status null if SDK initialization throws; `loading`
  // turning false is the signal that the first check finished either way.
  const statusResolved = healthConnectStatus !== null || !loading;
  const stepsGranted = hasStepsPerm(grantedPermissions);
  const ready = sdkAvailable && stepsGranted;

  const go = useCallback((next: OnboardingStep) => {
    setAttempted(false);
    setHistory(h => (h[h.length - 1] === next ? h : [...h, next]));
  }, []);

  /** Returns false when already on the first step (caller leaves the screen). */
  const back = useCallback((): boolean => {
    if (busyRef.current) return true;
    // Setup is already saved on success; back leaves instead of re-entering
    // the permission steps.
    if (history.length <= 1 || history[history.length - 1] === 'success') return false;
    setAttempted(false);
    setHistory(h => h.slice(0, -1));
    return true;
  }, [history]);

  const run = useCallback(async (task: () => Promise<void>, savePending = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (!isIOS && savePending) {
        if (userId === undefined) throw new Error('Account unavailable');
        await savePendingFitnessSetup(userId);
      }
      if (mounted.current) await task();
    } catch {
      logFitnessAndroid('HEALTH_ACTION_FAILED');
      if (mounted.current) {
        setAttempted(true);
        if (savePending) Alert.alert(i18n.t('stepCounter:onboarding.genericError'));
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [isIOS, userId]);

  // ── Step actions ─────────────────────────────────────────────────────────

  const continueFromSelect = useCallback(() => {
    if (selected !== CURRENT_PLATFORM || !statusResolved) return;
    if (isIOS) {
      go('apple');
    } else if (hcNeedsUpdate) {
      setInstallShown(true);
      go('install');
    } else {
      go(sdkAvailable ? 'open' : 'unavailable');
    }
  }, [selected, statusResolved, isIOS, sdkAvailable, hcNeedsUpdate, go]);

  const openPlayStore = useCallback(() => run(async () => {
    try {
      await Linking.openURL(`market://details?id=${HC_STORE_PACKAGE}`);
    } catch {
      await Linking.openURL(`https://play.google.com/store/apps/details?id=${HC_STORE_PACKAGE}`).catch(() => {});
    }
  }, true), [run]);

  // "Already installed?" — re-check; the effect below advances if available.
  const recheckInstall = useCallback(() => run(async () => {
    await refreshStatus();
    setAttempted(true);
  }), [run, refreshStatus]);

  // Advance automatically when Health Connect becomes available while the
  // install step is showing (user returns from Play Store; the context
  // re-checks on AppState 'active'). Only on the transition, so pressing back
  // from 'open' doesn't bounce forward again.
  const prevAvailable = useRef(sdkAvailable);
  useEffect(() => {
    if ((step === 'install' || step === 'unavailable') && sdkAvailable && !prevAvailable.current) go('open');
    prevAvailable.current = sdkAvailable;
  }, [step, sdkAvailable, go]);

  useEffect(() => {
    if (step === 'unavailable' && hcNeedsUpdate) {
      setInstallShown(true);
      go('install');
    }
  }, [step, hcNeedsUpdate, go]);

  const launchHealthConnect = useCallback(() => run(async () => {
    await openHealthConnect();
    if (mounted.current) setOpenedHc(true);
  }, true), [run, openHealthConnect]);

  const requestAccess = useCallback(() => run(async () => {
    const ok = await requestStepsPermission();
    if (!mounted.current) return;
    if (ok) go('success');
    else setAttempted(true);
  }, true), [run, requestStepsPermission, go]);

  // Settings does not return a permission-request callback. Only the
  // provider's confirmed grant can advance this path.
  useEffect(() => {
    if (!isIOS && !busy && ready && (step === 'open' || step === 'permission')) go('success');
  }, [busy, go, isIOS, ready, step]);

  const startRecovery = useCallback(() => {
    setRecoveryShown(true);
    go('settings');
  }, [go]);

  const openAppSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  // ── Progress (reflects skipped install / optional recovery steps) ────────

  const plan = useMemo<OnboardingStep[]>(() => {
    if (isIOS) {
      return ['select', 'apple', ...(recoveryShown ? ['settings', 'find', 'allow'] as const : []), 'success'];
    }
    if (step === 'unavailable') return ['select', 'unavailable'];
    return ['select', ...(installShown || hcNeedsUpdate ? ['install'] as const : []), 'open', 'permission', 'success'];
  }, [isIOS, recoveryShown, installShown, hcNeedsUpdate, step]);

  const progress = useMemo(() => {
    const index = plan.indexOf(step);
    return index < 0 ? null : { index, total: plan.length };
  }, [plan, step]);

  return {
    tracker,
    step,
    progress,
    selected,
    setSelected,
    busy,
    attempted,
    openedHc,
    statusResolved,
    sdkAvailable,
    hcNeedsUpdate,
    stepsGranted,
    ready,
    isSetupComplete,
    go,
    back,
    continueFromSelect,
    openPlayStore,
    recheckInstall,
    launchHealthConnect,
    requestAccess,
    startRecovery,
    openAppSettings,
  };
}
