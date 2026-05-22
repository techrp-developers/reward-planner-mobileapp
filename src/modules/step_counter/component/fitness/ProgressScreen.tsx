import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import {
  type CalendarDayData,
  type CalendarDayStatus,
} from "../../api/DashboardAPI";
import { useCalendarProgressQuery } from "../../api/useFitnessQueries";
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

import TrophyIcon from "../../assets/StepCount/trophy.svg";
import StepIcon from "../../assets/StepCount/step_icon.svg";
import FireIcon from "../../assets/StepCount/lightning.svg";
import LocationIcon from "../../assets/StepCount/location.svg";
import ClockIcon from "../../assets/StepCount/clock_icon.svg";
import WalkingShield from "../../assets/StepCount/Walking_Enthusiast.svg";
import StreakShield from "../../assets/StepCount/Streak_Keeper.svg";
import TrailShield from "../../assets/StepCount/Trailblazer.svg";
import SunriseShield from "../../assets/StepCount/Sunrise_Strider.svg";

import WalkSmall from "../../assets/StepCount/Achivement_icon(2).svg";
import StreakSmall from "../../assets/StepCount/Achivement_icon(3).svg";
import TrailSmall from "../../assets/StepCount/Achivement_icon(4).svg";
import SunriseSmall from "../../assets/StepCount/Achivement_icon(1).svg";


type ProgressNav = NativeStackNavigationProp<FitnessStackParamList, "PlanProcess">;
type SvgIcon = React.FC<{ width?: number; height?: number; style?: object }>;

type CalendarCell = {
  key: string;
  dayNumber?: number;
  isoDate?: string;
  status?: CalendarDayStatus;
  isToday?: boolean;
  isSelected?: boolean;
};

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const monthTitleFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const fullMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const selectedDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
});

const achievements = [
  { key: "walk", label: "Walking", Shield: WalkingShield, Icon: WalkSmall },
  { key: "streak", label: "Streak", Shield: StreakShield, Icon: StreakSmall },
  { key: "trail", label: "Trailblazer", Shield: TrailShield, Icon: TrailSmall },
  { key: "sun", label: "Sunrise Strider", Shield: SunriseShield, Icon: SunriseSmall },
];

const pad2 = (value: number) => String(value).padStart(2, "0");
const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
const toIsoDate = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "0";

const safeNumber = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const buildMonthOptions = (baseDate: Date) => {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 2 + index, 1);
    return {
      key: toMonthKey(date),
      label: monthTitleFormatter.format(date),
      date,
    };
  });
};

const buildCalendarCells = (
  monthKey: string,
  calendarData: Record<string, CalendarDayData>,
  selectedIsoDate: string | null
): CalendarCell[] => {
  const [yearValue, monthValue] = monthKey.split("-").map(Number);
  const year = yearValue || new Date().getFullYear();
  const monthIndex = Math.max(0, (monthValue || 1) - 1);
  const firstDate = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const mondayStartOffset = (firstDate.getDay() + 6) % 7;
  const todayIso = toIsoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const emptyCells: CalendarCell[] = Array.from({ length: mondayStartOffset }, (_, index) => ({
    key: `empty-${monthKey}-${index}`,
  }));

  const dayCells: CalendarCell[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const isoDate = toIsoDate(year, monthIndex, dayNumber);

    return {
      key: isoDate,
      dayNumber,
      isoDate,
      status: calendarData[isoDate]?.status,
      isToday: isoDate === todayIso,
      isSelected: isoDate === selectedIsoDate,
    };
  });

  const trailingCount = (7 - ((emptyCells.length + dayCells.length) % 7)) % 7;
  const trailingCells: CalendarCell[] = Array.from({ length: trailingCount }, (_, index) => ({
    key: `trail-${monthKey}-${index}`,
  }));

  return [...emptyCells, ...dayCells, ...trailingCells];
};

