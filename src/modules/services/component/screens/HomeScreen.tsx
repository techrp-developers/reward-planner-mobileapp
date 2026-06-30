import React, { useCallback } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import MostBookedServices from '../home/MostBookedServices';
import QuickServices from '../home/QuickServices';
import BundleService from '../home/BundleService';
import ExclusiveOffers from '../home/ExclusiveOffers';

type ServiceSectionKey =
  | 'banner'
  | 'services'
  | 'slider'
  | 'mostBooked'
  | 'quickServices'
  | 'exclusiveOffers'
  | 'bundles';

const SERVICE_SECTIONS: Array<{ key: ServiceSectionKey }> = [
  { key: 'banner' },
  { key: 'services' },
  { key: 'slider' },
  { key: 'mostBooked' },
  { key: 'quickServices' },
  { key: 'exclusiveOffers' },
  { key: 'bundles' },
];

const ServiceSection = React.memo(({ sectionKey }: { sectionKey: ServiceSectionKey }) => {
  switch (sectionKey) {
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

function HomeScreen() {
  const renderItem = useCallback(
    ({ item }: { item: { key: ServiceSectionKey } }) => (
      <ServiceSection sectionKey={item.key} />
    ),
    [],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={SERVICE_SECTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={32}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
    paddingTop: 15,
  },
  listContent: {
    paddingBottom: 32,
  },
});
