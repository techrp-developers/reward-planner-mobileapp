import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '../../../i18n/resources';
import React, { useState } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";
import Logo from "../../../assets/menu/logo.png";
import {
  declinePermissionPrompt,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "./pushPermission";

const BRAND_GRADIENT = ["#FC8BAD", "#A654CD"];

const BENEFITS: Array<{ icon: string; text: TranslationKey<'notifications'> }> = [
  { icon: "package-variant-closed", text: "orderBenefits" },
  { icon: "gift-outline", text: "rewardBenefits" },
  { icon: "message-text-outline", text: "messageBenefits" },
];

type Props = {
  visible: boolean;
  onDone: (state: NotificationPermissionState) => void;
};

// Our own explanation, shown once before the real Android permission dialog.
// It never imitates the system dialog: "Enable Notifications" hands over to
// Android, and offers stay off until the user opts in from Notification settings.
export function NotificationPermissionPrompt({ visible, onDone }: Props) {
  const { t: translateUi } = useTranslation('common');
  const { isDark, theme } = useAppTheme();
  const [busy, setBusy] = useState(false);

  const finish = async (action: () => Promise<NotificationPermissionState>) => {
    if (busy) return;
    setBusy(true);
    let state: NotificationPermissionState = "denied";
    try {
      state = await action();
    } finally {
      setBusy(false);
      onDone(state);
    }
  };

  const enable = () => finish(requestNotificationPermission);
  const notNow = () =>
    finish(async () => {
      await declinePermissionPrompt();
      return "denied";
    });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={notNow}>
      <View style={styles.overlay}>
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />

          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bell}>
            <MaterialCommunityIcons name="bell-ring-outline" size={38} color="#FFFFFF" />
          </LinearGradient>

          <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
            {translateUi('notifications:stayUpdated')}
          </Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>
            {translateUi('notifications:promptDescription')}
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map(benefit => (
              <View key={benefit.text} style={styles.benefitRow}>
                <MaterialCommunityIcons name={benefit.icon} size={18} color="#A654CD" />
                <Text style={[styles.benefitText, { color: theme.text }]}>{translateUi(`notifications:${benefit.text}`)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            onPress={enable}
            activeOpacity={0.85}
            style={styles.primaryWrap}
          >
            <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary}>
              <Text style={styles.primaryText}>{translateUi('notifications:enable')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={notNow} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: theme.secondaryText }]}>{translateUi('notifications:notNow')}</Text>
          </TouchableOpacity>

          <Text style={[styles.footnote, { color: theme.secondaryText }]}>
            {translateUi('notifications:offersOptIn')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
  },
  cardDark: {
    backgroundColor: "#18181B",
  },
  logo: {
    width: 44,
    height: 44,
    marginBottom: 14,
  },
  bell: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  benefits: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryWrap: {
    alignSelf: "stretch",
  },
  primary: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  footnote: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 2,
  },
});