const ProgressScreen: React.FC = () => {
  const navigation = useNavigation<ProgressNav>();
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const contentMaxWidth = Math.min(width - RESPONSIVE.horizontalPadding * 2, 560);
  const [selectedMonth, setSelectedMonth] = useState(toMonthKey(today));
  const [selectedDate, setSelectedDate] = useState<string | null>(
    toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const monthOptions = useMemo(() => buildMonthOptions(today), [today]);
  const calendarQuery = useCalendarProgressQuery(selectedMonth);
  const calendarData = calendarQuery.data?.data?.calendar || {};
  const monthlySummary = calendarQuery.data?.data?.summary || null;
  const loadingCalendar = calendarQuery.isLoading;
  const errorMessage =
    calendarQuery.data?.message ||
    (calendarQuery.error ? "Failed to fetch calendar" : "");

  const calendarCells = useMemo(
    () => buildCalendarCells(selectedMonth, calendarData, selectedDate),
    [calendarData, selectedDate, selectedMonth]
  );

  const monthStats = useMemo(() => {
    return {
      completed: monthlySummary?.completed_days || 0,
      missed: monthlySummary?.missed_days || 0,
    };
  }, [monthlySummary]);

  const selectedDayData = useMemo(
    () => (selectedDate ? calendarData[selectedDate] : null),
    [calendarData, selectedDate]
  );

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return fullMonthFormatter.format(new Date(`${selectedMonth}-01T00:00:00`));
    return selectedDateFormatter.format(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate, selectedMonth]);

  const highestStepDay = useMemo(() => {
    const entries = Object.entries(calendarData);
    if (entries.length === 0) return null;

    return entries.reduce(
      (best, [date, data]) =>
        safeNumber(data.steps) > safeNumber(best.data.steps) ? { date, data } : best,
      { date: entries[0][0], data: entries[0][1] }
    );
  }, [calendarData]);

  const handleMonthPress = useCallback((monthKey: string) => {
    setSelectedMonth(monthKey);
    setSelectedDate(null);
  }, []);

  const handleRetry = useCallback(() => {
    calendarQuery.refetch();
  }, [calendarQuery]);

  const handleViewAchievements = useCallback(() => {
    navigation.navigate("AchievementCard");
  }, [navigation]);

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
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} activeOpacity={0.82}>
                <MaterialCommunityIcons name="chevron-left" size={25} color={COLORS.textDark} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthList}
            >
              {monthOptions.map((item) => {
                const active = selectedMonth === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.monthTab, active && styles.monthTabActive]}
                    activeOpacity={0.84}
                    onPress={() => handleMonthPress(item.key)}
                  >
                    <Text style={[styles.monthText, active && styles.monthTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.subText}>
              <Text style={styles.subTextStrong}>{selectedDateLabel}:</Text>{" "}
              {monthStats.completed} days Completed • {monthStats.missed} days Missed
            </Text>

            <View style={styles.card}>
              {loadingCalendar ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color={COLORS.primaryIndigo} />
                  <Text style={styles.stateText}>Loading calendar...</Text>
                </View>
              ) : errorMessage ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>{errorMessage}</Text>
                  <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={handleRetry}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CalendarGrid
                  cells={calendarCells}
                  onSelectDate={setSelectedDate}
                />
              )}

              <View style={styles.statsRow}>
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.steps))}
                  label="Steps"
                  Icon={StepIcon}
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.calories))}
                  label="Kcal"
                  Icon={FireIcon}
                  color="#F97316"
                />
                <Stat
                  value={safeNumber(selectedDayData?.distance_km).toFixed(1)}
                  label="Km"
                  Icon={LocationIcon}
                />
                <Stat
                  value={formatNumber(safeNumber(selectedDayData?.active_minutes))}
                  label="Move Min"
                  Icon={ClockIcon}
                />
              </View>
            </View>

            {highestStepDay ? (
              <View style={styles.highestCard}>
                <View style={styles.trophyWrap}>
                  <TrophyIcon width={32} height={32} />
                </View>
                <View style={styles.highestCopy}>
                  <Text style={styles.highestTitle}>
                    Your <Text style={styles.highestAccent}>Highest</Text>{"\n"}Step Day
                  </Text>
                </View>
                <View style={styles.highestRight}>
                  <Text style={styles.highestValue}>
                    {formatNumber(safeNumber(highestStepDay.data.steps))} Steps
                  </Text>
                  <Text style={styles.highestDate}>
                    {selectedDateFormatter.format(new Date(`${highestStepDay.date}T00:00:00`))}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ACHIEVEMENTS */}
            <View style={styles.card}>
              <View style={styles.achHeader}>
                <Text style={styles.achTitle}>Achievements</Text>
                <TouchableOpacity
                  style={styles.viewMoreRow}
                  onPress={handleViewAchievements}
                  activeOpacity={0.82}
                >
                  <Text style={styles.viewMoreText}>View More</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color={COLORS.primaryIndigo}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.achRow}>
                {achievements.map((a) => (
                  <View key={a.key} style={styles.achItem}>
                    <View style={styles.shieldWrap}>
                      <a.Shield width={68} height={68} />
                      <a.Icon width={28} height={28} style={styles.smallIcon} />
                    </View>
                    <Text style={styles.achLabel}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default React.memo(ProgressScreen);

type CalendarGridProps = {
  cells: CalendarCell[];
  onSelectDate: (date: string) => void;
};

const CalendarGrid = React.memo(({ cells, onSelectDate }: CalendarGridProps) => (
  <View>
    <View style={styles.weekRow}>
      {WEEK_DAYS.map((day) => (
        <Text key={day} style={styles.weekText}>{day}</Text>
      ))}
    </View>
    <View style={styles.grid}>
      {cells.map((cell) => (
        <DayItem key={cell.key} cell={cell} onSelectDate={onSelectDate} />
      ))}
    </View>
  </View>
));

type DayItemProps = {
  cell: CalendarCell;
  onSelectDate: (date: string) => void;
};

const DayItem = React.memo(({ cell, onSelectDate }: DayItemProps) => {
  if (!cell.dayNumber || !cell.isoDate) {
    return <View style={styles.dayOuter} />;
  }

  const completed = cell.status === "completed";
  const missed = cell.status === "missed";
  const partial = cell.status === "partial";

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      style={styles.dayOuter}
      onPress={() => onSelectDate(cell.isoDate!)}
    >
      <View
        style={[
          styles.dayBox,
          completed && styles.completedDay,
          missed && styles.missedDay,
          partial && styles.partialDay,
          cell.isToday && styles.todayDay,
          cell.isSelected && styles.selectedDay,
        ]}
      >
        {completed ? (
          <MaterialCommunityIcons name="check" size={16} color={COLORS.textWhite} />
        ) : (
          <Text
            style={[
              styles.dayText,
              completed && styles.completedText,
              partial && styles.partialText,
              cell.isSelected && styles.selectedText,
            ]}
          >
            {cell.dayNumber}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

type StatProps = {
  value: string;
  label: string;
  Icon: SvgIcon;
  color?: string;
};

const Stat = React.memo(({ value, label, Icon, color = "#2563EB" }: StatProps) => (
  <View style={styles.statItem}>
    <Icon width={24} height={24} />
    <View style={styles.statTextRow}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
));

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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  content: {
    width: "100%",
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textDark,
    textAlign: "center",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  monthList: {
    paddingVertical: SPACING.xs,
  },
  monthTab: {
    minHeight: 40,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthTabActive: {
    backgroundColor: "#FFE4F0",
    borderColor: "#F9A8D4",
  },
  monthText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
  },
  monthTextActive: {
    color: COLORS.primaryPurple,
  },
  subText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  subTextStrong: {
    color: COLORS.textDark,
    fontWeight: "800",
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
  },
  weekText: {
    ...TYPOGRAPHY.caption,
    width: `${100 / 7}%`,
    color: COLORS.textDark,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayOuter: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  dayBox: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  completedDay: {
    backgroundColor: "#62D15F",
    borderColor: "#62D15F",
  },
  missedDay: {
    backgroundColor: "#F3F4F6",
    borderColor: "#EEF0F6",
  },
  partialDay: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  todayDay: {
    borderColor: COLORS.primaryIndigo,
    borderWidth: 2,
  },
  selectedDay: {
    backgroundColor: "#FFF0F7",
    borderColor: COLORS.primaryPink,
    borderWidth: 2,
  },
  dayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
  },
  completedText: {
    color: COLORS.textWhite,
  },
  partialText: {
    color: "#B45309",
  },
  selectedText: {
    color: COLORS.primaryPurple,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statTextRow: {
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  statValue: {
    ...TYPOGRAPHY.bodyMedium,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  highestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5FF",
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  trophyWrap: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: "#FFF6E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  highestCopy: {
    flex: 1,
  },
  highestTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
  },
  highestAccent: {
    color: COLORS.primaryIndigo,
    fontWeight: "800",
  },
  highestRight: {
    alignItems: "flex-end",
  },
  highestValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primaryIndigo,
  },
  highestDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    marginTop: 2,
  },
  stateBox: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.md,
    minHeight: 42,
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

  achHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  achTitle: { fontSize: 18, fontWeight: '700' },
  viewMore: { color: '#4F46E5', fontWeight: '600' },

  achRow: { flexDirection: 'row' },
  achItem: { alignItems: 'center', flex: 1 },

  shieldWrap: { position: 'relative', alignItems: 'center' },
  smallIcon: { position: 'absolute', bottom: 20 },
  achLabel: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  viewMoreRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: '#F4F0FF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewMoreText: {
    color: '#3B6BFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
});
