import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Logo from "../../../../assets/menu/logo.png";

import { BiometricService, BiometricType } from '../services/BiometricService';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState =
  | 'idle'
  | 'authenticating'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'lockout';

export type BiometricLockScreenProps = {
  visible: boolean;
  onSuccess: () => void;
  onUseFallback?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iconForType = (type: BiometricType): string => {
  if (type === 'FaceID') return 'face-recognition';
  if (type === 'TouchID') return 'fingerprint';
  if (Platform.OS === 'android') return 'fingerprint';
  return 'shield-lock-outline';
};

const labelForType = (type: BiometricType): string => {
  if (type === 'FaceID') return 'Face ID';
  if (type === 'TouchID') return 'Touch ID';
  if (Platform.OS === 'android') return 'Fingerprint / Face Unlock';
  return 'Biometrics';
};

const promptReasonForType = (type: BiometricType): string => {
  if (type === 'FaceID') return 'Use Face ID to access your account';
  return 'Place your finger to access your account';
};

// ─── GlowOrb ─────────────────────────────────────────────────────────────────

type GlowOrbProps = {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  opacity?: number;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GlowOrb({ color, size, top, bottom, left, right, opacity = 0.35 }: GlowOrbProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glowOrb,
        { width: size, height: size, borderRadius: size / 2, top, bottom, left, right, opacity },
        { backgroundColor: color, transform: [{ scale: pulse }] },
      ]}
    />
  );
}

// ─── PulseRing ────────────────────────────────────────────────────────────────

function PulseRing({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      scale.setValue(1);
      ringOpacity.setValue(0.6);
      loopRef.current = Animated.loop(
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.2,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      scale.setValue(1);
      ringOpacity.setValue(0);
    }
  }, [active, scale, ringOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity: ringOpacity },
      ]}
    />
  );
}

// ─── BiometricLockScreen ──────────────────────────────────────────────────────

