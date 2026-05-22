import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SPACING,
  SHADOWS,
  TYPOGRAPHY,
  fitnessCardStyle,
} from "../../utils/theme";

import StepCountBg from "../../assets/StepCount/Step_Count.svg";
import StepIcon from "../../assets/StepCount/step_icon.svg";
import CoinIcon from "../../../../assets/product/rewards.svg";
import {
  fetchProfilePlan,
  selectUserGoal,
  type ProfilePlanResponse,
} from "../../api/ProfileAPI";
import { useInvalidateFitnessQueries } from "../../api/useFitnessQueries";

type StepGoalNavProp = NativeStackNavigationProp<FitnessStackParamList, "StepGoal">;

type GoalOption = {
  id: number;
  dailySteps: number;
  label: string;
  coins: number;
};

const formatNumber = (value: number) => (
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "0"
);

const getRewardCoins = (steps: number, index: number) => {
  if (steps >= 10000) return 40;
  if (steps >= 7500) return 30;
  if (steps >= 5000) return 20;
  return 10 + index * 5;
};

const StepGoal: React.FC = () => {
  const navigation = useNavigation<StepGoalNavProp>();
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const [profilePlan, setProfilePlan] = useState<ProfilePlanResponse | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const goals = useMemo<GoalOption[]>(() => {
    const weeklyPlan = profilePlan?.weekly_plan || [];

    if (weeklyPlan.length > 0) {
      return weeklyPlan.map((item, index) => ({
        id: item.week,
        dailySteps: item.steps,
        label: `${formatNumber(item.steps)} Steps`,
        coins: getRewardCoins(item.steps, index),
      }));
    }

    if (profilePlan?.recommended_steps) {
      return [{
        id: 1,
        dailySteps: profilePlan.recommended_steps,
        label: `${formatNumber(profilePlan.recommended_steps)} Steps`,
        coins: getRewardCoins(profilePlan.recommended_steps, 0),
      }];
    }

    return [];
  }, [profilePlan]);

  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.id === selected),
    [goals, selected]
  );

  const loadPlan = useCallback(async () => {
    setLoadingPlan(true);
    setErrorMessage("");

    const res = await fetchProfilePlan();

    if (res.success && res.data) {
      setProfilePlan(res.data);
      const firstGoal = res.data.weekly_plan?.[0];
      setSelected(firstGoal?.week ?? (res.data.recommended_steps ? 1 : null));
    } else {
      setErrorMessage(res.message || "Failed to load goals");
    }

    setLoadingPlan(false);
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleSetGoal = useCallback(async () => {
    if (!selectedGoal) {
      Alert.alert("Select goal", "Please select your daily step goal.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await selectUserGoal({
        daily_steps: selectedGoal.dailySteps,
      });

      if (!res.success) {
        Alert.alert("Goal update failed", res.message);
        return;
      }

      invalidateFitnessQueries();
      navigation.navigate("StepsTrackerScreen");
    } finally {
      setSubmitting(false);
    }
  }, [invalidateFitnessQueries, navigation, selectedGoal]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <StepCountBg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>

      <ScrollView contentContainerStyle={styles.centerWrapper} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={COLORS.gradientCard} style={styles.popupCard}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textMedium} />
          </TouchableOpacity>

          <Text style={styles.eyebrow}>Activity target</Text>
          <Text style={styles.title}>Choose your activity goal</Text>
          <Text style={styles.subtitle}>
            Pick the pace that feels realistic. You can adjust it later.
          </Text>

          {loadingPlan ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={COLORS.primaryIndigo} />
              <Text style={styles.stateText}>Loading your recommended goals...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadPlan} activeOpacity={0.85}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : goals.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateText}>No step goals are available right now.</Text>
            </View>
          ) : (
            goals.map((item) => {
              const isActive = selected === item.id;

              return (
                <TouchableOpacity
                  key={`${item.id}-${item.dailySteps}`}
                  activeOpacity={0.88}
                  style={[styles.goalCard, isActive && styles.goalCardSelected]}
                  onPress={() => setSelected(item.id)}
                >
                  <View style={styles.goalLeft}>
                    <View style={styles.goalIconWrap}>
                      <StepIcon width={22} height={22} />
                    </View>
                    <View style={styles.goalCopy}>
                      <Text style={styles.goalText}>{item.label}</Text>
                      <Text style={styles.goalMeta}>Daily step target</Text>
                    </View>
                  </View>

                  <View style={styles.coinContainer}>
                    <CoinIcon width={18} height={18} />
                    <Text style={styles.coinText}>{item.coins}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <Text style={styles.footerText}>
            The longer you walk, the bigger the reward.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSetGoal}
            disabled={submitting || loadingPlan || !selectedGoal}
            style={styles.buttonWrap}
          >
            <LinearGradient
              colors={submitting || loadingPlan || !selectedGoal ? ["#C7C7D1", "#AFAFBB"] : COLORS.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.buttonText}>Set Goal</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default React.memo(StepGoal);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgVeryLight,
  },
  centerWrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RESPONSIVE.horizontalPadding,
    paddingVertical: SPACING.xxl,
  },
  popupCard: {
    ...fitnessCardStyle,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "rgba(134,101,255,0.09)",
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
    textTransform: "uppercase",
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  goalCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.small,
  },
  goalCardSelected: {
    borderColor: COLORS.primaryIndigo,
    backgroundColor: "#F5F0FF",
  },
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm,
  },
  goalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "rgba(252,139,173,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  goalCopy: {
    flex: 1,
  },
  goalText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textDark,
    flexShrink: 1,
  },
  goalMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  coinText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primaryPurple,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  buttonWrap: {
    width: "100%",
  },
  button: {
    height: RESPONSIVE.buttonHeight,
    borderRadius: BORDER_RADIUS.large,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
  },
  stateBox: {
    width: "100%",
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.large,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.md,
    minHeight: 40,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryIndigo,
  },
  retryText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
  },
});
