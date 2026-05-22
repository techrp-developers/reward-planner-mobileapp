import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Share,
  Platform,
  ViewStyle,
} from "react-native";
import { SvgProps } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import type { GoalSyncData, UnlockedAchievement } from "../../api/Stepsapi";

// ─── SVG Imports ─────────────────────────────────────────────────────────────
import Walking_Enthusiast from "../../assets/StepCount/Walking_Enthusiast.svg";
import Streak_Keeper from "../../assets/StepCount/Streak_Keeper.svg";
import Trailblazer from "../../assets/StepCount/Trailblazer.svg";
import Sunrise_Strider from "../../assets/StepCount/Sunrise_Strider.svg";

import icon_Walking_Enthusiast from "../../assets/StepCount/Achivement_icon(2).svg";
import icon_Streak_Keeper from "../../assets/StepCount/Achivement_icon(3).svg";
import icon_Trailblazer from "../../assets/StepCount/Achivement_icon(4).svg";
import icon_Sunrise_Strider from "../../assets/StepCount/Achivement_icon(1).svg";

// ─── Types ───────────────────────────────────────────────────────────────────
export type AchievementCategory = "walking" | "streak" | "trail" | "sunrise";

type Props = NativeStackScreenProps<FitnessStackParamList, "GoalCelebrationScreen">;

// ─── Constants ───────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COUNT = 40;
const BLAST_COUNT = 24;

const ACHIEVEMENT_CONFIG: Record<
  AchievementCategory,
  {
    BadgeSvg: React.FC<SvgProps>;
    IconSvg: React.FC<SvgProps>;
    label: string;
    gradient: [string, string];
    headline: string;
    subtext: (steps: number) => string;
  }
> = {
  walking: {
    BadgeSvg: Walking_Enthusiast,
    IconSvg: icon_Walking_Enthusiast,
    label: "WALKING ENTHUSIAST",
    gradient: ["#C4A8F8", "#9B6FF5"],
    headline: "Great pace! You logged amazing steps today",
    subtext: (steps) => `You've walked ${steps.toLocaleString()} steps.`,
  },
  streak: {
    BadgeSvg: Streak_Keeper,
    IconSvg: icon_Streak_Keeper,
    label: "STREAK KEEPER",
    gradient: ["#FFD57A", "#FFA73B"],
    headline: "Your {streak}-day streak has been successfully completed",
    subtext: () => "",
  },
  trail: {
    BadgeSvg: Trailblazer,
    IconSvg: icon_Trailblazer,
    label: "TRAILBLAZER",
    gradient: ["#FF8ED4", "#FF4FB8"],
    headline: "Awesome walk! You explored new ground today",
    subtext: (steps) => `You've walked ${steps.toLocaleString()} steps.`,
  },
  sunrise: {
    BadgeSvg: Sunrise_Strider,
    IconSvg: icon_Sunrise_Strider,
    label: "SUNRISE STRIDER",
    gradient: ["#BFEF5E", "#7BC720"],
    headline: "Early mover! You kicked off the day with strong steps",
    subtext: (steps) => `You've walked ${steps.toLocaleString()} steps.`,
  },
};

const CONFETTI_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
  "#98D8C8", "#F7DC6F", "#BB8FCE", "#52BE80",
  "#F1948A", "#5DADE2",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectCategory(response: GoalSyncData, index: number): AchievementCategory {
  const achievement = response.unlockedAchievements?.[index];
  if (!achievement) return "walking";
  const type = (achievement.type ?? "").toLowerCase();
  const title = (achievement.title ?? "").toLowerCase();
  if (type === "streak" || title.includes("streak")) return "streak";
  if (title.includes("trail") || title.includes("explore")) return "trail";
  if (title.includes("sunrise") || title.includes("early") || title.includes("morning")) return "sunrise";
  return "walking";
}

function formatBadgeValue(achievement: UnlockedAchievement | undefined, streak: number | undefined): string {
  if (!achievement) return "";
  const title = achievement.title ?? "";
  const match = title.match(/(\d+\.?\d*[kK]?)/);
  if (match) return match[1].toUpperCase();
  if (streak !== undefined && streak > 0) return `${streak}`;
  return title;
}

