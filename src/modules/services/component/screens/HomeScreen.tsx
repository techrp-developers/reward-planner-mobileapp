import React, { useCallback, useRef, useState } from 'react';
import { FlatList, InteractionManager, StyleSheet, View, ViewToken } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import MostBookedServices from '../home/MostBookedServices';
import QuickServices from '../home/QuickServices';
import BundleService from '../home/BundleService';
import ExclusiveOffers from '../home/ExclusiveOffers';
import PromotionalBanner from '../../../ecommerce/components/home/PromotionalBanner';
import OffersBanner from '../../../ecommerce/components/home/OffersBanner';
import { useServicesTheme } from '../../utils/useServicesTheme';
import { useNavbarScroll } from '../../../../navbar/NavbarScrollContext';
import { useModuleContent } from '../../../common/cms/useModuleContent';

type ServiceSectionKey =
  | 'offersBanner'
  | 'banner'
  | 'services'
  | 'slider'
  | 'mostBooked'
  | 'quickServices'
  | 'exclusiveOffers'
  | 'bundles';

// Keep offers near the top; the promotional banner is the list header.
const SERVICE_SECTIONS: Array<{ key: ServiceSectionKey }> = [
  { key: 'services' },
  { key: 'offersBanner' },
  { key: 'banner' },
  { key: 'slider' },
  { key: 'mostBooked' },
  { key: 'quickServices' },
  { key: 'exclusiveOffers' },
  { key: 'bundles' },
];

const INITIAL_SERVICE_SECTIONS = new Set<ServiceSectionKey>([
  'banner',
  'services',
  'slider',
  'quickServices',
  'offersBanner',
]);
const READY_SERVICE_SECTIONS = new Set<ServiceSectionKey>(INITIAL_SERVICE_SECTIONS);

const ServiceSection = React.memo(({
  sectionKey,
  isReady,
}: {
  sectionKey: ServiceSectionKey;
  isReady: boolean;
}) => {
  if (!isReady) return <View style={styles.sectionPlaceholder} />;

  switch (sectionKey) {
    case 'offersBanner': return <OffersBanner module="service" />;
    case 'banner': return <Banner />;
    case 'services': return <ServicesHome />;
    case 'slider': return <BannerSliderManual />;
    case 'mostBooked': return <MostBookedServices />;
    case 'quickServices': return <QuickServices />;
    case 'exclusiveOffers': return <ExclusiveOffers />;
    case 'bundles': return <BundleService />;
    default: return null;
  }
});

ServiceSection.displayName = 'ServiceHomeSection';

const ServicePromotionalBanner = React.memo(() => <PromotionalBanner module="service" />);
ServicePromotionalBanner.displayName = 'ServicePromotionalBanner';

function HomeScreen() {
  const { colors } = useServicesTheme();
  const { onScroll } = useNavbarScroll();
  const { refetch: refetchModuleContent } = useModuleContent('service');
  useFocusEffect(useCallback(() => {
    void refetchModuleContent();
  }, [refetchModuleContent]));
  const [readySections, setReadySections] = useState<Set<ServiceSectionKey>>(
    () => new Set(READY_SERVICE_SECTIONS),
  );
  const pendingReadySections = useRef<Set<ServiceSectionKey>>(new Set(READY_SERVICE_SECTIONS));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const nextKeys = viewableItems
        .map((entry) => (entry.item as { key: ServiceSectionKey } | undefined)?.key)
        .filter((key): key is ServiceSectionKey => Boolean(key));

      const keysToAdd = nextKeys.filter((key) => !pendingReadySections.current.has(key));
      if (keysToAdd.length === 0) return;

      keysToAdd.forEach((key) => {
        pendingReadySections.current.add(key);
        READY_SERVICE_SECTIONS.add(key);
      });

      InteractionManager.runAfterInteractions(() => {
        setReadySections((previous) => {
          const next = new Set(previous);
          keysToAdd.forEach((key) => next.add(key));
          return next;
        });
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 8,
    minimumViewTime: 80,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: { key: ServiceSectionKey } }) => (
      <ServiceSection sectionKey={item.key} isReady={readySections.has(item.key)} />
    ),
    [readySections],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={SERVICE_SECTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ServicePromotionalBanner}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={32}
        windowSize={5}
        removeClippedSubviews={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}

export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionPlaceholder: {
    minHeight: 180,
  },
});
