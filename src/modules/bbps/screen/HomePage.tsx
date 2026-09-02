import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import RechargeBill from '../component/home/ReachargeBill';
import { useBbpsTheme } from '../utils/useBbpsTheme';
import PromotionalBanner from '../../ecommerce/components/home/PromotionalBanner';
import OffersBanner from '../../ecommerce/components/home/OffersBanner';

function HomePageComponent() {
  const { colors } = useBbpsTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Payment-module CMS content (fetchResolvedZones("payment")) — both
            components render null when their CMS entry is null/absent. */}
        <PromotionalBanner module="payment" />
        <OffersBanner module="payment" />
        <RechargeBill />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
});

export default React.memo(HomePageComponent);