// ─── Confetti Particle ────────────────────────────────────────────────────────
const ConfettiParticle: React.FC<{ delay: number; color: string; x: number }> = ({
  delay,
  color,
  x,
}) => {
  const particle = useRef({
    size:      6 + Math.random() * 8,
    isRect:    Math.random() > 0.5,
    duration:  2000 + Math.random() * 1000,
    spinDir:   Math.random() > 0.5 ? 720 : -720,
  }).current;

  const translateYRef = useRef(new Animated.Value(-20));
  const opacityRef   = useRef(new Animated.Value(0));
  const rotateRef    = useRef(new Animated.Value(0));

  const translateY = translateYRef.current;
  const opacity    = opacityRef.current;
  const rotate     = rotateRef.current;

  const staticStyle = useRef<ViewStyle>({
    position:        "absolute",
    top:             0,
    left:            x,
    width:           particle.isRect ? particle.size * 0.6 : particle.size,
    height:          particle.isRect ? particle.size * 1.6 : particle.size,
    borderRadius:    particle.isRect ? 2 : particle.size / 2,
    backgroundColor: color,
  }).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT * 0.55, duration: particle.duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: particle.duration, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, rotate, translateY, particle.duration]);

  const spin = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", `${particle.spinDir}deg`],
  });

  return (
    <Animated.View
      style={[staticStyle, { opacity, transform: [{ translateY }, { rotate: spin }] }]}
    />
  );
};

// ─── Blast Particle ───────────────────────────────────────────────────────────
const BlastParticle: React.FC<{ angle: number; delay: number; color: string }> = ({
  angle,
  delay,
  color,
}) => {
  const progressRef = useRef(new Animated.Value(0));
  const progress    = progressRef.current;

  const blast = useRef({
    distance: 90 + Math.random() * 60,
    size:     5 + Math.random() * 7,
  }).current;

  const radians = (angle * Math.PI) / 180;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue:  1,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, progress]);

  const translateX = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.cos(radians) * blast.distance],
  });
  const translateY = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.sin(radians) * blast.distance],
  });
  const scale = progress.interpolate({
    inputRange:  [0, 0.25, 1],
    outputRange: [0, 1.4,  0],
  });
  const opacity = progress.interpolate({
    inputRange:  [0, 0.15, 0.75, 1],
    outputRange: [0, 1,    1,    0],
  });

  const blastStyle = useRef<ViewStyle>({
    position:        "absolute",
    width:           blast.size,
    height:          blast.size,
    borderRadius:    blast.size / 2,
    backgroundColor: color,
  }).current;

  return (
    <Animated.View
      style={[blastStyle, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
    />
  );
};

// ─── Ring Pulse ───────────────────────────────────────────────────────────────
const RingPulse: React.FC = () => {
  const scaleRef   = useRef(new Animated.Value(0.5));
  const opacityRef = useRef(new Animated.Value(0.8));

  const scale   = scaleRef.current;
  const opacity = opacityRef.current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue:  2.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:  0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[styles.ring, { opacity, transform: [{ scale }] }]}
      pointerEvents="none"
    />
  );
};

// ─── Blast Effect ─────────────────────────────────────────────────────────────
const BlastEffect: React.FC = () => (
  <View style={styles.blastContainer} pointerEvents="none">
    {Array.from({ length: BLAST_COUNT }).map((_, i) => (
      <BlastParticle
        key={i}
        angle={(360 / BLAST_COUNT) * i}
        delay={i * 12}
        color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
      />
    ))}
  </View>
);

