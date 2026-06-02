import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { rs, fs } from "../../../utils/responsive";

// ── Types ──────────────────────────────────────────────────────────────────
type HealthStatus = "active" | "resting" | "warning" | "critical";

interface HealthStatusCardProps {
  status?: HealthStatus;
  statusLabel?: string;
  statusDescription?: string;
  badgeLabel?: string;
  onMenuPress?: () => void;
  onNavigate?: () => void;
  cardWidth?: number;
}

// ── ECG waveform path (SVG d attribute, viewport 180×70) ──────────────────
const ECG_PATH =
  "M0,40 L20,40 L28,40 L32,10 L36,55 L40,40 L50,40 " +
  "L58,40 L62,10 L66,55 L70,40 L90,40 " +
  "L98,40 L102,15 L106,60 L110,40 L130,40 " +
  "L136,40 L140,22 L144,52 L148,40 L170,40 " +
  "L178,40 L180,40";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  HealthStatus,
  { color: string; bg: string; label: string; desc: string; badge: string }
> = {
  active:   { color: "#10B981", bg: "#ECFDF5", label: "Active",   desc: "All vitals are stable",        badge: "All systems normal"  },
  resting:  { color: "#10B981", bg: "#ECFDF5", label: "Resting",  desc: "Heart rate is normal",         badge: "All systems normal"  },
  warning:  { color: "#F59E0B", bg: "#FFFBEB", label: "Warning",  desc: "Elevated heart rate detected",  badge: "Monitor closely"     },
  critical: { color: "#EF4444", bg: "#FEF2F2", label: "Critical", desc: "Seek medical attention",       badge: "Alert: check vitals" },
};

// ── Component ──────────────────────────────────────────────────────────────
const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  status = "active",
  statusLabel,
  statusDescription,
  badgeLabel,
  onMenuPress,
  onNavigate,
  cardWidth,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const cWidth = cardWidth ?? (screenWidth - rs(32)) / 2;

  const cfg = STATUS_CONFIG[status];
  const color = cfg.color;
  const bgColor = cfg.bg;
  const label = statusLabel ?? cfg.label;
  const description = statusDescription ?? cfg.desc;
  const badge = badgeLabel ?? cfg.badge;

  // Pulsing ring
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Entrance animation
  const mountAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(mountAnim, {
      toValue: 1,
      duration: 500,
      delay: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [mountAnim]);

  // ECG canvas — width fills card, height scales with screen
  const ecgW = cWidth - rs(28);
  const ecgH = rs(46);
  const scaleX = ecgW / 180;
  const scaleY = ecgH / 70;
  const scaledPath = scalePath(ECG_PATH, scaleX, scaleY);
  const dotX = 180 * scaleX;
  const dotY = 40 * scaleY;
  const dotR = rs(4.5);
  const pulseSize = rs(18);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: mountAnim,
          transform: [{
            translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          }],
        },
      ]}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBubble, { backgroundColor: bgColor }]}>
            <Text style={styles.iconEmoji}>💚</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Health Status</Text>
            <Text style={styles.subtitle}>Latest Update</Text>
          </View>
          <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* ECG Waveform */}
        <View style={[styles.ecgWrapper, { width: ecgW, height: ecgH + rs(8) }]}>
          <Svg width={ecgW} height={ecgH} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.9" />
              </SvgGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map((t, i) => (
              <Rect key={i} x={0} y={ecgH * t} width={ecgW} height={0.5} fill={color} fillOpacity={0.08} />
            ))}
            <Path
              d={scaledPath}
              stroke="url(#ecgGrad)"
              strokeWidth={rs(2.5)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={dotX} cy={dotY} r={dotR} fill={color} />
          </Svg>

          <Animated.View
            style={[
              styles.pulseDot,
              {
                width: pulseSize,
                height: pulseSize,
                borderRadius: pulseSize / 2,
                left: dotX - pulseSize / 2,
                top: dotY - pulseSize / 2,
                borderColor: color,
                transform: [{ scale: pulse }],
              },
            ]}
          />
        </View>

        {/* Status + navigation */}
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Text style={[styles.statusLabel, { color }]}>{label}</Text>
            <Text style={styles.statusDesc}>{description}</Text>
            <View style={[styles.badge, { backgroundColor: bgColor }]}>
              <Text style={[styles.badgeCheck, { color }]}>✓</Text>
              <Text style={[styles.badgeText, { color }]}>{badge}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onNavigate}
            style={[styles.arrowButton, { backgroundColor: bgColor }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.arrowText, { color }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default React.memo(HealthStatusCard);

// ── Helper ─────────────────────────────────────────────────────────────────
function scalePath(d: string, sx: number, sy: number): string {
  return d.replace(/([ML])\s*([\d.]+),([\d.]+)/g, (_m, cmd, x, y) => {
    return `${cmd}${(parseFloat(x) * sx).toFixed(2)},${(parseFloat(y) * sy).toFixed(2)}`;
  });
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardWrapper: { flex: 1 },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: rs(22),
    padding: rs(12),
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: rs(6) },
    shadowOpacity: Platform.OS === "ios" ? 0.14 : 0.22,
    shadowRadius: rs(16),
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.12)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rs(8),
    gap: rs(6),
  },
  iconBubble: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: { fontSize: fs(17) },
  headerText: { flex: 1 },
  title: { fontSize: fs(13), fontWeight: "700", color: "#1A1A2E", letterSpacing: -0.2 },
  subtitle: { fontSize: fs(10), color: "#9CA3AF", marginTop: 1 },
  menuDots: { fontSize: fs(20), color: "#9CA3AF", paddingLeft: rs(4) },

  // ECG
  ecgWrapper: {
    marginBottom: rs(8),
    overflow: "visible",
  },
  pulseDot: {
    position: "absolute",
    borderWidth: rs(2),
    opacity: 0.55,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  statusLeft: {
    flex: 1,
    gap: rs(4),
  },
  statusLabel: {
    fontSize: fs(18),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  statusDesc: {
    fontSize: fs(11),
    color: "#6B7280",
    marginTop: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: rs(20),
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    marginTop: rs(6),
    gap: rs(4),
  },
  badgeCheck: { fontSize: fs(11), fontWeight: "700" },
  badgeText: { fontSize: fs(10), fontWeight: "600" },

  arrowButton: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: { fontSize: fs(18), fontWeight: "700" },
});
