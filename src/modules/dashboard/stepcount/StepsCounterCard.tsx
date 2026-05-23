import React, { useMemo, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Dimensions,
    Animated,
    Easing,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

// ── Types ──────────────────────────────────────────────────────────────────
interface StepsCounterCardProps {
    steps?: number;
    goalSteps?: number;
    progressPercent?: number;
    stepsToday?: number;
    onMenuPress?: () => void;
    onPress?: () => void;
    loading?: boolean;
    cardWidth?: number;
}

// ── Daily activity sparkline heights ──────────────────────────────────────
const DAILY_BARS = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.5, 0.8, 0.65, 0.4, 0.75, 0.55];
const ACTIVE_BAR_INDEX = DAILY_BARS.length - 3;

// Precomputed per-bar heights so no inline style at render time
const BAR_HEIGHTS = DAILY_BARS.map((h, i) => ({
    height: h * 20,
    opacity: i === ACTIVE_BAR_INDEX ? 1 : 0.5 + h * 0.35,
    active: i === ACTIVE_BAR_INDEX,
}));

// ── Component ──────────────────────────────────────────────────────────────
const StepsCounterCard: React.FC<StepsCounterCardProps> = ({
    steps = 4820,
    goalSteps = 7000,
    progressPercent,
    stepsToday = 320,
    onMenuPress,
    onPress,
    loading = false,
    cardWidth,
}) => {
    const screenWidth = Dimensions.get("window").width;
    const cWidth = cardWidth ?? (screenWidth - 32) / 2;

    const progress = useMemo(() => {
        if (progressPercent !== undefined) return Math.max(0, Math.min(progressPercent, 100));
        return goalSteps > 0 ? Math.max(0, Math.min((steps / goalSteps) * 100, 100)) : 0;
    }, [steps, goalSteps, progressPercent]);

    // Ring geometry — capped smaller so card height stays compact
    const ringSize = Math.min(cWidth * 0.54, 60);
    const strokeWidth = ringSize * 0.1;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const center = ringSize / 2;

    const goalPercent = Math.round(progress);

    // Card entrance animation
    const mountAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const anim = Animated.timing(mountAnim, {
            toValue: 1,
            duration: 500,
            delay: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        });
        anim.start();
        return () => anim.stop();
    }, [mountAnim]);

    return (
        <Animated.View
            style={[
                styles.touchable,
                {
                    opacity: mountAnim,
                    transform: [
                        {
                            translateY: mountAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [12, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.92 : 1} style={styles.touchableInner}>
                <View style={styles.card}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <View style={styles.iconBubble}>
                            <Text style={styles.iconEmoji}>👣</Text>
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title} numberOfLines={1}>Steps Counter</Text>
                            <Text style={styles.subtitle}>Today's Progress</Text>
                        </View>
                        <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <Text style={styles.menuDots}>⋮</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Body: ring + stats ── */}
                    <View style={styles.body}>
                        {/* Radial ring */}
                        <View style={[styles.ringWrapper, { width: ringSize, height: ringSize }]}>
                            <Svg width={ringSize} height={ringSize}>
                                <Defs>
                                    <SvgGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor="#F0429F" />
                                        <Stop offset="100%" stopColor="#7C3AED" />
                                    </SvgGradient>
                                </Defs>
                                {/* Track */}
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    stroke="#F0E6FF"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                />
                                {/* Progress arc */}
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    stroke="url(#progressGrad)"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    transform={`rotate(-90, ${center}, ${center})`}
                                />
                            </Svg>

                            {/* Center labels */}
                            <View style={styles.ringCenter}>
                                <Text style={[styles.stepsValue, { fontSize: ringSize * 0.18 }]}>
                                    {steps.toLocaleString("en-IN")}
                                </Text>
                                <Text style={styles.goalLabel}>/ {goalSteps.toLocaleString("en-IN")}</Text>
                                <Text style={styles.stepsWord}>Steps</Text>
                            </View>
                        </View>

                        {/* Right stats column */}
                        <View style={styles.statsColumn}>
                            <View style={styles.stepsUpRow}>
                                <View style={styles.arrowBubble}>
                                    <Text style={styles.arrowText}>↑</Text>
                                </View>
                                <View>
                                    <Text style={styles.stepsUpValue}>+{stepsToday}</Text>
                                    <Text style={styles.stepsUpSub}>steps today</Text>
                                </View>
                            </View>

                            <View style={styles.goalBadge}>
                                <Text style={styles.goalBadgeText}>{goalPercent}% of goal</Text>
                            </View>

                        </View>

                    </View>
                    <View style={styles.barsWrapper}>
                        {BAR_HEIGHTS.map((bar, i) => (
                            <LinearGradient
                                key={i}
                                colors={bar.active ? ["#F0429F", "#C026A8"] : ["#F8BCDB", "#F3D0E8"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={[styles.bar, { height: bar.height, opacity: bar.opacity }]}
                            />
                        ))}
                    </View>
                    <Text style={styles.barsLabel}>Daily Activity</Text>

                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default React.memo(StepsCounterCard);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    touchable: {
        flex: 1,
    },
    touchableInner: {
        flex: 1,
    },
    card: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 12,
        shadowColor: "#9B3DD8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.28,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: "rgba(200, 180, 255, 0.2)",

    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
        gap: 6,
    },
    iconBubble: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "#FFF0F7",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(240, 66, 159, 0.1)",
    },
    iconEmoji: { fontSize: 17 },
    headerText: { flex: 1 },
    title: {
        fontSize: 13.5,
        fontWeight: "700",
        color: "#1A1A2E",
        letterSpacing: -0.2,
    },
    subtitle: { fontSize: 10.5, color: "#9CA3AF", marginTop: 1 },
    menuDots: { fontSize: 20, color: "#C4B5FD", paddingLeft: 4 },

    // Body
    body: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    // Ring
    ringWrapper: {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    ringCenter: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    stepsValue: {
        fontWeight: "800",
        color: "#1A1A2E",
        includeFontPadding: false,
        letterSpacing: -0.5,
    },
    goalLabel: { fontSize: 10, color: "#9CA3AF", marginTop: 1 },
    stepsWord: { fontSize: 10, color: "#A855F7", fontWeight: "600", marginTop: 1 },

    // Right stats
    statsColumn: {
        flex: 1,
        alignItems: "flex-start",
        gap: 5,
    },
    stepsUpRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    arrowBubble: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#FFF0F7",
        alignItems: "center",
        justifyContent: "center",
    },
    arrowText: { fontSize: 12, color: "#F0429F", fontWeight: "700" },
    stepsUpValue: { fontSize: 12, fontWeight: "700", color: "#F0429F" },
    stepsUpSub: { fontSize: 9.5, color: "#9CA3AF" },

    goalBadge: {
        backgroundColor: "#FEE2F0",
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: "rgba(240, 66, 159, 0.14)",
    },
    goalBadgeText: { fontSize: 10.5, fontWeight: "700", color: "#E0348A" },

    // Sparkline bars
     barsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",

    alignSelf: "center",

    height: 30,

    marginTop: 14,
    marginBottom: 5,

    gap: 3,
  },

  bar: {
    width: 5,
    borderRadius: 20,

    minHeight: 4,
  },

  barsLabel: {
    textAlign: "center",

    fontSize: 10,
    color: "#9CA3AF",

    fontWeight: "600",
  },
});

