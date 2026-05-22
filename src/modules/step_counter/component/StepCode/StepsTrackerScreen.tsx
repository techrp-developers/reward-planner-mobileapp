import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SendIntentAndroid from 'react-native-send-intent';

import { useStepTracker } from './useStepTracker';
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SPACING,
  TYPOGRAPHY,
  fitnessCardStyle,
} from '../../utils/theme';
import StepCountBg from '../../assets/StepCount/Step_Count.svg';
import { useAlert } from '../../../../modules/ecommerce/components/alerts';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDER_ICONS: Record<string, { name: string; color: string }> = {
  'Health Connect': { name: 'heart-pulse', color: '#E63946' },
  'Samsung Health':  { name: 'samsung',    color: '#1428A0' },
  'Google Fit':      { name: 'google-fit', color: '#34A853' },
};

const PERMISSION_STEPS = [
  { icon: 'numeric-1-circle', text: 'Open Health Connect using the button above' },
  { icon: 'numeric-2-circle', text: 'Tap "App permissions" inside Health Connect' },
  { icon: 'numeric-3-circle', text: 'Find this app in the list and tap it' },
  { icon: 'numeric-4-circle', text: 'Enable "Steps" under the Read permissions' },
  { icon: 'numeric-5-circle', text: 'Return here — the status will update automatically' },
];

type OptionalProvider = 'Samsung Health' | 'Google Fit';

// ─── ProviderRow ──────────────────────────────────────────────────────────────

type ProviderRowProps = {
  title: string;
  installed: boolean;
  connected: boolean;
  mandatory: boolean;
  selected: boolean;
  onPress: () => void;
};

const ProviderRow = ({
  title,
  installed,
  connected,
  mandatory,
  selected,
  onPress,
}: ProviderRowProps) => {
  const icon = PROVIDER_ICONS[title];

  const statusLabel = connected ? 'Connected' : installed ? 'Open' : 'Install';
  const statusColor = connected
    ? '#16A34A'
    : installed
    ? (COLORS.primaryPurple ?? '#7C3AED')
    : '#DC2626';

  const handlePress = () => {
    if (!mandatory && selected) return;
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.providerRow, selected && styles.providerRowSelected]}
      onPress={handlePress}
      activeOpacity={selected && !mandatory ? 1 : 0.75}
    >
      <View style={styles.providerLeft}>
        <View style={[styles.iconBadge, { backgroundColor: icon.color + '18' }]}>
          <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.providerTextGroup}>
          <Text style={styles.providerTitle}>{title}</Text>
          {mandatory && (
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryText}>Required</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.providerRight}>
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        {!mandatory && (
          <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
            {selected && <View style={styles.radioInner} />}
          </View>
        )}
        {mandatory && connected && (
          <MaterialCommunityIcons name="check-circle" size={20} color="#16A34A" />
        )}
        {mandatory && !connected && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.textMedium ?? '#888'}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── PermissionGuide ──────────────────────────────────────────────────────────

