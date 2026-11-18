import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectDataManagement,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect';

import { syncStepsToServer, type GoalSyncData } from '../api/Stepsapi';
import { fetchProfileStepStatus } from '../api/ProfileAPI';
import { fitnessQueryKeys } from '../api/fitnessQueryKeys';
import { useAuth } from '../../common/auth/context/AuthContext';
import { stepSyncStorageKey } from '../utils/stepData';
import i18n from "../../../i18n";
import { logFitnessAndroid } from '../utils/pendingFitnessSetup';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepDataState =
  | 'loading'
  | 'no_permission'
  | 'no_source'
  | 'no_steps_today'
  | 'ok';

export type StepTrackerContextValue = {
  // Clean API (per requirements)
  steps: number;
  loading: boolean;
  syncSteps: () => Promise<void>;
  refreshSteps: () => Promise<void>;
  // Extended API used by onboarding screens
  stepDataState: StepDataState;
  healthConnectStatus: string | null;
  grantedPermissions: any[];
  healthConnectError: string | null;
  isSetupComplete: boolean;
  celebrationData: GoalSyncData | null;
  requestStepsPermission: () => Promise<boolean>;
  openHealthConnect: () => Promise<void>;
  dismissCelebration: () => void;
  // Backward-compat aliases kept so existing consumers don't need changes
  totalSteps: number;
  refreshStatus: () => Promise<void>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_STEP_DIFF   = 100;
const COOLDOWN_MS     = 15 * 60 * 1000; // 15 minutes

// Health permission is device- and platform-specific. Never let an Android
// Health Connect completion (or backend account flag) bypass Apple Health
// onboarding on a new iPhone.
const STORAGE_SETUP = Platform.select({
  ios: 'fitness_setup_completed_ios_healthkit',
  default: 'fitness_setup_completed',
}) as string;

const HC_PACKAGE = 'com.google.android.apps.healthdata';
const IOS_STEPS_PERMISSION = { accessType: 'read', recordType: 'Steps' };
const HealthKitManager = NativeModules.HealthKitManager as {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  hasHandledAuthorization(): Promise<boolean>;
  getStepCount(startDate: number, endDate: number): Promise<number>;
  openHealthApp(): Promise<boolean>;
} | undefined;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasStepsPerm(permissions: any[]): boolean {
  return permissions.some(p => {
    // Some library versions return raw Android permission strings
    if (typeof p === 'string') {
      const s = p.toLowerCase();
      return s.includes('read_steps') || (s.includes('steps') && s.includes('read'));
    }
    // Handle nested shape, and any casing of both fields
    const rt = String(p.recordType ?? p.permission?.recordType ?? '').toLowerCase();
    const at = String(p.accessType ?? p.permission?.accessType ?? '').toLowerCase();
    return rt === 'steps' && at === 'read';
  });
}

// toISOString() returns the UTC date, which can be a day off from the
// device's local "today" depending on timezone — format using local
// getters instead so the synced date matches what the user actually sees.
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPayload(steps: number) {
  return {
    steps,
    distance_km:    Number((steps * 0.0008).toFixed(2)),
    calories:       Math.round(steps * 0.04),
    active_minutes: Math.max(1, Math.floor(steps / 1000)),
    date:           localDateString(new Date()),
  };
}

function sumStepRecords(records: any[]): number {
  // Group by data origin and take the highest single-origin total.
  // This avoids double-counting when two apps (e.g. Google Fit + Samsung Health)
  // both sync the same physical steps to Health Connect, while still using
  // whichever source recorded the most steps.
  const byOrigin = new Map<string, number>();
  for (const record of records) {
    const origin = String(record.metadata?.dataOrigin ?? 'unknown');
    byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + (Number(record.count) || 0));
  }
  if (byOrigin.size === 0) return 0;
  return Math.max(...byOrigin.values());
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StepTrackerContext = createContext<StepTrackerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StepTrackerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const accountId = user?.user_id ?? null;
  return <StepTrackerSession key={accountId ?? "pending"} accountId={accountId}>{children}</StepTrackerSession>;
}

