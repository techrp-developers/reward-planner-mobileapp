import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rs, fs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type TopTab = 'Product' | 'Services' | 'Payments' | 'DineOut';

const Explore1 = require('../../../assets/sampleImages/ExploreSevice(1).png');
const Explore2 = require('../../../assets/sampleImages/ExploreSevice(2).png');
const Explore3 = require('../../../assets/sampleImages/ExploreSevice(3).png');
const Explore4 = require('../../../assets/sampleImages/ExploreSevice(4).png');
const Explore5 = require('../../../assets/sampleImages/ExploreSevice(5).png');
const Explore6 = require('../../../assets/sampleImages/ExploreSevice(6).png');
const Explore8 = require('../../../assets/sampleImages/ExploreSevice(8).png');
const PersonalLoanIcon = require('../../loan/assets/personal-loan-icon-transparent.png');

type CategoryItem = {
  image?: ReturnType<typeof require>;
  SvgCard?: React.ComponentType<{
    width?: number | string;
    height?: number | string;
  }>;
  tab: TopTab;
  title?: string;
};

const activeServices: CategoryItem[] = [
  { image: Explore1, tab: 'Product' },
  { image: Explore2, tab: 'Services' },
  { image: Explore3, tab: 'Payments' },
  { image: Explore4, tab: 'DineOut' },
];

const upcomingServices: CategoryItem[] = [
  { image: Explore6, tab: 'Product' },
];

const hiddenUpcomingServices: CategoryItem[] = [
  { image: Explore8, tab: 'Product', title: 'Expense Tracker' },
];

const SHOW_HIDDEN_UPCOMING_SERVICES = false;

const TAB_TO_MODULE: Record<TopTab, { screen: string; moduleName: TopTab }> = {
  Product: { screen: 'ProductModule', moduleName: 'Product' },
  Services: { screen: 'ServicesModule', moduleName: 'Services' },
  Payments: { screen: 'PaymentsModule', moduleName: 'Payments' },
  DineOut: { screen: 'DineOutModule', moduleName: 'DineOut' },
};

