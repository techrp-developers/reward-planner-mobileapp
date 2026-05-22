import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

import BMIBanner from "../../assets/StepCount/BMIpage.svg";
import StepIcon from "../../assets/StepCount/step_icon.svg";
import ClockIcon from "../../assets/StepCount/clock_icon.svg";
import RewardIcon from "../../../../assets/product/rewards.svg";
import {
  fetchProfilePlan,
  type ProfilePlanResponse,
  type WeeklyPlanItem,
} from "../../api/ProfileAPI";

type BMIScreenNavProp = NativeStackNavigationProp<FitnessStackParamList, "BMICart">;

const BMI_MIN = 12;
const BMI_MAX = 40;
const INDICATOR_WIDTH = 5;

const BMI_SEGMENTS = [
  { label: "Under", min: 12, max: 18.5, color: "#FCD34D" },
  { label: "Normal", min: 18.5, max: 25, color: "#22C55E" },
  { label: "Over", min: 25, max: 30, color: "#F97316" },
  { label: "Obese", min: 30, max: 40, color: "#EF4444" },
];

const clamp = (value: number, min: number, max: number) => (
  Math.min(Math.max(value, min), max)
);

const formatNumber = (value: number) => (
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "0"
);

const formatMinutes = (minutes: number) => {
  if (minutes === 60) return "1 hour";
  if (minutes > 60 && minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} min`;
};

const toTitleCase = (value: string) => (
  value
    .replace(/[_-]/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
);

const getBmiSegment = (bmi: number, category?: string) => {
  if (Number.isFinite(bmi)) {
    if (bmi < 18.5) return BMI_SEGMENTS[0];
    if (bmi < 25) return BMI_SEGMENTS[1];
    if (bmi < 30) return BMI_SEGMENTS[2];
    return BMI_SEGMENTS[3];
  }

  const normalized = category?.toLowerCase() || "";
  return BMI_SEGMENTS.find((segment) => normalized.includes(segment.label.toLowerCase())) || BMI_SEGMENTS[1];
};

const BMIScreen: React.FC = () => {
  const navigation = useNavigation<BMIScreenNavProp>();
  const { width, height } = useWindowDimensions();
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const [profilePlan, setProfilePlan] = useState<ProfilePlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [barWidth, setBarWidth] = useState(0);

  const contentWidth = width;
  const bannerHeight = Math.min(Math.max(height * 0.34, 260), 360);
  const isTablet = width >= 768;
  const contentPadding = isTablet ? 34 : 20;

  const loadProfilePlan = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const res = await fetchProfilePlan();

    if (res.success && res.data) {
      setProfilePlan(res.data);
    } else {
      setErrorMessage(res.message || "Failed to fetch profile plan");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfilePlan();
  }, [loadProfilePlan]);

  const bmiDetails = useMemo(() => {
    const bmiValue = Number(profilePlan?.bmi ?? 0);
    const activeSegment = getBmiSegment(bmiValue, profilePlan?.category);
    const category = profilePlan?.category ? toTitleCase(profilePlan.category) : activeSegment.label;
    const steps = profilePlan?.recommended_steps ?? 0;
    const minutes = profilePlan?.recommended_minutes ?? 0;
    const weeklyPlan = profilePlan?.weekly_plan ?? [];

    return {
      bmiValue,
      bmiLabel: Number.isFinite(bmiValue) && bmiValue > 0 ? bmiValue.toFixed(2) : "--",
      category,
      categoryColor: activeSegment.color,
      goal: profilePlan?.goal || "Your Goal",
      steps,
      minutes,
      weeklyPlan,
    };
  }, [profilePlan]);

  const indicatorTarget = useMemo(() => {
    if (!barWidth || !Number.isFinite(bmiDetails.bmiValue)) return 0;

    const usableWidth = Math.max(barWidth - INDICATOR_WIDTH, 0);
    const progress = (clamp(bmiDetails.bmiValue, BMI_MIN, BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN);

    return usableWidth * progress;
  }, [barWidth, bmiDetails.bmiValue]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: indicatorTarget,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [indicatorAnim, indicatorTarget]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleMakeGoal = useCallback(() => navigation.navigate("StepGoal"), [navigation]);

  return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={styles.screenGradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.hero, { width: contentWidth, height: bannerHeight }]}>
            <BMIBanner width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />

            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textDark} />
            </TouchableOpacity>

            <View style={styles.tagsRow}>
              <MetricTag Icon={StepIcon} label={`${formatNumber(bmiDetails.steps)} Steps`} />
              <MetricTag Icon={ClockIcon} label={formatMinutes(bmiDetails.minutes)} />
            </View>
          </View>

          <View style={[styles.contentCard, { width: contentWidth, padding: contentPadding }]}>
            {loading ? (
              <LoadingState />
            ) : errorMessage ? (
              <ErrorState message={errorMessage} onRetry={loadProfilePlan} />
            ) : (
              <>
            <Text style={styles.bmiTitle}>
              Your BMI is{" "}
              <Text style={[styles.bmiValue, { color: bmiDetails.categoryColor }]}>
                {bmiDetails.bmiLabel}
              </Text>
            </Text>

            <View
              style={styles.bmiBar}
              onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
            >
              {BMI_SEGMENTS.map((segment, index) => (
                <View
                  key={segment.label}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: segment.color,
                      flex: segment.max - segment.min,
                      marginLeft: index === 0 ? 0 : 3,
                    },
                  ]}
                />
              ))}
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    transform: [{ translateX: indicatorAnim }],
                  },
                ]}
              />
            </View>

            <View style={styles.bmiLabelRow}>
              {BMI_SEGMENTS.map((segment) => (
                <Text key={segment.label} style={[styles.bmiLbl, { flex: segment.max - segment.min }]}>
                  {segment.label}
                </Text>
              ))}
            </View>

            <Text style={[styles.bmiCategory, { color: bmiDetails.categoryColor }]}>
              {bmiDetails.category}
            </Text>
            <Text style={styles.guidance}>
              We have put together a plan that gently guides you toward your goal at a pace that feels doable.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.goalTitle}>
              Goal: <Text style={styles.goalValue}>{bmiDetails.goal}</Text>
            </Text>

            <View style={styles.weekCard}>
              <LinearGradient colors={COLORS.gradientPink} style={styles.weekHeader}>
                <Text style={styles.weekHeading}>Weekly Breakdown</Text>
              </LinearGradient>

              <View style={styles.weekGrid}>
                {bmiDetails.weeklyPlan.length > 0 ? (
                  bmiDetails.weeklyPlan.map((item) => (
                    <WeeklyPlanCard key={`${item.week}-${item.steps}`} item={item} />
                  ))
                ) : (
                  <Text style={styles.emptyWeekText}>Your weekly plan will appear here soon.</Text>
                )}
              </View>

              <LinearGradient colors={["#E5F6E3", "#F7FFF4"]} style={styles.lossBox}>
                <Text style={styles.lossTxt}>
                  Build toward <Text style={styles.lossBold}>{formatNumber(bmiDetails.steps)} daily steps</Text> with a weekly plan tailored to your BMI.
                </Text>
              </LinearGradient>
            </View>

            <LinearGradient colors={COLORS.gradientPurple} style={styles.rewardCard}>
              <RewardIcon width={42} height={42} />
              <Text style={styles.rewardText}>
                Stay consistent and earn coins every week
              </Text>
            </LinearGradient>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.goalButtonWrap}
              onPress={handleMakeGoal}
            >
              <LinearGradient colors={COLORS.gradientPurple} style={styles.goalButton}>
                <Text style={styles.goalButtonText}>Make This My Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const MetricTag = React.memo(({ Icon, label }: { Icon: any; label: string }) => (
  <LinearGradient colors={["#FFFFFF", "#F7F0FF"]} style={styles.tag}>
    <Icon width={18} height={18} />
    <Text style={styles.tagText}>{label}</Text>
  </LinearGradient>
));

const WeeklyPlanCard = React.memo(({ item }: { item: WeeklyPlanItem }) => (
  <View style={styles.weekBox}>
    <Text style={styles.weekName}>Week {item.week}</Text>
    <Text style={styles.weekSteps}>{formatNumber(item.steps)} Steps</Text>
  </View>
));

const LoadingState = React.memo(() => (
  <View style={styles.stateBox}>
    <ActivityIndicator color={COLORS.primaryIndigo} size="large" />
    <Text style={styles.stateTitle}>Building your BMI plan</Text>
    <Text style={styles.stateText}>Fetching your latest profile recommendations.</Text>
  </View>
));

const ErrorState = React.memo(({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.stateBox}>
    <View style={styles.errorIcon}>
      <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#EF4444" />
    </View>
    <Text style={styles.stateTitle}>Plan unavailable</Text>
    <Text style={styles.stateText}>{message}</Text>
    <TouchableOpacity activeOpacity={0.9} onPress={onRetry} style={styles.retryButton}>
      <Text style={styles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

export default React.memo(BMIScreen);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screenGradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 0,
    paddingBottom: 28,
    backgroundColor: "#FFFFFF",
  },
  hero: {
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: "#F3F4F6",
  },
  backBtn: {
    position: "absolute",
    left: 18,
    top: 44,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.54)",
  },
  tagsRow: {
    position: "absolute",
    left: 16,
    bottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    minHeight: 34,
    minWidth: 86,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(166,84,205,0.42)",
    overflow: "hidden",
    ...SHADOWS.small,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginLeft: 6,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
  },
  bmiTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: COLORS.textDark,
    textAlign: "left",
  },
  bmiValue: {
    color: COLORS.warning,
    fontWeight: "800",
  },
  bmiBar: {
    flexDirection: "row",
    width: "100%",
    height: 4,
    borderRadius: BORDER_RADIUS.pill,
    overflow: "visible",
    marginTop: 18,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    borderRadius: BORDER_RADIUS.pill,
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: -8,
    width: 5,
    height: 22,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 0,
    borderColor: "#111827",
    backgroundColor: "#111827",
    ...SHADOWS.small,
  },
  bmiLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bmiLbl: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  bmiCategory: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "left",
  },
  guidance: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: COLORS.textMedium,
    marginTop: 6,
    textAlign: "left",
  },
  divider: {
    height: 1,
    backgroundColor: "#DADDE5",
    marginVertical: 20,
  },
  goalTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "left",
  },
  goalValue: {
    color: COLORS.textDark,
  },
  weekCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 0,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#FCE1F0",
    overflow: "hidden",
  },
  weekHeader: {
    borderRadius: 0,
    paddingVertical: 14,
    marginBottom: 14,
  },
  weekHeading: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "left",
    color: COLORS.surface,
    paddingHorizontal: 18,
  },
  weekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: SPACING.sm,
    paddingHorizontal: 14,
  },
  weekBox: {
    width: "48%",
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "#FAF7FF",
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(134,101,255,0.12)",
  },
  weekName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
  },
  weekSteps: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  emptyWeekText: {
    ...TYPOGRAPHY.body,
    width: "100%",
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
  lossBox: {
    margin: 14,
    borderRadius: 10,
    padding: SPACING.md,
  },
  lossTxt: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
    textAlign: "center",
  },
  lossBold: {
    color: COLORS.success,
    fontWeight: "800",
  },
  rewardCard: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  rewardText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
    marginLeft: SPACING.md,
    flex: 1,
  },
  goalButtonWrap: {
    marginTop: SPACING.lg,
  },
  goalButton: {
    height: RESPONSIVE.buttonHeight,
    borderRadius: BORDER_RADIUS.large,
    alignItems: "center",
    justifyContent: "center",
  },
  goalButtonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
  },
  stateBox: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  stateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  retryButton: {
    marginTop: SPACING.lg,
    minHeight: 44,
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
  errorIcon: {
    width: 54,
    height: 54,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
});
