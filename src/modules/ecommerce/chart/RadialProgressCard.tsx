import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle, SvgProps } from "react-native-svg";

/** ✅ Props definition */
interface RadialProgressCardProps {
  percentage?: number;
  mainLabel?: string;
  subLabel?: string;
  color?: string;
  Icon: React.FC<SvgProps>;
  onPress?: () => void;
  cardWidth?: number;
  loading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

function RadialProgressCard({
  percentage = 80,
  mainLabel = "Label",
  subLabel = "Sub Label",
  color = "#4CAF50",
  Icon,
  onPress,
  cardWidth,
  loading = false,
  errorMessage = "",
  onRetry,
}: RadialProgressCardProps) {
  const sizes = useMemo(() => {
    const width = Math.max(132, Math.min(cardWidth ?? 160, 240));
    const height = Math.round(Math.max(82, Math.min(width * 0.5, 110)));
    const circle = Math.round(Math.max(54, Math.min(height * 0.78, 72)));
    const stroke = Math.max(7, Math.round(circle * 0.13));
    const inner = Math.round(circle - stroke * 2.2);
    const icon = Math.round(inner * 0.6);
    const mainFont = width < 150 ? 12 : width > 210 ? 15 : 14;
    const subFont = width < 150 ? 10 : 12;

    return { width, height, circle, stroke, inner, icon, mainFont, subFont };
  }, [cardWidth]);

  const progress = Math.max(0, Math.min(Number(percentage) || 0, 100));
  const radius = (sizes.circle - sizes.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const circleCenter = sizes.circle / 2;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed && onPress ? 0.92 : 1 },
      ]}
    >
      <LinearGradient
        colors={["#FFFFFF", "#FFEADF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, { height: sizes.height }]}
      >
        <View style={styles.leftSection}>
          <View
            style={[
              styles.progressRing,
              {
                width: sizes.circle,
                height: sizes.circle,
                borderRadius: sizes.circle / 2,
              },
            ]}
          >
            <Svg width={sizes.circle} height={sizes.circle}>
              <Circle
                stroke="#E5E7EB"
                fill="none"
                cx={circleCenter}
                cy={circleCenter}
                r={radius}
                strokeWidth={sizes.stroke}
              />
              <Circle
                stroke={color}
                fill="none"
                cx={circleCenter}
                cy={circleCenter}
                r={radius}
                strokeWidth={sizes.stroke}
                strokeLinecap="butt"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${circleCenter}, ${circleCenter}`}
              />
            </Svg>

            <View
              style={[
                styles.innerCircle,
                {
                  width: sizes.inner,
                  height: sizes.inner,
                  borderRadius: sizes.inner / 2,
                },
              ]}
            >
              <Icon width={sizes.icon} height={sizes.icon} />
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : errorMessage ? (
            <>
              <Text
                style={[styles.mainLabel, styles.errorLabel, { fontSize: sizes.mainFont }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                Unavailable
              </Text>
              <Text
                style={[styles.retryLabel, { fontSize: sizes.subFont }]}
                onPress={onRetry}
                numberOfLines={1}
              >
                Retry
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[styles.mainLabel, { color, fontSize: sizes.mainFont }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {mainLabel}
              </Text>
              <Text
                style={[styles.subLabel, { fontSize: sizes.subFont }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {subLabel}
              </Text>
            </>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default React.memo(RadialProgressCard);

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DAD9D9",
    backgroundColor: "#fff",
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  leftSection: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  rightSection: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
    justifyContent: "center",
  },
  progressRing: {
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    position: "absolute",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  mainLabel: {
    fontWeight: "700",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  subLabel: {
    color: "#555",
    marginTop: 3,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  errorLabel: {
    color: "#EF4444",
  },
  retryLabel: {
    color: "#714DF5",
    fontWeight: "700",
    marginTop: 3,
    includeFontPadding: false,
  },
});