function StepTrackerSession({ children, accountId }: { children: ReactNode; accountId: number | null }) {
  const storageLastSync = stepSyncStorageKey(accountId ?? "pending");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const queryClient = useQueryClient();

  // ── Refs: never cause re-renders, always current ──────────────────────────
  const initialized       = useRef(false);
  const androidPermissionRequest = useRef(false);
  const androidVerification = useRef<Promise<any[]> | null>(null);
  const previousAppState = useRef(AppState.currentState);
  const isSyncing         = useRef(false);  // sync lock — prevents concurrent API calls
  const lastSyncedSteps   = useRef(-1);     // -1 = never synced this session
  const lastSyncedDate    = useRef<string | null>(null);
  const lastSyncTime      = useRef(0);
  const stepsRef          = useRef(0);      // mirror of steps state for closures

  // ── State ─────────────────────────────────────────────────────────────────
  const [steps,               setSteps]               = useState(0);
  const [loading,             setLoading]             = useState(true);
  const [stepDataState,       setStepDataState]       = useState<StepDataState>('loading');
  const [healthConnectStatus, setHealthConnectStatus] = useState<string | null>(null);
  const [grantedPermissions,  setGrantedPermissions]  = useState<any[]>([]);
  const [healthConnectError,  setHealthConnectError]  = useState<string | null>(null);
  const [isSetupComplete,     setIsSetupComplete]     = useState(false);
  const [celebrationData,     setCelebrationData]     = useState<GoalSyncData | null>(null);

  // Keep stepsRef in sync with state so AppState handler never reads stale value
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  // ── Restore persisted state on mount ─────────────────────────────────────
  useEffect(() => {
    AsyncStorage.multiGet([storageLastSync, STORAGE_SETUP]).then(async pairs => {
      if (!active.current) return;
      const [lastSyncPair, setupPair] = pairs;
      const today = localDateString(new Date());
      const rawLastSync = lastSyncPair[1];

      if (rawLastSync) {
        try {
          const parsed = JSON.parse(rawLastSync);
          const n = Number(parsed?.steps);
          const date = typeof parsed?.date === 'string' ? parsed.date : null;
          if (date === today && Number.isFinite(n) && n > 0) {
            lastSyncedDate.current = date;
            lastSyncedSteps.current = n;
          }
        } catch {
          lastSyncedDate.current = null;
          lastSyncedSteps.current = -1;
        }
      }

      if (setupPair[1] === 'true') {
        setIsSetupComplete(true);
      } else if (Platform.OS !== 'ios') {
        // AsyncStorage is wiped on reinstall — check the backend so users who
        // already completed setup on a previous install skip onboarding entirely.
        try {
          const status = await fetchProfileStepStatus();
          if (status.is_completed) {
            await AsyncStorage.setItem(STORAGE_SETUP, 'true');
            setIsSetupComplete(true);
          }
        } catch {
          // Network unavailable or auth not ready — leave isSetupComplete false
          // so the user goes through onboarding (will re-sync local flag then).
        }
      }
    }).catch(() => {});
  }, [storageLastSync]);

  // ── Sync gate — only reads refs, safe to call anywhere ───────────────────
  const shouldSync = (count: number): boolean => {
    const today = localDateString(new Date());
    if (count <= 0) return false;
    if (isSyncing.current) return false;

    if (Platform.OS === 'ios') {
      // The dashboard can read steps immediately from HealthKit, but the
      // server also needs the first few steps for summaries and rewards.
      if (lastSyncedDate.current !== today || lastSyncedSteps.current < 0) return true;
      if (count <= lastSyncedSteps.current) return false;
      return Date.now() - lastSyncTime.current >= 60_000;
    }

    if (lastSyncedDate.current !== today) {
      // New day — skip cooldown (fresh start) but still require MIN_STEP_DIFF
      // so a midnight wakeup with 2 steps doesn't fire an API call.
      return count >= MIN_STEP_DIFF;
    }
    if (lastSyncedSteps.current === -1) {
      // First sync ever in this session — same threshold applies.
      return count >= MIN_STEP_DIFF;
    }
    if (count <= lastSyncedSteps.current) return false;                // no increase
    if (count - lastSyncedSteps.current < MIN_STEP_DIFF) return false; // < 100 new steps
    if (Date.now() - lastSyncTime.current < COOLDOWN_MS) return false; // inside 15-min window
    return true;
  };

  // ── Internal sync (accepts explicit count to avoid stale closure issues) ──
  const doSync = useCallback(async (count: number): Promise<void> => {
    if (accountId == null || !active.current || !shouldSync(count)) return;

    isSyncing.current = true;
    try {
      const payload = buildPayload(count);
      const res = await syncStepsToServer(payload);
      if (!active.current) return;
      if (!res.success) throw new Error(res.message || i18n.t("stepCounter:r2.syncFailed"));

      lastSyncedDate.current  = payload.date;
      lastSyncedSteps.current = count;
      lastSyncTime.current    = Date.now();
      await AsyncStorage.setItem(storageLastSync, JSON.stringify({ date: payload.date, steps: count }));

      // Show the celebration for either a completed daily goal OR a newly
      // unlocked lifetime achievement — these are now independent (the
      // backend checks lifetime achievements regardless of goalAchieved).
      if (res.data?.goalAchieved || (res.data?.unlockedAchievements?.length ?? 0) > 0) {
        setCelebrationData(res.data);
      }

      setHealthConnectError(null);
      queryClient.invalidateQueries({ queryKey: fitnessQueryKeys.all });
    } catch (e: any) {
      logFitnessAndroid('STEP_SYNC_FAILED');
      setHealthConnectError(`Steps sync failed: ${e?.message || 'network error'}`);
    } finally {
      isSyncing.current = false;
    }
  }, [accountId, queryClient, storageLastSync]);

  // ── Read Health Connect + conditionally sync ──────────────────────────────
  const readAndSync = useCallback(async (): Promise<number | null> => {
    if (!active.current) return null;
    setLoading(true);
    setStepDataState('loading');
    try {
      const now   = new Date();
      const start = new Date(); start.setHours(0, 0, 0, 0);

      if (Platform.OS === 'ios') {
        if (!HealthKitManager) throw new Error('Apple Health integration is unavailable');
        const total = Number(await HealthKitManager.getStepCount(start.getTime(), now.getTime())) || 0;
        setSteps(total);
        const nextState: StepDataState = total > 0 ? 'ok' : 'no_steps_today';
        setStepDataState(nextState);
        setHealthConnectError(null);
        if (total > 0) await doSync(total);
        return total;
      }

      const timeRangeFilter = {
        operator:  'between' as const,
        startTime: start.toISOString(),
        endTime:   now.toISOString(),
      };

      let total = 0;
      let records: any[] = [];
      let aggregated = false;

      try {
        const aggregate = await aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter,
        });
        total = Number(aggregate.COUNT_TOTAL) || 0;
        aggregated = true;
      } catch {
        logFitnessAndroid('STEPS_AGGREGATE_FAILED');
      }

      if (total <= 0) {
        try {
          const result = await readRecords('Steps', { timeRangeFilter });
          records = Array.isArray(result?.records) ? result.records :
                    Array.isArray(result) ? result as any[] : [];
          total = sumStepRecords(records);
        } catch (readError: any) {
          if (!aggregated) throw readError;
          logFitnessAndroid('STEPS_RECORD_READ_FAILED');
        }
      }

      if (total <= 0) {
        let hasHistory = false;
        try {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const broad = await readRecords('Steps', {
            timeRangeFilter: { operator: 'between', startTime: past.toISOString(), endTime: now.toISOString() },
            pageSize: 1,
            ascendingOrder: false,
          });
          hasHistory = broad.records.length > 0;
        } catch {}
        const nextState: StepDataState = hasHistory ? 'no_steps_today' : 'no_source';
        setStepDataState(nextState);
        setSteps(0);
        return 0;
      }

      setStepDataState('ok');
      setSteps(total);
      await doSync(total);
      return total;
    } catch (err: any) {
      logFitnessAndroid('STEP_READ_FAILED');
      setHealthConnectError(err?.message || String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [doSync]);

  // ── Initialize HC + verify permissions ───────────────────────────────────
  const initAndCheck = useCallback(async (): Promise<any[]> => {
    try {
      if (Platform.OS === 'ios') {
        const available = Boolean(HealthKitManager && await HealthKitManager.isAvailable());
        setHealthConnectStatus(available ? String(SdkAvailabilityStatus.SDK_AVAILABLE) : '0');
        if (!available) {
          setHealthConnectError('Apple Health is not available on this device');
          setStepDataState('no_permission');
          setLoading(false);
          return [];
        }

        const setupComplete = await AsyncStorage.getItem(STORAGE_SETUP).catch(() => null);
        const authorizationHandled = await HealthKitManager!.hasHandledAuthorization().catch(() => false);
        if (setupComplete === 'true' || authorizationHandled) {
          const granted = [IOS_STEPS_PERMISSION];
          setGrantedPermissions(granted);
          setHealthConnectError(null);
          return granted;
        }
        setGrantedPermissions([]);
        setHealthConnectError('Apple Health Steps permission not granted');
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      // The SDK selects the system implementation on Android 14+. The package
      // argument identifies the standalone provider on earlier Android versions.
      const sdkStatus = await getSdkStatus(HC_PACKAGE);
      if (!active.current) return [];
      logFitnessAndroid(sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE ? 'SDK_STATUS_AVAILABLE' : 'SDK_STATUS_UNAVAILABLE');
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        initialized.current = false;
        setGrantedPermissions([]);
        setHealthConnectStatus(String(sdkStatus));
        setHealthConnectError(i18n.t(sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE
          ? "stepCounter:r2.healthConnectUnsupported"
          : "stepCounter:r2.healthConnectNeedsSetup"));
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      if (!initialized.current) {
        if (!(await initialize(HC_PACKAGE))) {
          throw new Error(i18n.t("stepCounter:onboarding.genericError"));
        }
        initialized.current = true;
      }

      if (!active.current) return [];
      logFitnessAndroid('VERIFY_STEPS_PERMISSION');
      const granted = await getGrantedPermissions();
      if (!active.current) return [];

      setGrantedPermissions(granted);
      setHealthConnectStatus(String(sdkStatus));

      if (!hasStepsPerm(granted)) {
        logFitnessAndroid('STEPS_PERMISSION_MISSING');
        setHealthConnectError('Steps permission not granted');
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      setHealthConnectError(null);
      logFitnessAndroid('STEPS_PERMISSION_GRANTED');
      return granted;
    } catch (err: any) {
      if (!active.current) return [];
      if (Platform.OS === 'android') {
        logFitnessAndroid('PERMISSION_CHECK_FAILED');
        initialized.current = false;
        setHealthConnectStatus(null);
        setGrantedPermissions([]);
        setStepDataState('no_permission');
      }
      setHealthConnectError(err?.message || String(err));
      setLoading(false);
      return [];
    }
  }, []);

  const verifyAccess = useCallback(() => {
    if (Platform.OS !== 'android') return initAndCheck();
    if (androidVerification.current) {
      logFitnessAndroid('DUPLICATE_PERMISSION_CHECK_COALESCED');
      return androidVerification.current;
    }
    const verification = initAndCheck().finally(() => { androidVerification.current = null; });
    androidVerification.current = verification;
    return verification;
  }, [initAndCheck]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const refreshSteps = useCallback(async () => {
    if (!active.current || androidPermissionRequest.current) return;
    const granted = await verifyAccess();
    if (active.current && !androidPermissionRequest.current && hasStepsPerm(granted)) await readAndSync();
  }, [verifyAccess, readAndSync]);

  // Public syncSteps() reads from stepsRef so it's never stale in callbacks
  const syncSteps = useCallback(async () => {
    await doSync(stepsRef.current);
  }, [doSync]);

  const requestStepsPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (androidPermissionRequest.current) {
        logFitnessAndroid('DUPLICATE_PERMISSION_REQUEST_IGNORED');
        return false;
      }
      androidPermissionRequest.current = true;
    }
    try {
      if (Platform.OS === 'ios') {
        if (!HealthKitManager || !(await HealthKitManager.isAvailable())) {
          setHealthConnectError('Apple Health is not available on this device');
          return false;
        }
        const authorized = await HealthKitManager.requestAuthorization();
        if (!authorized) {
          setHealthConnectError('Please allow Steps access in Apple Health');
          return false;
        }
        setGrantedPermissions([IOS_STEPS_PERMISSION]);
        await readAndSync();
        await AsyncStorage.setItem(STORAGE_SETUP, 'true');
        setIsSetupComplete(true);
        setHealthConnectError(null);
        return true;
      }

      logFitnessAndroid('REQUEST_STEPS_PERMISSION');
      let granted = await verifyAccess();
      if (!active.current || !initialized.current) return false;
      if (!hasStepsPerm(granted)) {
        try {
          const bridge = NativeModules.AndroidStepsPermission as { request(): Promise<void> } | undefined;
          if (bridge) await bridge.request();
          else {
            // Metro can still serve this JS to an older installed debug APK.
            const perms: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];
            await requestPermission(perms);
          }
          logFitnessAndroid('PERMISSION_RESULT_RECEIVED');
        } catch {
          logFitnessAndroid('PERMISSION_REQUEST_INTERRUPTED');
        }
        if (!active.current) return false;
        granted = await verifyAccess();
      }
      if (!active.current) return false;

      if (!hasStepsPerm(granted)) {
        logFitnessAndroid('STEPS_PERMISSION_DENIED_OR_CANCELLED');
        return false;
      }

      setIsSetupComplete(true);
      readAndSync();
      return true;
    } catch (err: any) {
      setHealthConnectError(err?.message || String(err));
      return false;
    } finally {
      androidPermissionRequest.current = false;
    }
  }, [verifyAccess, readAndSync]);

  const openHealthConnect = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        if (!HealthKitManager) return;
        const authorized = await HealthKitManager.requestAuthorization();
        if (authorized) {
          setGrantedPermissions([IOS_STEPS_PERMISSION]);
          setHealthConnectError(null);
          await readAndSync();
        } else {
          setHealthConnectError('Apple Health authorization was not completed');
        }
        return;
      }

      if (await getSdkStatus(HC_PACKAGE) === SdkAvailabilityStatus.SDK_AVAILABLE) {
        logFitnessAndroid('OPEN_HEALTH_CONNECT_SETTINGS');
        openHealthConnectDataManagement(HC_PACKAGE);
      }
    } catch (error) {
      logFitnessAndroid('HEALTH_SETTINGS_LAUNCH_FAILED');
      setHealthConnectError(error instanceof Error ? error.message : String(error));
    }
  }, [readAndSync]);

  const dismissCelebration = useCallback(() => setCelebrationData(null), []);

  // ── AppState handler via ref — avoids stale closures without re-subscribing
  // The ref is updated every render so the listener always calls the latest logic.
  const appStateHandlerRef = useRef<(s: AppStateStatus) => void>(() => {});
  appStateHandlerRef.current = async (nextState: AppStateStatus) => {
    if (Platform.OS === 'android') {
      if (previousAppState.current === nextState) return;
      previousAppState.current = nextState;
    }
    if (nextState === 'active') {
      logFitnessAndroid('APP_RESUME');
      console.log('[Steps] App foregrounded — refreshing');
      await refreshSteps();
    } else if (nextState === 'background') {
      logFitnessAndroid('APP_BACKGROUND');
      // Sync once when the user leaves the app
      console.log('[Steps] App backgrounded — syncing current steps');
      await doSync(stepsRef.current);
    }
  };

  // ── Lifecycle: mount once ─────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Steps] Provider mounted — initial load');
    refreshSteps();

    const sub = AppState.addEventListener('change', s => appStateHandlerRef.current(s));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — subscribe/unsubscribe once; handler ref stays current

  // ── Context value ─────────────────────────────────────────────────────────
  const value: StepTrackerContextValue = {
    steps,
    loading,
    syncSteps,
    refreshSteps,
    stepDataState,
    healthConnectStatus,
    grantedPermissions,
    healthConnectError,
    isSetupComplete,
    celebrationData,
    requestStepsPermission,
    openHealthConnect,
    dismissCelebration,
    // Backward-compat aliases
    totalSteps: steps,
    refreshStatus: refreshSteps,
  };

  return (
    <StepTrackerContext.Provider value={value}>
      {children}
    </StepTrackerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStepTrackerContext(): StepTrackerContextValue {
  const ctx = useContext(StepTrackerContext);
  if (!ctx) {
    throw new Error('useStepTrackerContext must be called inside <StepTrackerProvider>');
  }
  return ctx;
}
