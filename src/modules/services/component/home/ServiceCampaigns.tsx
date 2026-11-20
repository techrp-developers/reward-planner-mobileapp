import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getCampaignHome } from '../../../ecommerce/api/CampaignAPI';
import { openCampaignPoster } from '../../../ecommerce/utils/campaignNavigation';
import { getCampaignServices, getContentOfferServices } from '../../api/ServiceCampaignAPI';
import type { HomeStackParamList, ServiceItem } from '../../navigation/type';
import ServiceGridCard from '../constant/ServiceGridCard';
import { useAppTheme } from '../../../../theme/ThemeContext';
import CampaignListingControls, { useCampaignListing } from '../../../common/cms/CampaignListingControls';
import { campaignPrice, defaultCampaignFilters } from '../../../common/cms/campaignListing';

const noServices: ServiceItem[] = [];
const getServiceMetrics = (service: ServiceItem) => ({
  price: campaignPrice(service.price),
  rating: Number(service.rating) || 0,
  discount: Number(service.discount_percent) || 0,
});

export function ServiceCampaignItems({
  campaignId, contentId, imageId, horizontal = false, renderHeader,
}: HomeStackParamList['ServiceCampaign'] & {
  horizontal?: boolean;
  renderHeader?: (controls?: React.ReactNode) => React.ReactNode;
}) {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const focused = useIsFocused();
  const { data = noServices, isLoading, error, refetch } = useQuery({
    queryKey: contentId === undefined
      ? ['services', 'campaign', campaignId]
      : ['services', 'content-offer', contentId, imageId],
    queryFn: () => contentId === undefined
      ? getCampaignServices(campaignId)
      : getContentOfferServices(contentId, imageId),
    staleTime: 30000,
    refetchInterval: focused ? 30000 : false,
  });
  const { results, ...listingControls } = useCampaignListing(horizontal ? noServices : data, getServiceMetrics);
  const hasOffers = !isLoading && !error && data.length > 0;
  const header = renderHeader?.(hasOffers && (
    <CampaignListingControls count={results.length} label="service" variant="header" {...listingControls} />
  ));
  return (
    <>
      {header}
      {isLoading ? <ActivityIndicator style={styles.loading} /> : error ? (
        <Text onPress={() => refetch()} style={[styles.message, { color: theme.text }]}>Unable to load offers. Tap to retry.</Text>
      ) : !data.length ? (
        horizontal ? null : <Text style={[styles.message, { color: theme.text }]}>No active services in this campaign.</Text>
      ) : <FlatList
        data={horizontal ? data : results}
        horizontal={horizontal}
        numColumns={horizontal ? 1 : 2}
        contentContainerStyle={[styles.list, !horizontal && styles.grid]}
        columnWrapperStyle={horizontal ? undefined : styles.columns}
        keyExtractor={item => `${item.service_id}:${item.variant_id}`}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ServiceGridCard
          item={item} cardWidth={horizontal ? 150 : (width - 44) / 2} image={item.image ? { uri: item.image } : null}
          onPress={() => navigation.navigate('ServiceDescription', {
            serviceId: item.service_id, variantId: item.variant_id || undefined, title: item.name,
          })}
        />}
        ListEmptyComponent={horizontal ? null : (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No services match your filters.</Text>
            <Pressable accessibilityRole="button" onPress={() => listingControls.setFilters(defaultCampaignFilters)}>
              <Text style={[styles.emptyAction, { color: theme.text }]}>Clear filters</Text>
            </Pressable>
          </View>
        )}
      />}
    </>
  );
}

export default function ServiceCampaigns() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const focused = useIsFocused();
  const { data } = useQuery({
    queryKey: ['services', 'campaign-home'],
    queryFn: () => getCampaignHome('service'),
    staleTime: 30000,
    refetchInterval: focused ? 30000 : false,
  });
  const posters = data?.data.posters ?? [];
  const sales = data?.data.show_flash_sale === false ? [] : data?.data.flash_sales ?? [];
  if (!posters.length && !sales.length) return null;
  return <View>
    {!!posters.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {posters.map(poster => <TouchableOpacity key={poster.campaign_id} onPress={() => openCampaignPoster(navigation, { ...poster, module: 'service' })}>
        <Image source={{ uri: poster.banner_image }} style={styles.poster} resizeMode="cover" />
      </TouchableOpacity>)}
    </ScrollView>}
    {sales.map(sale => <View key={sale.campaign_id}>
      <TouchableOpacity onPress={() => navigation.navigate('ServiceCampaign', { campaignId: sale.campaign_id, title: sale.title })}>
        <Text style={[styles.title, { color: theme.text }]}>{sale.title || 'Flash sale'} · View all</Text>
      </TouchableOpacity>
      <ServiceCampaignItems campaignId={sale.campaign_id} horizontal />
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  grid: { flexGrow: 1, paddingBottom: 24 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyAction: { padding: 12, textDecorationLine: 'underline', fontWeight: '700' },
  columns: { gap: 12 },
  poster: { width: 260, height: 160, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginTop: 16 },
  loading: { padding: 24 },
  message: { padding: 24, textAlign: 'center' },
});
