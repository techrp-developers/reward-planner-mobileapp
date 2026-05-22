import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { fitnessQueryKeys } from '../../api/fitnessQueryKeys';

import {
  initialize,
  readRecords,
  requestPermission,
  getGrantedPermissions,
  getSdkStatus,
  openHealthConnectDataManagement,
} from 'react-native-health-connect';

import type { Permission } from 'react-native-health-connect';
import { syncStepsToServer } from '../../api/Stepsapi';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_STEP_DIFF = 20;
const MIN_TIME_DIFF = 30_000; // 30 s

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStepTracker = () => {
  const queryClient     = useQueryClient();
  const initialized     = useRef(false);
  const lastSyncedSteps = useRef(-1);  // -1 means "never synced"
  const lastSyncTime    = useRef(0);

  const [healthConnectStatus, setHealthConnectStatus] = useState<string | null>(null);
  const [grantedPermissions,  setGrantedPermissions]  = useState<any[]>([]);
  const [totalSteps,          setTotalSteps]          = useState(0);
  const [healthConnectError,  setHealthConnectError]  = useState<string | null>(null);
  const [isSetupComplete,     setIsSetupComplete]     = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hasStepsPermission = (permissions: any[]) =>
    permissions.some(
      p => p.recordType === 'Steps' && p.accessType === 'read',
    );

  /**
   * FIX: Never sync 0 steps — when records are empty the old code would sync 0,
   * set lastSyncedSteps=0, then every subsequent shouldSync(0) returned false
   * because 0 <= 0. Now 0 is gated out immediately.
   * First sync (lastSyncedSteps === -1) fires as soon as steps > 0.
   */
  const shouldSync = (steps: number): boolean => {
    if (steps <= 0) {
      console.log('[Steps] shouldSync(0) → false (no data to sync)');
      return false;
    }
    const now = Date.now();
    // First ever sync — fire immediately
    if (lastSyncedSteps.current === -1) {
      console.log(`[Steps] shouldSync(${steps}) → true (first sync)`);
      return true;
    }
    if (steps <= lastSyncedSteps.current) {
      console.log(`[Steps] shouldSync(${steps}) → false (no increase from ${lastSyncedSteps.current})`);
      return false;
    }
    if (steps - lastSyncedSteps.current >= MIN_STEP_DIFF) {
      console.log(`[Steps] shouldSync(${steps}) → true (diff ≥ ${MIN_STEP_DIFF})`);
      return true;
    }
    if (now - lastSyncTime.current >= MIN_TIME_DIFF) {
      console.log(`[Steps] shouldSync(${steps}) → true (time threshold met)`);
      return true;
    }
    console.log(`[Steps] shouldSync(${steps}) → false`);
    return false;
  };

  const checkSetupCompletion = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem('fitness_setup_completed');
      console.log('[Steps] AsyncStorage fitness_setup_completed =', value);
      setIsSetupComplete(value === 'true');
    } catch (e) {
      console.warn('[Steps] Failed to read setup state', e);
    }
  }, []);

  // ── 1️⃣ Leaf — no deps on other callbacks ─────────────────────────────────

  const syncSteps = useCallback(async (steps: number) => {
    try {
      const now  = new Date();
      const date = now.toISOString().split('T')[0];

      const payload = {
        steps,
        distance_km:    Number((steps * 0.0008).toFixed(2)),
        calories:       Math.round(steps * 0.04),
        active_minutes: Math.max(1, Math.floor(steps / 1000)),
        date,
      };

      console.log('[Steps] POST /v1/steps/sync payload:', payload);

      const res = await syncStepsToServer(payload);

      if (!res.success) {
        throw new Error(res.message || 'Sync failed');
      }

      console.log('[Steps] Sync success:', res.message);
      lastSyncedSteps.current = steps;
      lastSyncTime.current    = Date.now();

      queryClient.invalidateQueries({ queryKey: fitnessQueryKeys.all });
    } catch (e) {
      console.warn('[Steps] Step sync failed:', e);
    }
  }, [queryClient]);

  // ── 2️⃣ Depends on syncSteps ───────────────────────────────────────────────

  /**
   * FIX: Return the step count so requestStepsPermission can decide whether
   * to complete setup. Previously void — callers had no way to know if steps > 0.
   *
   * FIX: Removed the `if (steps < 0) return` guard (redundant; shouldSync
   * already blocks non-positive values). Changed source fallback to always
   * aggregate ALL remaining records when no known fitness app is found,
   * preventing valid device-sensor records from being silently dropped.
   *
   * FIX: Added comprehensive logging — raw records, dataOrigin per record,
   * final step count, and sync trigger reason.
   */
  const getStepsFromHealth = useCallback(async (): Promise<number> => {
    try {
      const now   = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      console.log('[Steps] Reading Health Connect records for', start.toISOString(), '→', now.toISOString());

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator:  'between',
          startTime: start.toISOString(),
          endTime:   now.toISOString(),
        },
      });

      const records = result.records;
      console.log(`[Steps] Raw record count: ${records.length}`);
      records.forEach((r, i) =>
        console.log(`  [${i}] count=${r.count ?? 'n/a'} origin="${r.metadata?.dataOrigin ?? 'unknown'}"`),
      );

      // Source-priority deduplication:
      //   Google Fit / google.android.healthconnect → first preference
      //   Samsung Health (com.sec.android.app.shealth / com.samsung.health) → second
      //   Everything else (device sensors, unknown) → final fallback
      // Using if/else intentionally: avoids double-counting the same steps
      // when multiple apps write the same physical activity to Health Connect.

      const originOf = (r: any) =>
        (r.metadata?.dataOrigin ?? '').toLowerCase();

      const googleFitRecords = records.filter(
        r =>
          originOf(r).includes('fit') ||
          originOf(r).includes('google'),
      );

      const samsungRecords = records.filter(
        r =>
          originOf(r).includes('samsung') ||
          originOf(r).includes('shealth'),
      );

      let steps = 0;
      let source = 'none';

      if (googleFitRecords.length > 0) {
        steps  = googleFitRecords.reduce((sum, r) => sum + (r.count ?? 0), 0);
        source = 'Google Fit';
      } else if (samsungRecords.length > 0) {
        steps  = samsungRecords.reduce((sum, r) => sum + (r.count ?? 0), 0);
        source = 'Samsung Health';
      } else if (records.length > 0) {
        // Device sensors or other origins — safe to aggregate since google/samsung
        // are already absent from this branch.
        steps  = records.reduce((sum, r) => sum + (r.count ?? 0), 0);
        source = 'device/other';
      }

      console.log(`[Steps] Final steps today: ${steps} (source: ${source})`);

      if (steps <= 0) {
        console.log('[Steps] No valid step records found');
        Alert.alert(
          'No Steps Found',
          'Health Connect has no step data yet.\n\n' +
          'Please open Google Fit or Samsung Health, enable the Health Connect sync, ' +
          'walk a few steps, then return to this screen.',
          [{ text: 'OK' }],
        );
        setTotalSteps(0);
        return 0;
      }

      setTotalSteps(steps);

      if (shouldSync(steps)) {
        await syncSteps(steps);
      }

      return steps;
    } catch (err: any) {
      console.warn('[Steps] Health Connect read error:', err?.message || err);
      setHealthConnectError(err?.message || String(err));
      return 0;
    }
  }, [syncSteps]);

  // ── 3️⃣ Depends on getStepsFromHealth ─────────────────────────────────────

  /**
   * FIX: Removed `setIsSetupComplete(true)` from the "permissions granted"
   * branch. Setting it here caused StepsTrackerScreen to navigate → Dashboard
   * before the user completed the full onboarding flow (and before we had any
   * step data). Now only AsyncStorage (restored by checkSetupCompletion) and
   * a successful requestStepsPermission call control this flag.
   */
  const checkHealthConnectStatus = useCallback(async () => {
    try {
      if (!initialized.current) {
        console.log('[Steps] Initializing Health Connect SDK');
        await initialize();
        initialized.current = true;
      }

      const sdkStatus = await getSdkStatus(
        'com.google.android.healthconnect.controller',
      );

      console.log('[Steps] SDK status:', sdkStatus);
      setHealthConnectStatus(String(sdkStatus));

      if (sdkStatus === 0) {
        setHealthConnectError('Health Connect not installed');
        return [];
      }

      if (sdkStatus === 1) {
        setHealthConnectError('Health Connect needs setup');
        return [];
      }

      const granted = await getGrantedPermissions();
      console.log('[Steps] Granted permissions:', JSON.stringify(granted));
      setGrantedPermissions(granted);

      if (!hasStepsPermission(granted)) {
        await AsyncStorage.removeItem('fitness_setup_completed');
        setIsSetupComplete(false);
        setHealthConnectError('Steps permission not granted');
      } else {
        // Permissions OK — do NOT set isSetupComplete here.
        // That flag is owned by AsyncStorage (restored via checkSetupCompletion)
        // and explicitly set in requestStepsPermission only after steps > 0.
        setHealthConnectError(null);
      }

      return granted;
    } catch (err: any) {
      if (
        err?.message?.includes('Service not available') ||
        err?.message?.includes('IllegalStateException')
      ) {
        initialized.current = false;
        setHealthConnectStatus('0');
        setHealthConnectError('Health Connect not installed');
        return [];
      }

      console.warn('[Steps] Health Connect status error:', err?.message || err);
      setHealthConnectError(err?.message || String(err));
      return [];
    }
  }, []);

  // ── 4️⃣ Depends on both — used externally ─────────────────────────────────

  const refreshStatus = useCallback(async () => {
    console.log('[Steps] refreshStatus triggered (app lifecycle / manual)');
    const perms = await checkHealthConnectStatus();
    if (hasStepsPermission(perms)) {
      await getStepsFromHealth();
    }
  }, [checkHealthConnectStatus, getStepsFromHealth]);

  /**
   * FIX: Only mark setup as complete when Health Connect returns steps > 0.
   * Previously setup completed unconditionally after requestPermission, which
   * caused the dashboard to show 0 steps while the user had never walked yet.
   */
  const requestStepsPermission = useCallback(async () => {
    try {
      const permissions: Permission[] = [
        { accessType: 'read', recordType: 'Steps' },
      ];

      await requestPermission(permissions);
      await new Promise<void>(res => setTimeout(res, 1000));

      const granted = await getGrantedPermissions();
      setGrantedPermissions(granted);

      if (!hasStepsPermission(granted)) {
        await AsyncStorage.removeItem('fitness_setup_completed');
        setIsSetupComplete(false);
        setHealthConnectError(
          'Enable Steps permission in Health Connect → App permissions',
        );
        return false;
      }

      console.log('[Steps] Permission granted — reading initial step data');
      const steps = await getStepsFromHealth();

      if (steps > 0) {
        await AsyncStorage.setItem('fitness_setup_completed', 'true');
        setIsSetupComplete(true);
        setHealthConnectError(null);
        console.log('[Steps] Setup complete ✓ steps =', steps);
        return true;
      }

      // Permission granted but no data yet — do NOT mark setup complete.
      // StepsTrackerScreen will show the "No Steps Found" alert from getStepsFromHealth.
      console.log('[Steps] Permission granted but steps = 0 — setup NOT marked complete');
      setHealthConnectError(
        'No step data yet. Open Google Fit or Samsung Health, enable Health Connect sync, walk a few steps, then tap Continue.',
      );
      return false;
    } catch (err: any) {
      console.warn('[Steps] Permission request error:', err?.message || err);
      setHealthConnectError(err?.message || String(err));
      return false;
    }
  }, [getStepsFromHealth]);

  const openHealthConnect = useCallback(async () => {
    try {
      let status = 0;
      try {
        status = await getSdkStatus(
          'com.google.android.healthconnect.controller',
        );
      } catch {
        status = 0;
      }

      if (status === 0) {
        try {
          await Linking.openURL(
            'market://details?id=com.google.android.apps.healthdata',
          );
        } catch {
          await Linking.openURL(
            'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
          );
        }
        return;
      }

      openHealthConnectDataManagement();
    } catch {
      try {
        await Linking.openURL(
          'market://details?id=com.google.android.apps.healthdata',
        );
      } catch {
        await Linking.openURL(
          'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
        );
      }
    }
  }, []);

  // ── 5️⃣ Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    checkSetupCompletion();

    const init = async () => {
      console.log('[Steps] App mount — initializing Health Connect');
      const perms = await checkHealthConnectStatus();
      if (hasStepsPermission(perms)) {
        await getStepsFromHealth();
      }
    };

    init();

    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        console.log('[Steps] App foregrounded — refreshing step data');
        const perms = await checkHealthConnectStatus();
        if (hasStepsPermission(perms)) {
          await getStepsFromHealth();
        }
      }
    });

    return () => sub.remove();
  }, [checkSetupCompletion, checkHealthConnectStatus, getStepsFromHealth]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    healthConnectStatus,
    grantedPermissions,
    totalSteps,
    healthConnectError,
    isSetupComplete,
    requestStepsPermission,
    refreshStatus,
    openHealthConnect,
  };
};