export default function BiometricLockScreen({
  visible,
  onSuccess,
  onUseFallback,
}: BiometricLockScreenProps) {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [biometricType, setBiometricType] = useState<BiometricType>('none');

  const isAuthingRef = useRef(false);
  const autoTriggerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entry animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale   = useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(20)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const btnScale    = useRef(new Animated.Value(0.85)).current;
  const iconBounce  = useRef(new Animated.Value(1)).current;

  const runEntryAnimation = useCallback(() => {
    logoOpacity.setValue(0);
    logoScale.setValue(0.7);
    iconOpacity.setValue(0);
    iconScale.setValue(0.6);
    textOpacity.setValue(0);
    textY.setValue(20);
    btnOpacity.setValue(0);
    btnScale.setValue(0.85);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(textY,      { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, iconOpacity, iconScale, textOpacity, textY, btnOpacity, btnScale]);

  const bounceIcon = useCallback(() => {
    Animated.sequence([
      Animated.timing(iconBounce, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.spring(iconBounce, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
  }, [iconBounce]);

  const triggerAuth = useCallback(async () => {
    if (isAuthingRef.current) return;
    isAuthingRef.current = true;
    setAuthState('authenticating');
    bounceIcon();

    const { available, biometryType } = await BiometricService.getStatus();

    if (!available) {
      isAuthingRef.current = false;
      setAuthState('idle');
      onUseFallback?.();
      return;
    }

    setBiometricType(biometryType);
    const result = await BiometricService.authenticate(promptReasonForType(biometryType));
    isAuthingRef.current = false;

    if (result.success) {
      setAuthState('success');
      setTimeout(onSuccess, 300);
      return;
    }

    const err = result.error;
    if (err === 'cancelled')    setAuthState('cancelled');
    else if (err === 'lockout') setAuthState('lockout');
    else if (err === 'unavailable') { setAuthState('idle'); onUseFallback?.(); }
    else                        setAuthState('failed');
  }, [bounceIcon, onSuccess, onUseFallback]);

  // On mount/visible: load biometric type + auto-trigger after 700ms
  useEffect(() => {
    if (!visible) {
      if (autoTriggerRef.current) clearTimeout(autoTriggerRef.current);
      isAuthingRef.current = false;
      setAuthState('idle');
      return;
    }

    runEntryAnimation();

    BiometricService.getStatus().then(({ biometryType }) => {
      setBiometricType(biometryType);
    });

    autoTriggerRef.current = setTimeout(() => {
      triggerAuth();
    }, 700);

    return () => {
      if (autoTriggerRef.current) clearTimeout(autoTriggerRef.current);
    };
  }, [visible, runEntryAnimation, triggerAuth]);

  const isScanning = authState === 'authenticating';

  const statusMessage: Record<AuthState, string | null> = {
    idle:          null,
    authenticating: 'Scanning…',
    success:       'Authenticated',
    failed:        'Authentication failed. Please try again.',
    cancelled:     'Cancelled. Tap the icon to try again.',
    lockout:       'Too many attempts. Use your password.',
  };

  const iconColor: Record<AuthState, string> = {
    idle:          '#F472B6',
    authenticating: '#C084FC',
    success:       '#34D399',
    failed:        '#F87171',
    cancelled:     '#CBD5E1',
    lockout:       '#F87171',
  };

  const canRetry = authState === 'failed' || authState === 'cancelled' || authState === 'idle';
  const isLockout = authState === 'lockout';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      transparent={false}
    >
      <LinearGradient
        colors={['#050716', '#0B1027', '#17102F']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.root}
      >
        <View pointerEvents="none" style={[styles.ambientPanel, styles.panelTop]} />
        <View pointerEvents="none" style={[styles.ambientPanel, styles.panelBottom]} />
        <View pointerEvents="none" style={styles.gridOverlay} />

        {/* Logo area */}
        <Animated.View
          style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        >
          <LinearGradient
            colors={['#FDF7FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
          </LinearGradient>
          <Text style={styles.appName}>Reward Planner</Text>
          <Text style={styles.lockLabel}>Secure access</Text>
        </Animated.View>

        {/* Biometric icon */}
        <Animated.View
          style={[styles.iconWrapper, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}
        >
          <PulseRing active={isScanning} />
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={canRetry ? triggerAuth : undefined}
            style={styles.iconTouchable}
          >
            <Animated.View style={{ transform: [{ scale: iconBounce }] }}>
              <LinearGradient
                colors={isScanning ? ['#701A75', '#6D28D9'] : ['#130B2A', '#21103E']}
                style={styles.iconCircle}
              >
                <Icon
                  name={iconForType(biometricType)}
                  size={56}
                  color={iconColor[authState]}
                />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Text block */}
        <Animated.View
          style={[
            styles.textBlock,
            { opacity: textOpacity, transform: [{ translateY: textY }] },
          ]}
        >
          <Text style={styles.title}>
            {authState === 'success' ? 'Welcome back!' : 'Verify your identity'}
          </Text>
          <Text style={styles.subtitle}>
            {authState === 'success'
              ? 'Access granted'
              : `Unlock with ${labelForType(biometricType)}`}
          </Text>
          {statusMessage[authState] ? (
            <View style={styles.statusPill}>
              <Text style={[styles.statusMsg, { color: iconColor[authState] }]}>
                {statusMessage[authState]}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Action buttons */}
        <Animated.View
          style={[
            styles.btnArea,
            { opacity: btnOpacity, transform: [{ scale: btnScale }] },
          ]}
        >
          {!isLockout && canRetry && (
            <TouchableOpacity onPress={triggerAuth} activeOpacity={0.85}>
              <LinearGradient
                colors={['#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryBtn}
              >
                <Icon name="refresh" size={18} color="#FFFFFF" style={styles.retryIcon} />
                <Text style={styles.retryBtnText}>
                  Try {labelForType(biometricType)} Again
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {onUseFallback && (
            <TouchableOpacity onPress={onUseFallback} style={styles.fallbackBtn}>
              <Text style={styles.fallbackText}>
                {isLockout ? 'Use Password Instead' : 'Use Password'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Icon name="shield-check-outline" size={14} color="#F472B6" />
          <Text style={styles.footerText}>
            Protected with {labelForType(biometricType)}
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },

  // Background
  ambientPanel: {
    position: 'absolute',
    width: 270,
    height: 150,
    borderRadius: 28,
    opacity: 0.18,
    transform: [{ rotate: '-18deg' }],
  },
  panelTop: {
    top: 64,
    right: -88,
    backgroundColor: '#EC4899',
  },
  panelBottom: {
    left: -96,
    bottom: 118,
    backgroundColor: '#7C3AED',
  },
  gridOverlay: {
    position: 'absolute',
    top: 86,
    left: 26,
    right: 26,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glowOrb: {
    position: 'absolute',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 38,
  },
  logoBadge: {
    width: 118,
    height: 118,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.42)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 28,
    elevation: 12,
  },
  logoImage: {
    width: 84,
    height: 84,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  lockLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(226, 232, 240, 0.66)',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },

  // Icon
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },
  iconTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: '#F472B6',
    backgroundColor: 'transparent',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(226, 232, 240, 0.72)',
    marginBottom: 12,
  },
  statusPill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusMsg: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Buttons
  btnArea: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 16,
    minWidth: 240,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 7,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  fallbackBtn: {
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: 'rgba(226, 232, 240, 0.72)',
    fontSize: 14,
    fontWeight: '700',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 72, 153, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.16)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(226, 232, 240, 0.68)',
    fontWeight: '600',
    textAlign: 'center',
  },
});