const PermissionGuide = ({ visible }: { visible: boolean }) => {
  // FIX 3: animHeight and animOpacity are created with useRef so their
  // .current value is stable across renders — they never change identity.
  // ESLint still flags them as missing deps because it can't statically
  // prove a ref's .current is stable. The correct fix is to read them
  // into local variables BEFORE the useEffect and list those variables.
  // Because Animated.Value refs are initialised once and never reassigned,
  // this is safe and silences the exhaustive-deps warning without
  // suppressing the rule globally.
  const animHeightRef  = useRef(new Animated.Value(0));
  const animOpacityRef = useRef(new Animated.Value(0));

  const animHeight  = animHeightRef.current;
  const animOpacity = animOpacityRef.current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animHeight, {
        toValue: visible ? 1 : 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible, animHeight, animOpacity]); // animHeight/animOpacity are stable refs — safe to list

  const maxHeight = animHeight.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 300],
  });

  return (
    <Animated.View style={[styles.guideContainer, { maxHeight, opacity: animOpacity }]}>
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={styles.guideScroll}
        contentContainerStyle={styles.guideScrollContent}
      >
        <View style={styles.guideHeader}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#B45309" />
          <Text style={styles.guideHeaderText}>
            Steps permission not granted — follow these steps:
          </Text>
        </View>

        {PERMISSION_STEPS.map((step, i) => (
          <View key={i} style={styles.guideStep}>
            <MaterialCommunityIcons
              name={step.icon}
              size={20}
              color={COLORS.primaryPurple ?? '#7C3AED'}
            />
            <Text style={styles.guideStepText}>{step.text}</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StepsTrackerScreen() {
  const {
    healthConnectStatus,
    grantedPermissions,
    healthConnectError,
    isSetupComplete,
    openHealthConnect,
    totalSteps,
    refreshStatus,
  } = useStepTracker();

  // FIX 1: useNavigation is stable across renders (React Navigation guarantees
  // this). Adding it to the useEffect dependency array below satisfies ESLint
  // without causing extra re-runs. This is the recommended pattern.
  const navigation = useNavigation<any>();
  const alert      = useAlert();

  const [isGoogleFitInstalled,     setIsGoogleFitInstalled]     = useState(false);
  const [isSamsungHealthInstalled, setIsSamsungHealthInstalled] = useState(false);
  const [selectedOptional,         setSelectedOptional]         = useState<OptionalProvider | null>(null);
  const [guideOpen,                setGuideOpen]                = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isHealthConnectInstalled = healthConnectStatus !== '0';

  const hasStepsPermission = grantedPermissions.some(
    p => p.recordType === 'Steps' && p.accessType === 'read',
  );

  const isHealthConnectReady = healthConnectStatus === '2' && hasStepsPermission;

  const showPermissionGuide = isHealthConnectInstalled && !hasStepsPermission;

  const canProceed = isHealthConnectReady && selectedOptional !== null && totalSteps > 0;

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkInstalledApps();
  }, []);

  // FIX 1: `navigation` added to the dependency array.
  // useNavigation() returns a stable object (same reference every render),
  // so adding it here has zero runtime cost but satisfies react-hooks/exhaustive-deps.
  useEffect(() => {
    if (isSetupComplete && isHealthConnectReady) {
      navigation.replace('Dashboard');
    }
  }, [isSetupComplete, isHealthConnectReady, navigation]);

  useEffect(() => {
    setGuideOpen(showPermissionGuide);
  }, [showPermissionGuide]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const checkInstalledApps = async () => {
    try {
      const fitInstalled     = await SendIntentAndroid.isAppInstalled('com.google.android.apps.fitness');
      const samsungInstalled = await SendIntentAndroid.isAppInstalled('com.sec.android.app.shealth');
      setIsGoogleFitInstalled(fitInstalled);
      setIsSamsungHealthInstalled(samsungInstalled);
    } catch (e) {
      console.log('App detection failed:', e);
    }
  };

  const installHealthConnect = async () => {
    try {
      await Linking.openURL('market://details?id=com.google.android.apps.healthdata');
    } catch {
      await Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata',
      );
    }
  };

  const handleHealthConnect = () => {
    if (healthConnectStatus === '0') {
      installHealthConnect();
    } else {
      openHealthConnect();
    }
  };

  const handleOptionalProvider = async (provider: OptionalProvider) => {
    if (selectedOptional === provider) return;

    setSelectedOptional(provider);

    try {
      if (provider === 'Google Fit') {
        if (isGoogleFitInstalled) {
          // FIX 2: SendIntentAndroid.openApp requires a second argument — an
          // extras object. Pass an empty object `{}` when no extras are needed.
          // The type signature is: openApp(packageName: string, extras: Record<string, string>)
          await SendIntentAndroid.openApp('com.google.android.apps.fitness', {});
        } else {
          await Linking.openURL(
            'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness',
          );
        }
      } else {
        if (isSamsungHealthInstalled) {
          // FIX 2: same fix for Samsung Health
          await SendIntentAndroid.openApp('com.sec.android.app.shealth', {});
        } else {
          await Linking.openURL(
            'https://play.google.com/store/apps/details?id=com.sec.android.app.shealth',
          );
        }
      }
    } catch (e) {
      console.log(`Failed to open ${provider}`, e);
    }
  };

  const handleNext = useCallback(() => {
    if (!isHealthConnectReady) {
      if (!isHealthConnectInstalled) {
        alert.warning(
          'Health Connect Required',
          'Please install Health Connect to continue.',
        );
        return;
      }
      alert.warning(
        'Permission Missing',
        'Please grant Steps permission in Health Connect, then return here.',
      );
      setGuideOpen(true);
      return;
    }

    if (totalSteps <= 0) {
      alert.warning(
        'No Steps Found',
        'Please open Google Fit or Samsung Health, allow Health Connect sync, walk a few steps, then return.',
      );
      refreshStatus();
      return;
    }

    if (!selectedOptional) {
      alert.info(
        'Select a Fitness App',
        'Please select either Samsung Health or Google Fit to continue.',
      );
      return;
    }

    navigation.navigate('StepForm');
  }, [
    isHealthConnectReady,
    isHealthConnectInstalled,
    totalSteps,
    selectedOptional,
    navigation,
    alert,
    refreshStatus,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <StepCountBg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>

      <ScrollView
        contentContainerStyle={styles.centerWrapper}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={COLORS.gradientWelcome} style={styles.card}>

          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.78}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={RESPONSIVE.iconMedium}
              color={COLORS.textMedium}
            />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headingGroup}>
            <Text style={styles.eyebrow}>RP Move</Text>
            <Text style={styles.title}>Connect Your Apps</Text>
            <Text style={styles.description}>
              Link your fitness apps so we can track your steps and reward you with coins.
            </Text>
          </View>

          {/* ── Required ──────────────────────────────────────────── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Required</Text>

            <ProviderRow
              title="Health Connect"
              connected={isHealthConnectReady}
              installed={isHealthConnectInstalled}
              mandatory
              selected={false}
              onPress={handleHealthConnect}
            />

            <TouchableOpacity
              style={styles.guideToggle}
              onPress={() => setGuideOpen(v => !v)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={guideOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#B45309"
              />
              <Text style={styles.guideToggleText}>
                {isHealthConnectReady
                  ? 'View permission details'
                  : 'How to grant Steps permission'}
              </Text>
            </TouchableOpacity>

            <PermissionGuide visible={guideOpen} />
          </View>

          {/* ── Choose one ────────────────────────────────────────── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Choose One</Text>

            <ProviderRow
              title="Samsung Health"
              installed={isSamsungHealthInstalled}
              connected={false}
              mandatory={false}
              selected={selectedOptional === 'Samsung Health'}
              onPress={() => handleOptionalProvider('Samsung Health')}
            />

            <ProviderRow
              title="Google Fit"
              installed={isGoogleFitInstalled}
              connected={false}
              mandatory={false}
              selected={selectedOptional === 'Google Fit'}
              onPress={() => handleOptionalProvider('Google Fit')}
            />
          </View>

          {/* HC SDK error */}
          {!!healthConnectError && (
            <Text style={styles.errorText}>{healthConnectError}</Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNext}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={canProceed ? COLORS.gradientPurple : ['#C7C7D1', '#AFAFBB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>

        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgVeryLight,
  },
  centerWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RESPONSIVE.horizontalPadding,
    paddingVertical: SPACING.xxl,
  },
  card: {
    ...fitnessCardStyle,
    alignItems: 'stretch',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: 'rgba(134,101,255,0.09)',
  },
  headingGroup: {
    alignItems: 'center',
    marginTop: SPACING.xxl + SPACING.md,
    marginBottom: SPACING.lg,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  providerRowSelected: {
    borderColor: COLORS.primaryPurple,
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  providerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  providerTextGroup: {
    flexDirection: 'column',
  },
  providerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textDark,
  },
  mandatoryBadge: {
    marginTop: 2,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  mandatoryText: {
    ...TYPOGRAPHY.caption,
    color: '#DC2626',
    fontSize: 10,
  },
  providerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4C4C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primaryPurple,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryPurple,
  },
  guideToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    gap: 4,
  },
  guideToggleText: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    fontSize: 12,
  },
  guideContainer: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: SPACING.xs,
  },
  guideScroll: {
    maxHeight: 260,
  },
  guideScrollContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  guideHeaderText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guideStepText: {
    ...TYPOGRAPHY.caption,
    color: '#78350F',
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: SPACING.md,
  },
  button: {
    height: RESPONSIVE.buttonHeight,
    borderRadius: BORDER_RADIUS.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
  },
});