function ExploreModule() {
  const { isDark, theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const isNavigatingRef = useRef(false);
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const CARD_WIDTH = width - rs(32);
  const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.4);

  const t = useMemo(
    () => ({
      safeArea: { backgroundColor: theme.background } as ViewStyle,
      header: { backgroundColor: theme.background } as ViewStyle,
      backArrow: { color: isDark ? '#FFFFFF' : '#1A1A2E' } as TextStyle,
      headerTitle: { color: isDark ? '#FFFFFF' : '#1A1A2E' } as TextStyle,
      sectionTitle: { color: isDark ? '#D1D5DB' : '#374151' } as TextStyle,
      exploreItem: {
        backgroundColor: isDark ? '#374151' : '#E8E8E8',
      } as ViewStyle,
    }),
    [isDark, theme.background],
  );

  const handleCategoryPress = useCallback(
    (tab: TopTab) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const target = TAB_TO_MODULE[tab];
      navigation.navigate('Home', {
        screen: target.screen,
        params: { moduleName: target.moduleName },
        moduleName: target.moduleName,
      });

      navigationUnlockTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        navigationUnlockTimerRef.current = null;
      }, 1000);
    },
    [navigation],
  );

  useEffect(
    () => () => {
      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current);
      }
    },
    [],
  );

  return (
    <SafeAreaView style={[styles.safeArea, t.safeArea]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={[styles.header, t.header]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.backArrow, t.backArrow]}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, t.headerTitle]}>
          Explore Services
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {activeServices.map((item, i) => (
          <TouchableOpacity
            key={`active-${i}`}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            style={[
              styles.exploreItem,
              t.exploreItem,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
            onPress={() => handleCategoryPress(item)}
          >
            {item.tab === 'Loan' ? (
              <LinearGradient colors={['#D3B8E5', '#F7F0FB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loanCard}>
                <Image source={PersonalLoanIcon} resizeMode="contain" style={[styles.loanImage, { width: CARD_WIDTH * 0.36, height: CARD_HEIGHT * 0.94 }]} />
                <View style={styles.loanContent}>
                  <View style={styles.loanHeading}><MaterialCommunityIcons name="cash-multiple" size={rs(18)} color="#4C2D56" /><Text style={styles.loanTitle}>Personal Loan</Text></View>
                  <Text style={styles.loanDescription}>Funding for your{ '\n' }next chapter.</Text>
                  <View style={styles.loanCta}><Text style={styles.loanCtaText}>Explore Loan</Text><MaterialCommunityIcons name="arrow-right" size={rs(12)} color="#FFFFFF" /></View>
                </View>
              </LinearGradient>
            ) : item.SvgCard ? (
              <item.SvgCard width={CARD_WIDTH} height={CARD_HEIGHT} />
            ) : (
              <Image
                source={item.image}
                style={styles.exploreImage}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, t.sectionTitle]}>
          Upcoming Services
        </Text>

        {upcomingServices.map((item, i) => (
          <TouchableOpacity
            key={`upcoming-${i}`}
            activeOpacity={1}
            disabled
            style={[
              styles.exploreItem,
              styles.disabledItem,
              t.exploreItem,
              { width: CARD_WIDTH, height: CARD_HEIGHT },
            ]}
          >
            <Image
              source={item.image}
              style={[styles.exploreImage, styles.disabledImage]}
              resizeMode="cover"
            />
            <View style={styles.disabledOverlay} />
          </TouchableOpacity>
        ))}

        {SHOW_HIDDEN_UPCOMING_SERVICES
          ? hiddenUpcomingServices.map((item, i) => (
              <TouchableOpacity
                key={`hidden-upcoming-${i}`}
                activeOpacity={1}
                disabled
                style={[
                  styles.exploreItem,
                  styles.disabledItem,
                  t.exploreItem,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              >
                <View style={styles.hiddenDisabledCardContent}>
                  <Text style={styles.hiddenDisabledCardTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.hiddenDisabledCardSubtitle}>
                    Coming Soon
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default React.memo(ExploreModule);

const styles = StyleSheet.create({
  loanCard: { flex: 1, padding: rs(15) },
  loanContent: { flex: 1, width: '66%', alignItems: 'flex-start', justifyContent: 'space-between' },
  loanHeading: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  loanTitle: { fontSize: fs(16), fontWeight: '600', color: '#4C2D56' },
  loanDescription: { fontSize: fs(15), fontWeight: '700', lineHeight: rs(19), color: '#4C2D56' },
  loanCta: { flexDirection: 'row', alignItems: 'center', gap: rs(5), borderRadius: rs(14), backgroundColor: '#4C2D56', paddingVertical: rs(4), paddingHorizontal: rs(12) },
  loanCtaText: { fontSize: fs(10), fontWeight: '600', color: '#FFFFFF' },
  loanImage: { position: 'absolute', right: rs(5), bottom: rs(2) },
  safeArea: {
    flex: 1,
    // backgroundColor via t.safeArea
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    // backgroundColor via t.header
  },
  backBtn: {
    width: rs(36),
    height: rs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: fs(32),
    // color via t.backArrow
    lineHeight: rs(36),
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    // color via t.headerTitle
    letterSpacing: 0.2,
  },

  container: {
    paddingHorizontal: rs(16),
    paddingTop: rs(8),
    paddingBottom: rs(32),
    alignItems: 'center',
    gap: rs(14),
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: fs(16),
    fontWeight: '700',
    marginTop: rs(8),
  },

  exploreItem: {
    borderRadius: rs(16),
    overflow: 'hidden',
    // backgroundColor via t.exploreItem
  },

  disabledItem: {
    backgroundColor: '#E5E7EB',
  },
  disabledImage: {
    opacity: 0.55,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229, 231, 235, 0.22)',
  },
  hiddenDisabledCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(20),
  },
  hiddenDisabledCardTitle: {
    fontSize: fs(20),
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
  },
  hiddenDisabledCardSubtitle: {
    marginTop: rs(8),
    fontSize: fs(13),
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  exploreImage: {
    width: '100%',
    height: '100%',
  },
});
