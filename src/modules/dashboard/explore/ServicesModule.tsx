import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { rs, fs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import { useModuleIcons } from '../../../navbar/hooks/useModuleIcons';
import { TOP_TAB_BY_MODULE, type CmsModuleKey } from '../../common/cms/moduleMapping';
import type { CmsModule } from '../../common/cms/cmsContentApi';

import ProductIcon from '../../../assets/sampleImages/Product.svg';
import ServiceIcon from '../../../assets/sampleImages/Service.svg';
import PaymentIcon from '../../../assets/sampleImages/Payment.svg';
import DineOutIcon from '../../../assets/sampleImages/DineOut.svg';

export type ExploreServiceTab = 'Product' | 'Services' | 'Payments' | 'DineOut';
type TopTab = ExploreServiceTab;

type ServicesModuleProps = {
  onModulePress?: (tab: ExploreServiceTab) => void;
};

// Purpose-built transparent icon glyphs — unlike the bundled Categories(N).png
// tile photos these replaced, these have no baked-in white canvas, so a
// module without a published dashboard/nav icon yet still renders cleanly.
const FALLBACK_ICON_BY_TAB: Record<TopTab, React.ComponentType<{ width: number; height: number }>> = {
  Product: ProductIcon,
  Services: ServiceIcon,
  Payments: PaymentIcon,
  DineOut: DineOutIcon,
};

const TAB_TO_MODULE: Record<TopTab, { screen: string; moduleName: TopTab }> = {
  Product: { screen: 'ProductModule', moduleName: 'Product' },
  Services: { screen: 'ServicesModule', moduleName: 'Services' },
  Payments: { screen: 'PaymentsModule', moduleName: 'Payments' },
  DineOut: { screen: 'DineOutModule', moduleName: 'DineOut' },
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CARD_WIDTH = rs(68);
const CARD_GAP = rs(10);
const ICON_CONTAINER_SIZE = rs(52);
const ICON_SIZE = rs(40);

type ServiceCardProps = {
  tab: TopTab | null;
  label: string;
  iconUrl: string | null;
  onPress: () => void;
};

const ServiceCard = React.memo(({ tab, label, iconUrl, onPress }: ServiceCardProps) => {
  const { isDark } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [scale]);

  const t = useMemo(
    () => ({
      cardLabel: { color: isDark ? '#E5E7EB' : '#374151' } as TextStyle,
    }),
    [isDark],
  );

  const FallbackIcon = tab ? FALLBACK_ICON_BY_TAB[tab] : null;

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.9}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, { transform: [{ scale }] }]}
    >
      <View style={styles.iconContainer}>
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.icon} resizeMode="contain" />
        ) : FallbackIcon ? (
          <FallbackIcon width={ICON_SIZE} height={ICON_SIZE} />
        ) : null}
      </View>
      <Text
        style={[styles.cardLabel, t.cardLabel]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
});
ServiceCard.displayName = 'ServiceCard';

function ServicesModule({ onModulePress }: ServicesModuleProps) {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { modules } = useModuleIcons();
  const isNavigatingRef = useRef(false);
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const t = useMemo(
    () => ({
      wrapper: { backgroundColor: 'transparent' } as ViewStyle,
      headerTitle: { color: isDark ? '#FFFFFF' : '#0F172A' } as TextStyle,
    }),
    [isDark],
  );

  const navigateToModule = useCallback(
    (tab: TopTab | null, module: CmsModule) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (tab) {
        const target = TAB_TO_MODULE[tab];
        if (onModulePress) {
          onModulePress(tab);
        } else {
          navigation.navigate('Home', {
            screen: target.screen,
            params: { moduleName: target.moduleName },
            moduleName: target.moduleName,
          });
        }
      } else if (module.route_key) {
        // A module the 4 known bottom tabs don't cover — navigate generically
        // by its CMS route_key, same fallback Navbar.tsx uses.
        navigation.navigate('Home', {
          screen: module.route_key,
          params: { moduleName: module.module_key },
          moduleName: module.module_key,
        });
      }

      navigationUnlockTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        navigationUnlockTimerRef.current = null;
      }, 1000);
    },
    [navigation, onModulePress],
  );

  useEffect(
    () => () => {
      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current);
      }
    },
    [],
  );

  const handleViewAll = useCallback(() => {
    navigation.navigate('ExploreModule');
  }, [navigation]);

  return (
    <View style={[styles.wrapper, t.wrapper]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, t.headerTitle]}>
          Explore Services
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleViewAll}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {modules.map((module) => {
          const tab = TOP_TAB_BY_MODULE[module.module_key as CmsModuleKey] ?? null;
          const iconUrl = module.dashboard_icon_url || module.icon_url || null;

          return (
            <ServiceCard
              key={module.module_key}
              tab={tab}
              label={module.label}
              iconUrl={iconUrl}
              onPress={() => navigateToModule(tab, module)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default React.memo(ServicesModule);

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: rs(14),
    paddingBottom: rs(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },
  headerTitle: {
    fontSize: fs(17),
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  viewAll: {
    fontSize: fs(12.5),
    fontWeight: '600',
    color: '#4A6CF7',
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    gap: CARD_GAP,
    alignItems: 'flex-start',
  },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  cardLabel: {
    marginTop: rs(6),
    fontSize: fs(10.5),
    fontWeight: '600',
    maxWidth: CARD_WIDTH,
    textAlign: 'center',
  },
});
