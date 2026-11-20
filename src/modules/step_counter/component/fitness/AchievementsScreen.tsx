import { goBackInFitness } from "../../utils/fitnessNavigation";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "./FitnessGradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

import type { AchievementMilestone } from "../../api/DashboardAPI";
import { useAchievementsQuery } from "../../api/useFitnessQueries";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../../utils/theme";

import UnAchievedShield from "../../assets/StepCount/UnAchievedShield.svg";
import { achievementArtwork } from "./achievementArtwork";
import { useTranslation } from "react-i18next";
import { translateSourceText } from "../../../../i18n/sourceText";

import { useStepStyles } from "../../utils/useStepTheme";

const VD_DARK = {
  bg: ["#070A16", "#111735", "#201A3F"],
  ink: "#F6F7FF",
  muted: "#A8AEC8",
  softText: "#979EBC",
  accent: "#8EA2FF",
  accentDark: "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg: "rgba(255,255,255,0.075)",
  cardSoft: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(174,188,255,0.16)",
  shadow: "#02030A",
};

type Palette = typeof VD_DARK;

const VD_LIGHT: Palette = {
  bg: ["#F5F9FF", "#EEF4FF", "#F3EEFF"],
  ink: "#10152D",
  muted: "#777FA5",
  softText: "#8A92B2",
  accent: "#426BFF",
  accentDark: "#5B3FD9",
  accentFaint: "rgba(66,107,255,0.10)",
  cardBg: "#FFFFFF",
  cardSoft: "#F3F6FD",
  cardBorder: "#E9EEFA",
  shadow: "#4664A5",
};

const formatStepLabel = (value: number) => {
  if (value >= 1000000 && value % 1000000 === 0) {
    return `${value / 1000000}M`;
  }

  if (value >= 1000 && value % 1000 === 0) {
    return `${value / 1000}K`;
  }

  return String(value);
};

const groupArtwork = new Map([
  ["walking", achievementArtwork.walking],
  ["streak_keeper", achievementArtwork.streak],
  ["trailblazer", achievementArtwork.trail],
  ["sunrise_strider", achievementArtwork.sunrise],
]);

/* ---------------- BADGE SHIELD ---------------- */
type BadgeShieldProps = {
  milestone: AchievementMilestone;
  groupKey: string | null;
};

const BadgeShield = ({ milestone, groupKey }: BadgeShieldProps) => {
  const { styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { achieved, target_value: target, type } = milestone;
  const { BadgeSvg, IconSvg } =
    groupArtwork.get(groupKey ?? "") ??
    (type === "streak" ? achievementArtwork.streak : achievementArtwork.walking);
  const ShieldIcon = achieved ? BadgeSvg : UnAchievedShield;
  const label = type === "steps" ? formatStepLabel(Number(target)) : String(target);

  return (
    <View style={styles.badgeWrapper}>
      <View style={styles.shieldContainer}>
        {/* SHIELD */}
        <ShieldIcon width={74} height={74} />

        {/* LABEL + SMALL ICON */}
        <View style={styles.insideContent}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.insideLabel,
              achieved ? styles.textAchieved : styles.textUnachieved,
            ]}
          >
            {label}
          </Text>

          {/* ICON BELOW LABEL */}
          <IconSvg
            width={18}
            height={18}
            style={styles.smallIcon}
            opacity={achieved ? 1 : 0.4}
          />
        </View>
      </View>
    </View>
  );
};

/* ---------------- ACHIEVEMENT CARD ---------------- */
type AchievementCardProps = {
  title: string;
  description: string | null;
  children: React.ReactNode;
};

const AchievementCard = ({ title, description, children }: AchievementCardProps) => {
  const { styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{translateSourceText("stepCounter", title)}</Text>
      {description ? (
        <Text style={styles.sectionDesc}>{translateSourceText("stepCounter", description)}</Text>
      ) : null}
      <View style={styles.badgeGrid}>{children}</View>
    </View>
  );
};

/* ---------------- MAIN SCREEN ---------------- */
export default function AchievementsScreen() {
  const { palette: VD, styles, isDark } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  const navigation = useNavigation();
  // Includes the RP Move tab bar floating over this screen.
  const { bottom: bottomInset } = useSafeAreaInsets();
  const achievementsQuery = useAchievementsQuery();
  const achievementGroups = achievementsQuery.data?.data ?? [];
  const loading = achievementsQuery.isLoading;
  const errorMessage =
    achievementsQuery.data?.message ||
    (achievementsQuery.error ? tx("stepCounter:r2.failedToFetchAchievements") : "");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={VD.bg[0]} />
      <LinearGradient colors={VD.bg} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 16 }}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => goBackInFitness(navigation)}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={25}
                color={VD.accentDark}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{tx("stepCounter:achievementsScreen.achievements")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* SECTIONS */}
          {loading ? (
            <View style={[styles.card, styles.stateCard]}>
              <ActivityIndicator color={VD.accent} />
              <Text style={styles.stateText}>{tx("stepCounter:achievementsScreen.loadingAchievements")}</Text>
            </View>
          ) : errorMessage ? (
            <View style={[styles.card, styles.stateCard]}>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => achievementsQuery.refetch()}
                activeOpacity={0.84}
              >
                <Text style={styles.retryText}>{tx("stepCounter:achievementsScreen.retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : achievementGroups.length === 0 ? (
            <View style={[styles.card, styles.stateCard]}>
              <Text style={styles.stateText}>{tx("stepCounter:achievementsScreen.empty")}</Text>
            </View>
          ) : (
            achievementGroups.map((group) => (
              <AchievementCard
                key={group.group_id ?? "ungrouped"}
                title={group.title || tx("stepCounter:achievementsScreen.achievements")}
                description={group.description}
              >
                {group.milestones.map((milestone) => (
                  <BadgeShield
                    key={milestone.achievement_id}
                    milestone={milestone}
                    groupKey={group.group_key}
                  />
                ))}
              </AchievementCard>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const createStyles = (VD: Palette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VD.bg[0],
  },
  gradient: {
    flex: 1,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    flexShrink: 1,
    color: VD.ink,
    textAlign: "center",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },

  card: {
    backgroundColor: VD.cardBg,
    margin: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: VD.ink,
  },
  sectionDesc: {
    marginTop: 4,
    color: VD.muted,
  },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  badgeWrapper: {
    width: 74,
    alignItems: "center",
  },

  shieldContainer: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  insideContent: {
    position: "absolute",
    top: 13,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  insideLabel: {
    fontSize: 16,
    fontWeight: "700",
  },

  textAchieved: {
    color: "#fff",
  },
  textUnachieved: {
    color: "#aaa",
  },

  stateCard: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: VD.muted,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  retryText: {
    ...TYPOGRAPHY.caption,
    color: VD.accentDark,
  },
  smallIcon: {
    marginTop: 2,
  },
});