// ─── Stats Row ────────────────────────────────────────────────────────────────
const StatsRow: React.FC<{ summary: NonNullable<GoalSyncData["overallSummary"]> }> = ({ summary }) => {
  const stats = [
    { icon: "👣", label: "Steps",    value: summary.steps.toLocaleString() },
    { icon: "🔥", label: "Calories", value: `${summary.calories}` },
    { icon: "📍", label: "Distance", value: `${summary.distance_km} km` },
    { icon: "⏱️", label: "Active",   value: `${summary.active_minutes} min` },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((stat, i) => (
        <View key={i} style={styles.statItem}>
          <Text style={styles.statIcon}>{stat.icon}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Achievement Card ─────────────────────────────────────────────────────────
const AchievementCard: React.FC<{
  response: GoalSyncData;
  achievementIndex: number;
  onShare: () => void;
  onNext: () => void;
  isLast: boolean;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
  showBlast: boolean;
}> = ({ response, achievementIndex, onShare, onNext, isLast, scaleAnim, fadeAnim, showBlast }) => {
  const category    = detectCategory(response, achievementIndex);
  const config      = ACHIEVEMENT_CONFIG[category];
  const achievement = response.unlockedAchievements?.[achievementIndex];
  const badgeValue  = formatBadgeValue(achievement, response.currentStreak);
  const steps       = response.overallSummary?.steps ?? 0;

  const headline =
    category === "streak"
      ? config.headline.replace("{streak}", String(response.currentStreak ?? 0))
      : config.headline;

  const { BadgeSvg } = config;

  return (
    <Animated.View
      style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerDividerLeft} />
        <Text style={styles.categoryLabel}>{config.label}</Text>
        <View style={styles.headerDividerRight} />
      </View>

      <View style={styles.confettiContainer} pointerEvents="none">
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiParticle
            key={i}
            delay={i * 40}
            color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
            x={Math.random() * SCREEN_WIDTH * 0.85}
          />
        ))}
      </View>

      <View style={styles.badgeWrapper}>
        {showBlast && <BlastEffect />}
        <RingPulse />
        <BadgeSvg width={190} height={210} />
        <View style={styles.badgeOverlay}>
          <Text style={styles.badgeValue}>{badgeValue}</Text>
        </View>
      </View>

      <Text style={styles.headline}>{headline}</Text>

      {config.subtext(steps) !== "" && (
        <Text style={styles.subtext}>
          You've walked{" "}
          <Text style={styles.subtextHighlight}>{steps.toLocaleString()} steps.</Text>
        </Text>
      )}

      {achievement && (
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>🪙 +{achievement.reward_coins} coins earned!</Text>
        </View>
      )}

      {response.overallSummary && <StatsRow summary={response.overallSummary} />}

      <View style={styles.shareSection}>
        <View style={styles.shareDivider} />
        <Text style={styles.shareLabel}>Share</Text>
        <View style={styles.shareDivider} />
      </View>
      <View style={styles.socialRow}>
        {[
          { platform: "instagram", emoji: "📸", bg: "#E1306C" },
          { platform: "whatsapp",  emoji: "💬", bg: "#25D366" },
          { platform: "x",         emoji: "✕",  bg: "#000000" },
          { platform: "facebook",  emoji: "f",  bg: "#1877F2" },
        ].map((s) => (
          <TouchableOpacity
            key={s.platform}
            style={[styles.socialBtn, { backgroundColor: s.bg }]}
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIcon}>{s.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.ctaBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>{isLast ? "Awesome! 🎉" : "Next Achievement →"}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const GoalCelebrationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { response } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBlast, setShowBlast] = useState(true);

  const scaleAnimRef  = useRef(new Animated.Value(0.7));
  const fadeAnimRef   = useRef(new Animated.Value(0));
  const bgOpacityRef  = useRef(new Animated.Value(0));

  const scaleAnim = scaleAnimRef.current;
  const fadeAnim  = fadeAnimRef.current;
  const bgOpacity = bgOpacityRef.current;

  const achievements = response.unlockedAchievements ?? [];
  const total        = Math.max(achievements.length, 1);

  const animateIn = useCallback(() => {
    scaleAnim.setValue(0.75);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 7, tension: 60, useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  useEffect(() => {
    Animated.timing(bgOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
    animateIn();
  }, [bgOpacity, animateIn]);

  const navigateForward = useCallback(() => {
    if (response.planOverview && response.overallSummary) {
      navigation.navigate("TodayGoalCompletedScreen", {
        planOverview:   response.planOverview,
        overallSummary: response.overallSummary,
        currentStreak:  response.currentStreak ?? 0,
        reward:         response.reward,
      });
    } else {
      navigation.replace("Dashboard");
    }
  }, [navigation, response]);

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setShowBlast(false);
      Animated.timing(fadeAnim, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((p) => p + 1);
        setShowBlast(true);
        animateIn();
      });
    } else {
      navigateForward();
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: "I just hit my step goal! 🎉 Check out my achievement on the app!" });
    } catch {
      // share cancelled — no-op
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {total > 1 && (
          <View style={styles.dotsRow}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        <AchievementCard
          response={response}
          achievementIndex={currentIndex}
          onShare={handleShare}
          onNext={handleNext}
          isLast={currentIndex === total - 1}
          scaleAnim={scaleAnim}
          fadeAnim={fadeAnim}
          showBlast={showBlast}
        />

        <View style={styles.totalRewardRow}>
          <Text style={styles.totalRewardText}>
            Total reward today:{" "}
            <Text style={styles.totalRewardCoins}>🪙 {response.reward} coins</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.replace("Dashboard")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

export default GoalCelebrationScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(230, 233, 248, 0.97)",
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  dotsRow: { flexDirection: "row", marginBottom: 12, gap: 6 },
  dot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: "#C5C9E3" },
  dotActive: { backgroundColor: "#6B6FD8", width: 20 },

  card: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#8B90CC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },

  cardHeader:        { flexDirection: "row", alignItems: "center", marginBottom: 8, width: "100%" },
  headerDividerLeft: { flex: 1, height: 1, backgroundColor: "#E0E3F0", marginRight: 10 },
  headerDividerRight:{ flex: 1, height: 1, backgroundColor: "#E0E3F0", marginLeft: 10 },
  categoryLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.5,
    color: "#7B80B0", textTransform: "uppercase",
  },

  confettiContainer: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 300, zIndex: 0,
  },

  blastContainer: {
    position: "absolute",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  ring: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#9B6FF5",
    alignSelf: "center",
  },

  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    zIndex: 1,
  },
  badgeOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 0,
    bottom: 30,
    left: 0,
    right: 0,
  },
  badgeValue: {
    fontSize: 36, fontWeight: "900", color: "#FFFFFF",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  headline: {
    fontSize: 20, fontWeight: "700", color: "#1A1D3A",
    textAlign: "center", lineHeight: 28, marginBottom: 8, letterSpacing: -0.2,
  },
  subtext: { fontSize: 14, color: "#7B80B0", textAlign: "center", marginBottom: 12 },
  subtextHighlight: { color: "#E05A7A", fontWeight: "700" },

  rewardBadge: {
    backgroundColor: "#FFF8E6", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "#FFD97A", marginBottom: 16,
  },
  rewardText: { fontSize: 13, fontWeight: "700", color: "#C07A00" },

  statsRow: {
    flexDirection: "row", justifyContent: "space-around", width: "100%",
    backgroundColor: "#F5F6FD", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 8, marginBottom: 20,
  },
  statItem:  { alignItems: "center", flex: 1 },
  statIcon:  { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: "800", color: "#1A1D3A", letterSpacing: -0.3 },
  statLabel: {
    fontSize: 10, color: "#9195BB", fontWeight: "600",
    letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2,
  },

  shareSection: { flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 14 },
  shareDivider: { flex: 1, height: 1, backgroundColor: "#E8EAF5" },
  shareLabel:   { fontSize: 12, color: "#9195BB", fontWeight: "600", marginHorizontal: 12, letterSpacing: 0.5 },
  socialRow:    { flexDirection: "row", gap: 12, marginBottom: 20 },
  socialBtn:    { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  socialIcon:   { fontSize: 18, color: "#FFFFFF" },

  ctaBtn: {
    backgroundColor: "#4E54D4", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 40,
    width: "100%", alignItems: "center",
    shadowColor: "#4E54D4", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },

  totalRewardRow: {
    marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12,
    width: SCREEN_WIDTH - 40, alignItems: "center",
    shadowColor: "#8B90CC", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  totalRewardText:  { fontSize: 14, color: "#6B6FD8", fontWeight: "600" },
  totalRewardCoins: { fontWeight: "800", color: "#C07A00" },
  skipBtn:  { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20 },
  skipText: { fontSize: 13, color: "#9195BB", fontWeight: "500" },
});
