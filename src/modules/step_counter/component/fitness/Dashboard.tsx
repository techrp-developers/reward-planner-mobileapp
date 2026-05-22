import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import WeeklyGraph from "./WeeklyGraph";
import DailyStats from "./DailyStats";
import StatisticsGraph from "./StatisticsGraph";
import CoinHistoryAndPlan from "./CoinHistoryAndPlan";
import type { DailyData, StepStats } from "../../navigation/type";
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";
import { fetchUserInfo } from "../../../ecommerce/api/AuthAPI";
import {
  useDashboardQuery,
  useFitnessStreakQuery,
  useTodaySummaryQuery,
  useWeeklyProgressQuery,
} from "../../api/useFitnessQueries";
import { useQuery } from "@tanstack/react-query";
import { useStepTracker } from "../StepCode/useStepTracker";
import GoalCelebrationScreen from "./GoalCelebrationScreen";
import TodayGoalCompletedScreen from "./TodayGoalCompletedScreen";
import type { GoalSyncData } from "../../api/Stepsapi";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

const Dashboard: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width - RESPONSIVE.horizontalPadding * 2, 560);
  const userInfoQuery = useQuery({
    queryKey: ["user-info"],
    queryFn: fetchUserInfo,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });
  const { celebrationData, dismissCelebration } = useStepTracker();
  const [summaryData, setSummaryData] = useState<GoalSyncData | null>(null);

  const handleDismissCelebration = useCallback(() => {
    if (celebrationData?.planOverview && celebrationData?.overallSummary) {
      setSummaryData(celebrationData);
    }
    dismissCelebration();
  }, [celebrationData, dismissCelebration]);

  const handleDismissSummary = useCallback(() => setSummaryData(null), []);
  const dashboardQuery = useDashboardQuery();
  const summaryQuery = useTodaySummaryQuery();
  const weeklyQuery = useWeeklyProgressQuery();
  const streakQuery = useFitnessStreakQuery();

  const firstName = useMemo(() => {
    const userInfo = userInfoQuery.data;
    const resolvedName =
      userInfo?.user?.first_name ||
      userInfo?.user?.name ||
      userInfo?.name ||
      "Name";

    return String(resolvedName).split(/\s+/)[0] || "Name";
  }, [userInfoQuery.data]);

  const dashboardSteps = useMemo(() => ({
    todaySteps: dashboardQuery.data?.data?.today_steps || 0,
    goalSteps: dashboardQuery.data?.data?.goal_steps || 0,
  }), [dashboardQuery.data]);

  const summary = useMemo(() => ({
    steps: summaryQuery.data?.data?.steps || 0,
    goal_steps: summaryQuery.data?.data?.goal_steps || 0,
    distance_km: summaryQuery.data?.data?.distance_km || 0,
    calories: summaryQuery.data?.data?.calories || 0,
    active_minutes: summaryQuery.data?.data?.active_minutes || 0,
  }), [summaryQuery.data]);

  const weeklyData = useMemo<DailyData[]>(() => {
    const goalSteps = dashboardSteps.goalSteps || summary.goal_steps || 1;
    const items = weeklyQuery.data?.data || [];

    return items.map((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      const progress = goalSteps > 0 ? item.steps / goalSteps : 0;

      return {
        day: dayFormatter.format(date),
        date: date.getDate(),
        progress,
        done: progress >= 1,
      };
    });
  }, [dashboardSteps.goalSteps, summary.goal_steps, weeklyQuery.data]);

  const loadingDashboard =
    dashboardQuery.isLoading ||
    summaryQuery.isLoading ||
    weeklyQuery.isLoading ||
    streakQuery.isLoading;
  const dashboardError =
    dashboardQuery.data?.message ||
    summaryQuery.data?.message ||
    weeklyQuery.data?.message ||
    streakQuery.data?.message ||
    (dashboardQuery.error || summaryQuery.error || weeklyQuery.error || streakQuery.error
      ? "Failed to load dashboard"
      : "");

  const handleRetryDashboard = useCallback(() => {
    dashboardQuery.refetch();
    summaryQuery.refetch();
    weeklyQuery.refetch();
    streakQuery.refetch();
  }, [dashboardQuery, summaryQuery, weeklyQuery, streakQuery]);

  const stepStats: StepStats = useMemo(() => {
    const currentSteps = summary.steps || dashboardSteps.todaySteps;
    const goalSteps = summary.goal_steps || dashboardSteps.goalSteps || 1;

    return {
      currentSteps,
      goalSteps,
      distance_km: summary.distance_km || 0,
      active_minutes: summary.active_minutes || 0,
      calories: summary.calories || 0,
    };
  }, [dashboardSteps.goalSteps, dashboardSteps.todaySteps, summary]);

  const handleViewMore = useCallback(() => {}, []);

  const dateLabel = useMemo(
    () => today.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    [today]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={COLORS.gradientScreen} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
        >
          <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Today's movement</Text>
              <Text style={styles.greetingTitle}>Hello {firstName}</Text>
              <Text style={styles.subText}>Today, {dateLabel}</Text>
            </View>

            

            {loadingDashboard ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={COLORS.primaryIndigo} />
                <Text style={styles.stateText}>Loading your movement...</Text>
              </View>
            ) : dashboardError ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateText}>{dashboardError}</Text>
                <Text style={styles.retryText} onPress={handleRetryDashboard}>
                  Retry
                </Text>
              </View>
            ) : (
              <>
                <WeeklyGraph weeklyData={weeklyData} />
                <DailyStats stats={stepStats} onViewMore={handleViewMore} />
              </>
            )}

            <View style={styles.sectionSpacing}>
              <StatisticsGraph />
            </View>

            <CoinHistoryAndPlan />
          </View>
        </ScrollView>
      </LinearGradient>
      {celebrationData && (
        <GoalCelebrationScreen
          response={celebrationData}
          onDismiss={handleDismissCelebration}
        />
      )}
      {summaryData?.planOverview && summaryData?.overallSummary && (
        <View style={styles.summaryOverlay}>
          <TodayGoalCompletedScreen
            planOverview={summaryData.planOverview}
            overallSummary={summaryData.overallSummary}
            currentStreak={summaryData.currentStreak ?? 0}
            reward={summaryData.reward}
            onContinue={handleDismissSummary}
            onBack={handleDismissSummary}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default React.memo(Dashboard);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgVeryLight,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  content: {
    width: "100%",
  },
  header: {
    marginBottom: SPACING.lg,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  greetingTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
  },
  subText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.card,
  },
  heroLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: COLORS.textDark,
    letterSpacing: 0,
  },
  heroSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
  },
  progressRing: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F0FF",
    borderWidth: 8,
    borderColor: COLORS.primaryIndigo,
  },
  progressText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.deepIndigo,
  },
  sectionSpacing: {
    marginBottom: SPACING.lg,
  },
  stateBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.large,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  retryText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primaryIndigo,
    marginTop: SPACING.md,
  },
  summaryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
