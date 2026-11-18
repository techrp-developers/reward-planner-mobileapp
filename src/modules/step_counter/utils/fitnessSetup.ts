import { useCallback, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { SdkAvailabilityStatus } from "react-native-health-connect";

import { useStepTracker } from "../component/StepCode/useStepTracker";
import { hasStepsPerm } from "../context/StepTrackerContext";
import { hasMeasurements, useProfilePlanCache, useProfilePlanQuery } from "../api/useProfilePlan";
import { fitnessQueryKeys } from "../api/fitnessQueryKeys";
import type { ProfilePlanResponse } from "../api/ProfileAPI";
import type { FitnessStackParamList } from "../navigation/RewardHomeStack";
import { useAuth } from "../../common/auth/context/AuthContext";
import { clearSelectedGender } from "./userGender";
import i18n from "../../../i18n";
import { logFitnessAndroid, savePendingFitnessSetup } from "./pendingFitnessSetup";

/**
 * RP Move setup is three independent conditions:
 *   health  — this device can read steps (native check, per device/platform)
 *   profile — basic details + measurements saved (backend, any device)
 *   goal    — a daily goal saved; current_goal from GET /v1/profile/plan
 * The first unmet one is the stage the user resumes at.
 */
export type SetupStage = "health" | "profile" | "body" | "goal" | "ready";

type Route = { [K in keyof FitnessStackParamList]: { name: K; params?: FitnessStackParamList[K] } }[keyof FitnessStackParamList];

export const stageOf = (plan: ProfilePlanResponse | null, healthReady: boolean): SetupStage => {
  if (!healthReady) return "health";
  if (!plan) return "profile";
  if (!hasMeasurements(plan)) return "body";
  if (!plan.current_goal) return "goal";
  return "ready";
};

export const routeForStage = (stage: SetupStage): Route => {
  switch (stage) {
    case "health":  return { name: "StepsTrackerScreen" };
    case "profile": return { name: "StepForm" };
    case "body":    return { name: "StepForm", params: { startAt: "body" } };
    case "goal":    return { name: "BMICart" };
    default:        return { name: "Dashboard" };
  }
};

/**
 * Android uses the live Steps grant. Apple Health also requires the saved
 * device setup flag.
 */
export function useHealthReadiness() {
  const { healthConnectStatus, grantedPermissions, isSetupComplete, loading } = useStepTracker();
  const resolved = healthConnectStatus !== null || !loading;
  const ready = (Platform.OS === 'android' || isSetupComplete)
    && Number(healthConnectStatus) === SdkAvailabilityStatus.SDK_AVAILABLE
    && hasStepsPerm(grantedPermissions);
  return { resolved, ready, flag: isSetupComplete };
}

export function useFitnessSetup(restoring = false) {
  const health = useHealthReadiness();
  const planQuery = useProfilePlanQuery(restoring);
  const plan = planQuery.data ?? null;
  const resolved = health.resolved && planQuery.isSuccess && (!restoring || !planQuery.isFetching);
  return {
    resolved,
    // Safe to redirect on: not mid-refetch, so the cache is not stale.
    settled: resolved && !planQuery.isFetching,
    stage: stageOf(plan, health.ready),
    healthReady: health.ready,
    plan,
    // Device setup flag only (no live permission read), for in-module guards:
    // the live check can dip briefly while steps refresh.
    healthFlag: health.flag,
    error: planQuery.isError && !planQuery.isSuccess ? (planQuery.error as Error) : null,
    retry: planQuery.refetch,
  };
}

/** Where RP Move opens: brand-new users see the welcome screen first. */
export const entryRouteFor = (stage: SetupStage, plan: ProfilePlanResponse | null): Route =>
  !plan ? { name: "StepWelcome" } : routeForStage(stage);

export const resumeRouteFor = (stage: SetupStage): Route =>
  stage === 'health' ? { name: 'StepsTrackerScreen', params: { resumePermission: true } } : routeForStage(stage);

/**
 * Moves to the first incomplete setup stage, re-reading the plan from the
 * server first. Finishing setup resets the stack so Back cannot reopen it.
 */
export function useContinueSetup() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userId = user?.user_id;
  const health = useHealthReadiness();
  const latestHealth = useRef(health.ready);
  latestHealth.current = health.ready;
  const { fetchFresh } = useProfilePlanCache();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const continueSetup = useCallback(async (options?: { healthReady?: boolean; fromWelcome?: boolean; fromHealth?: boolean }) => {
    if (busyRef.current) {
      logFitnessAndroid('DUPLICATE_TRANSITION_IGNORED');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      if (Platform.OS === 'android' && (options?.fromWelcome || options?.fromHealth) && userId !== undefined) {
        await savePendingFitnessSetup(userId);
      }
      const plan = await fetchFresh();
      if (!navigation.isFocused()) {
        logFitnessAndroid('NAVIGATION_TARGET_UNAVAILABLE');
        return;
      }
      const stage = stageOf(plan, options?.healthReady ?? latestHealth.current);
      logFitnessAndroid('RESOLVE_NEXT_STAGE');
      if (plan) logFitnessAndroid('EXISTING_PROFILE_DETECTED');
      if (plan?.current_goal) logFitnessAndroid('EXISTING_GOAL_DETECTED');
      if (stage === "ready") {
        navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
      } else {
        // Welcome always enters the device connection checkpoint first. The
        // checkpoint skips permission prompts if access already works.
        const next: Route = options?.fromWelcome
          ? { name: "StepsTrackerScreen" }
          : routeForStage(stage);
        if (next.name === 'StepForm') logFitnessAndroid('NAVIGATE_STEP_FORM');
        navigation.navigate(next.name, next.params);
      }
    } catch (e: any) {
      logFitnessAndroid('PLAN_FETCH_FAILED');
      if (navigation.isFocused()) Alert.alert(i18n.t("stepCounter:r2.planUnavailable"), e?.message || i18n.t("stepCounter:r2.failedToFetchProfilePlan"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [fetchFresh, navigation, userId]);

  return { continueSetup, busy };
}

// The account whose data the fitness caches hold. Query caches and the
// session gender are not cleared on logout app-wide, so RP Move drops its own
// user-specific data when it is opened by a different account.
let scopedUserId: number | null | undefined;

export function useFitnessAccountScope() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.user_id ?? null;
  // Runs during the first render, before any child query reads the cache.
  const lastAccount = useRef<number | null | undefined>(undefined);
  if (lastAccount.current !== userId) {
    if (scopedUserId !== undefined && scopedUserId !== userId) {
      void queryClient.cancelQueries({ queryKey: ["fitness"] });
      void queryClient.cancelQueries({ queryKey: fitnessQueryKeys.all });
      void queryClient.cancelQueries({ queryKey: ["user-info"] });
      queryClient.removeQueries({ queryKey: ["fitness"] });
      queryClient.removeQueries({ queryKey: fitnessQueryKeys.all });
      queryClient.removeQueries({ queryKey: ["user-info"] });
      clearSelectedGender();
    }
    scopedUserId = userId;
    lastAccount.current = userId;
  }
}
