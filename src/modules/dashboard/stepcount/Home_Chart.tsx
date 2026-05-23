

import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import StepsCounterCard from "./StepsCounterCard";
import HealthStatusCard from "./HealthStatusCard";




// ── Query key ──────────────────────────────────────────────────────────────
const HOME_CHART_QUERY_KEY = ["home", "dashboard-cards"] as const;

// ── Types ──────────────────────────────────────────────────────────────────
type StepProgress = {
  steps: number;
  goal_steps: number;
  progress_percent: number;
  steps_today_delta: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const safeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeStepProgress = (response: any): StepProgress => {
  const stepsData =
    response?.user?.steps || response?.data?.steps || response?.steps || {};

  const steps = safeNumber(stepsData.steps);
  const goalSteps = safeNumber(stepsData.goal_steps);
  const progressPercent = safeNumber(
    stepsData.progress_percent,
    goalSteps > 0 ? (steps / goalSteps) * 100 : 0
  );
  const stepsDelta = safeNumber(stepsData.steps_today_delta ?? stepsData.delta, 320);

  return {
    steps,
    goal_steps: goalSteps,
    progress_percent: Math.max(0, Math.min(progressPercent, 100)),
    steps_today_delta: stepsDelta,
  };
};

// ── Component ──────────────────────────────────────────────────────────────
export default function Home_Chart() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // ── Layout ──
  const layout = useMemo(() => {
    const horizontalPadding = width >= 768 ? 20 : 16;
    const gap = 12;
    const maxContentWidth = 540;
    const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
    const cardWidth = Math.floor((contentWidth - gap) / 2);
    return { cardWidth, containerPadding: horizontalPadding, contentWidth, gap };
  }, [width]);

  // ── Step progress query ──
  const stepQuery = useQuery<StepProgress>({
    queryKey: HOME_CHART_QUERY_KEY,
    queryFn: async () => {
      // Replace with your real API call:
      // return normalizeStepProgress(await fetchUserInfo());

      // ── Mock data for development ──
      return {
        steps: 4820,
        goal_steps: 7000,
        progress_percent: 68.86,
        steps_today_delta: 320,
      };
    },
    // refetchInterval: () => (isAuthenticated() ? 5000 : false),
    refetchInterval: 5000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const stepData: StepProgress = stepQuery.data ?? {
    steps: 0,
    goal_steps: 0,
    progress_percent: 0,
    steps_today_delta: 0,
  };

  // ── Invalidate on focus ──
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: HOME_CHART_QUERY_KEY });
    }, [queryClient])
  );

  // ── Navigation handlers ──
  const goToRewards = useCallback(() => {
    const parent = navigation.getParent?.();
    parent?.navigate("RewardStack", { moduleName: "Step Counter" });
  }, [navigation]);

  const goToHealth = useCallback(() => {
    navigation.navigate?.("HealthStack");
  }, [navigation]);

  // ── Render ──
  return (
    <View style={[styles.container, { paddingHorizontal: layout.containerPadding }]}>
      <View style={[styles.row, { maxWidth: layout.contentWidth, gap: layout.gap }]}>
        {/* LEFT: Steps Counter */}
        <StepsCounterCard
          steps={stepData.steps}
          goalSteps={stepData.goal_steps}
          progressPercent={stepData.progress_percent}
          stepsToday={stepData.steps_today_delta}
          onPress={goToRewards}
          loading={stepQuery.isLoading}
          cardWidth={layout.cardWidth}
        />

        {/* RIGHT: Health Status */}
        <HealthStatusCard
          status="active"
          onNavigate={goToHealth}
          cardWidth={layout.cardWidth}
        />
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    alignItems: "stretch",
  },
});