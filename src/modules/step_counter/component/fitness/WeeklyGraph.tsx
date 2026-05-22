import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { DailyData } from "../../navigation/type";
import {
  BORDER_RADIUS,
  COLORS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

interface WeeklyGraphProps {
  weeklyData: DailyData[];
}

const DEFAULT_WEEKLY_DATA: DailyData[] = [
  { day: "Mon", date: 0, progress: 0, done: false },
  { day: "Tue", date: 0, progress: 0, done: false },
  { day: "Wed", date: 0, progress: 0, done: false },
  { day: "Thu", date: 0, progress: 0, done: false },
  { day: "Fri", date: 0, progress: 0, done: false },
  { day: "Sat", date: 0, progress: 0, done: false },
  { day: "Sun", date: 0, progress: 0, done: false },
];

const getProgressColor = (progress: number) => {
  if (progress >= 0.7) return "#22C55E";
  if (progress >= 0.4) return "#F97316";
  return "#D95B16";
};

const ProgressArc = React.memo(({ progress }: { progress: number }) => {
  const safeProgress = Math.min(1, Math.max(0, progress));
  const arcLength = 62;

  return (
    <Svg width={45} height={24} viewBox="0 0 45 24">
      <Path
        d="M6 20 A16 16 0 0 1 39 20"
        stroke="#E5E7EB"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M6 20 A16 16 0 0 1 39 20"
        stroke={getProgressColor(safeProgress)}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${arcLength * safeProgress} ${arcLength}`}
      />
    </Svg>
  );
});

const WeeklyGraph: React.FC<WeeklyGraphProps> = ({ weeklyData }) => {
  const todayDate = useMemo(() => new Date().getDate(), []);
  const data = weeklyData.length > 0 ? weeklyData : DEFAULT_WEEKLY_DATA;

  return (
    <View style={styles.weeklyCard}>
      <View style={styles.weeklyRow}>
        {data.map((item, index) => {
          const isToday = item.date === todayDate;

          return (
            <View
              key={`${item.day}-${item.date || index}`}
              style={[styles.dayItem, isToday && styles.todayItem]}
            >
              <Text style={[styles.dayLabel, isToday && styles.todayText]}>
                {item.day}
              </Text>
              <Text style={[styles.dateText, isToday && styles.todayText]}>
                {item.date || "--"}
              </Text>
              <ProgressArc progress={item.progress} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(WeeklyGraph);

const styles = StyleSheet.create({
  weeklyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  weeklyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },
  dayItem: {
    flex: 1,
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.large,
    paddingVertical: SPACING.sm,
  },
  todayItem: {
    backgroundColor: "#FDF0FF",
  },
  dayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    textAlign: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  todayText: {
    color: COLORS.textDark,
  },
});
