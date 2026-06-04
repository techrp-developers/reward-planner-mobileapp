
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Switch,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import Logo from '../../../assets/menu/logo.png';

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const IOS_FALLBACK_TOP = 50;

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeaderProps {
  userName?: string;
  userImageUri?: string;
  companyLogoUri?: string;
  onNotificationPress?: () => void;
  onAIToggle?: (value: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const HeaderComponent: React.FC<HeaderProps> = ({
  userName = 'User',
  userImageUri,
  companyLogoUri,
  onNotificationPress,
  onAIToggle,
}) => {
  const { isDark, theme, toggleTheme } = useAppTheme();
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0
    ? insets.top
    : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;
  const topPadding = safeTop + 8;

  const gradientColors: string[] = isDark
    ? ['#1A1A2E', '#2D2D44']
    : ['#C8B9FF', '#F0EDFF'];

  const t = useMemo(() => StyleSheet.create({
    gradient:    { paddingTop: topPadding },
    helloText:   { color: isDark ? '#FFFFFF' : '#1A1A2E' },
    nameText:    { color: isDark ? '#FFFFFF' : '#1A1A2E' },
    logoPill:    { backgroundColor: isDark ? '#2D2D44' : '#FFFFFF' },
    aiRow:       { backgroundColor: isDark ? '#2D2D44' : '#FFFFFF', shadowColor: isDark ? '#000000' : '#9B8FCC' },
    aiLabelText: { color: isDark ? '#FFFFFF' : '#1A1A2E' },
    offLabel:    { color: theme.secondaryText },
    avatarRing:  { borderColor: isDark ? '#7C5CFC' : '#7C5CFC', backgroundColor: isDark ? '#2D1F6E' : '#E9E4FF' },
  }), [isDark, theme.secondaryText, topPadding]);

  const handleToggle = (value: boolean) => {
    setAiEnabled(value);
    toggleTheme();
    onAIToggle?.(value);
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.gradient, t.gradient]}
    >
      {/* ── Top Row ── */}
      <View style={styles.topRow}>

        {/* Profile avatar — tapping navigates to Profile screen */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
          style={styles.avatarBtn}
        >
          <View style={[styles.avatarRing, t.avatarRing]}>
            {userImageUri ? (
              <Image
                source={{ uri: userImageUri }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons
                name="account-circle"
                size={30}
                color="#7C5CFC"
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Greeting text */}
        <View style={styles.greetWrap}>
          <Text style={[styles.helloText, t.helloText]}>Hello,</Text>
          <Text style={[styles.nameText, t.nameText]} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        {/* Company logo pill */}
        <View style={[styles.logoPill, t.logoPill]}>
          {companyLogoUri ? (
            <Image
              source={{ uri: companyLogoUri }}
              style={styles.logoImage as ImageStyle}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={Logo}
              style={styles.logoImage as ImageStyle}
              resizeMode="contain"
            />
          )}
        </View>

      </View>

      {/* ── AI Assistant Toggle Row ── */}
      <View style={[styles.aiRow, t.aiRow]}>
        <View style={styles.aiLabelRow}>
          <Text style={styles.sparkleIcon}>✦</Text>
          <Text style={[styles.aiLabelText, t.aiLabelText]}>RP AI Assistant</Text>
        </View>
        <View style={styles.toggleWrapper}>
          {!aiEnabled && <Text style={[styles.offLabel, t.offLabel]}>OFF</Text>}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },

  // ── Profile avatar ──
  avatarBtn: {
    flexShrink: 0,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  // ── Greeting ──
  greetWrap: {
    flex: 1,
  },
  helloText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },

  // ── Logo pill ──
  logoPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoImage: {
    width: 90,
    height: 32,
  },

  // ── AI Toggle ──
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.10)',
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
