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
    idle:          '#A78BFA',
    authenticating: '#818CF8',
    success:       '#34D399',
    failed:        '#F87171',
    cancelled:     '#94A3B8',
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
        colors={['#0C0018', '#130028', '#1A003A']}
        style={styles.root}
      >
        {/* Decorative orbs */}
        <GlowOrb color="#7C3AED" size={280} top={-60} left={-80} />
        <GlowOrb color="#4F46E5" size={200} bottom={80} right={-60} opacity={0.25} />
        <GlowOrb color="#A855F7" size={120} bottom={220} left={40} opacity={0.2} />

        {/* Logo area */}
        <Animated.View
          style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        >
          {/* <LinearGradient
            // colors={['#7C3AED', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          > */}
            <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
          {/* </LinearGradient> */}
          <Text style={styles.appName}>Reward Planners</Text>
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
                colors={isScanning ? ['#4F46E5', '#7C3AED'] : ['#1E1040', '#2D1560']}
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
            <Text style={[styles.statusMsg, { color: iconColor[authState] }]}>
              {statusMessage[authState]}
            </Text>
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
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryBtn}
              >
                <Icon name="refresh" size={18} color="#fff" style={styles.retryIcon} />
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
        <Text style={styles.footer}>
          Your data is protected with {labelForType(biometricType)}
        </Text>
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

  // Glow
  glowOrb: {
    position: 'absolute',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E2D9F3',
    letterSpacing: 0.5,
  },

  // Icon
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: 'transparent',
  },

  // Text
  textBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F1F0FF',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B7FBF',
    marginBottom: 10,
  },
  statusMsg: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
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
    borderRadius: 14,
    minWidth: 240,
    justifyContent: 'center',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fallbackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: '#8B7FBF',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 36,
    fontSize: 12,
    color: '#4B3B72',
    textAlign: 'center',
  },
});
