/**
 * HeaderComponent.tsx
 *
 * FIX: "Hello, Devashish" was hidden behind the camera notch / Dynamic Island.
 *
 * Root cause: <SafeAreaView flex:0> with the gradient inside it meant the
 * gradient started BELOW the safe area — but on many devices the content
 * still rendered too high because SafeAreaView top inset only applies on iOS
 * and not consistently across Android OEMs.
 *
 * Solution:
 *  1. Remove <SafeAreaView> as the outer wrapper entirely.
 *  2. Use useSafeAreaInsets() from react-native-safe-area-context to read
 *     the exact top inset for the current device (notch / Dynamic Island /
 *     punch-hole / plain status bar).
 *  3. Apply that inset + a small extra breathing room as paddingTop on the
 *     LinearGradient — the gradient now covers the full status bar area
 *     giving the beautiful full-bleed purple look while pushing content
 *     safely below the camera.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Switch,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local logo asset — adjust path to match your project
import Logo from '../../../assets/menu/logo.png';

// Fallback if safe-area-context somehow returns 0
const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const IOS_FALLBACK_TOP = 50; // covers even the Dynamic Island (59 pt safe)

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeaderProps {
  userName?: string;
  companyLogoUri?: string;
  onNotificationPress?: () => void;
  onAIToggle?: (value: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const HeaderComponent: React.FC<HeaderProps> = ({
  userName = 'Devashish',
  companyLogoUri,
  onNotificationPress,
  onAIToggle,
}) => {
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);

  // ── Safe-area top inset ──────────────────────────────────────────────────
  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0
    ? insets.top
    : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;

  // 8 pt extra so content breathes nicely below the camera area
  const topPadding = safeTop + 8;

  const handleToggle = (value: boolean) => {
    setAiEnabled(value);
    onAIToggle?.(value);
  };

  return (
    // The gradient now starts from y=0 (behind the status bar / notch).
    // paddingTop pushes all content below the camera cutout.
    <LinearGradient
      colors={['#C8B9FF', '#F0EDFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradient, { paddingTop: topPadding }]}
    >
      {/* ── Top Row: Greeting | Logo + Bell ── */}
      <View style={styles.topRow}>

        {/* Left — "Hello, \n Devashish" */}
        <View>
          <Text style={styles.helloText}>Hello,</Text>
          <Text style={styles.nameText}>{userName}</Text>
        </View>

        {/* Right — logo pill + bell */}
        <View style={styles.rightBlock}>

          {/* Company logo pill */}
          <View style={styles.logoPill}>
            {companyLogoUri ? (
              <Image
                source={typeof companyLogoUri === 'string' ? { uri: companyLogoUri } : companyLogoUri}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              /* Local PNG asset */
              <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
            )}
          </View>

          {/* Notification bell */}
          <TouchableOpacity
            style={styles.bellWrapper}
            onPress={onNotificationPress}
            activeOpacity={0.75}
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons name="bell" size={18} color="#1A1A2E" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* ── AI Assistant Toggle Row ── */}
      <View style={styles.aiRow}>

        <View style={styles.aiLabelRow}>
          <Text style={styles.sparkleIcon}>✦</Text>
          <Text style={styles.aiLabelText}>RP AI Assistant</Text>
        </View>

        {/* OFF/ON + Switch */}
        <View style={styles.toggleWrapper}>
          {!aiEnabled && <Text style={styles.offLabel}>OFF</Text>}
          <Switch
            value={aiEnabled}
            onValueChange={handleToggle}
            thumbColor="#FFFFFF"
            trackColor={{ false: '#D0CCE8', true: '#7C5CFC' }}
            ios_backgroundColor="#D0CCE8"
            style={styles.switchControl}
          />
          {aiEnabled && <Text style={styles.onLabel}>ON</Text>}
        </View>

      </View>
    </LinearGradient>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  gradient: {
    // paddingTop applied dynamically (topPadding)
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  helloText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#1A1A2E',
    lineHeight: 28,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 28,
  },

  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Logo pill
  logoPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 100,
    height: 36,
  },

  // Bell
  bellWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9B8FCC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 11,
  },

  // ── AI Toggle ──
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.10)',
    shadowColor: '#9B8FCC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 20,
    color: '#7C5CFC',
  },
  aiLabelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
    letterSpacing: -0.1,
  },

  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A0A0B8',
    letterSpacing: 0.5,
  },
  onLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C5CFC',
    letterSpacing: 0.5,
  },
  switchControl: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default HeaderComponent;