import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { fs, rs } from "../../../utils/responsive";
import { useAppTheme } from "../../../theme/ThemeContext";

interface PaymentsQuickAccessCardProps {
  onMenuPress?: () => void;
  onOpenPayments?: () => void;
  onOpenBills?: () => void;
  onOpenHistory?: () => void;
  cardWidth?: number;
}

type QuickAction = {
  title: string;
  subtitle: string;
  icon: string;
  label?: string;
  onPress?: () => void;
};

const PaymentsQuickAccessCard: React.FC<PaymentsQuickAccessCardProps> = ({
  onMenuPress,
  onOpenPayments,
  onOpenBills,
  onOpenHistory,
}) => {
  const { isDark, theme } = useAppTheme();
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

  const actions = useMemo<QuickAction[]>(
    () => [
      {
        title: "UPI Payments",
        subtitle: "Pay instantly using UPI",
        icon: "contactless-payment",
        label: "UPI",
        onPress: onOpenPayments,
      },
      {
        title: "Bills & Recharges",
        subtitle: "Pay your bills and recharge anytime",
        icon: "receipt-text-outline",
        onPress: onOpenBills,
      },
      {
        title: "Recent Transaction",
        subtitle: "No recent transactions",
        icon: "clock-time-four-outline",
        onPress: onOpenHistory,
      },
    ],
    [onOpenBills, onOpenHistory, onOpenPayments],
  );

  const t = useMemo(
    () => ({
      card: {
        backgroundColor: theme.card,
        shadowColor: isDark ? "#000000" : "#2563EB",
      } as ViewStyle,
      title: { color: theme.text } as TextStyle,
      subtitle: { color: theme.secondaryText } as TextStyle,
      menuDots: { color: theme.secondaryText } as TextStyle,
      actionCard: {
        backgroundColor: isDark ? "rgba(124, 58, 237, 0.16)" : "#F5F3FF",
        borderColor: isDark ? "rgba(196, 181, 253, 0.14)" : "rgba(124, 58, 237, 0.12)",
      } as ViewStyle,
      actionTitle: { color: theme.text } as TextStyle,
      actionSubtitle: { color: theme.secondaryText } as TextStyle,
    }),
    [isDark, theme],
  );

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
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
      <View style={[styles.card, t.card]}>
        <View style={styles.header}>
          <LinearGradient
            colors={["#2563EB", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBubble}
          >
            <MaterialCommunityIcons name="wallet-outline" size={rs(19)} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.title, t.title]} numberOfLines={1}>
              Payments
            </Text>
            <Text style={[styles.subtitle, t.subtitle]} numberOfLines={1}>
              Quick Access
            </Text>
          </View>
          <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Text style={[styles.menuDots, t.menuDots]}>{"\u22EE"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionList}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={[styles.actionCard, t.actionCard]}
              onPress={action.onPress}
              activeOpacity={0.86}
            >
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, t.actionTitle]} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, t.actionSubtitle]} numberOfLines={2}>
                  {action.subtitle}
                </Text>
              </View>
              {action.label ? (
                <Text style={styles.actionLabel}>{action.label}</Text>
              ) : (
                <MaterialCommunityIcons name={action.icon} size={rs(23)} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onOpenPayments} activeOpacity={0.88}>
          <LinearGradient
            colors={["#2563EB", "#3B5BFF"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText} numberOfLines={1}>
              Make a Payment
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={rs(22)} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default React.memo(PaymentsQuickAccessCard);

const styles = StyleSheet.create({
  cardWrapper: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: rs(22),
    padding: rs(12),
    shadowOffset: { width: 0, height: rs(6) },
    shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.28,
    shadowRadius: rs(16),
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.16)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    marginBottom: rs(10),
  },
  iconBubble: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: fs(10),
    marginTop: 1,
    letterSpacing: 0,
  },
  menuDots: {
    fontSize: fs(20),
    paddingLeft: rs(4),
  },
  actionList: {
    gap: rs(6),
    marginBottom: rs(8),
  },
  actionCard: {
    minHeight: rs(38),
    borderRadius: rs(12),
    borderWidth: 1,
    paddingHorizontal: rs(9),
    paddingVertical: rs(7),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fs(10.5),
    fontWeight: "800",
    letterSpacing: 0,
  },
  actionSubtitle: {
    fontSize: fs(8.5),
    lineHeight: rs(12),
    marginTop: 1,
    letterSpacing: 0,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: fs(15),
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 0,
  },
  cta: {
    minHeight: rs(36),
    borderRadius: rs(18),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: rs(12),
    gap: rs(8),
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: fs(11),
    fontWeight: "800",
    letterSpacing: 0,
  },
});
