import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { DailyData } from "../../navigation/type";
import {
  BORDER_RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from "../../utils/theme";

interface WeeklyGraphProps {
  weeklyData: DailyData[];
  onViewMore: () => void;
}

const VD = {
  accent: "#C4A8FF",
  accentDim: "rgba(196,168,255,0.25)",
  accentFaint: "rgba(196,168,255,0.12)",
  white: "#FFFFFF",
  whiteLow: "rgba(255,255,255,0.45)",
  cardBg: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(196,168,255,0.18)",
};

const WeeklyGraph: React.FC<WeeklyGraphProps> = ({
  weeklyData,
  onViewMore,
}) => {
  const today = new Date().getDate();

  return (
    <View style={styles.weeklyCard}>
      {/* Header */}
      <View style={styles.weekHeader}>
        <Text style={styles.sectionLabel}>
          This Week
        </Text>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.viewMoreButton}
          onPress={onViewMore}
        >
          <Text style={styles.viewMore}>
            View More
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={VD.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Weekly Bars */}
      <View style={styles.barsRow}>
        {weeklyData.map((item, index) => {
          const isToday =
            item.date === today;

          const fillHeight = Math.max(
            item.progress * 100,
            6
          );

          return (
            <View
              key={`${item.day}-${index}`}
              style={styles.barColumn}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${fillHeight}%`,
                      backgroundColor: item.done
                        ? VD.accent
                        : isToday
                        ? "#A78FFF"
                        : VD.accentDim,
                      borderWidth: isToday
                        ? 1
                        : 0,
                      borderColor: isToday
                        ? VD.accent
                        : "transparent",
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  isToday &&
                    styles.todayText,
                ]}
              >
                {item.day}
              </Text>

              <Text
                style={[
                  styles.dateLabel,
                  isToday &&
                    styles.todayText,
                ]}
              >
                {item.date}
              </Text>
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
    backgroundColor: VD.cardBg,
    borderRadius:
      BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },

  weekHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: VD.whiteLow,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  viewMoreButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:
      SPACING.md,
    marginRight: SPACING.xs,
    borderRadius:
      BORDER_RADIUS.pill,
    backgroundColor:
      VD.accentFaint,
    borderWidth: 1,
    borderColor:
      VD.cardBorder,
  },

  viewMore: {
    ...TYPOGRAPHY.caption,
    color: VD.accent,
    marginRight: 4,
  },

  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    height: 130,
  },

  barColumn: {
    flex: 1,
    alignItems: "center",
  },

  barTrack: {
    width: 22,
    height: 90,
    backgroundColor:
      "rgba(255,255,255,0.06)",
    borderRadius: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
    marginBottom: 8,
  },

  barFill: {
    width: "100%",
    borderRadius: 12,
  },

  dayLabel: {
    fontSize: 11,
    color: VD.whiteLow,
    fontWeight: "600",
  },

  dateLabel: {
    fontSize: 10,
    color: VD.whiteLow,
    marginTop: 2,
  },

  todayText: {
    color: VD.accent,
    fontWeight: "700",
  },
});
