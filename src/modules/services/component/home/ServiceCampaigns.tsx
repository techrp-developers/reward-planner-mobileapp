import React from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getCampaignHome } from '../../../ecommerce/api/CampaignAPI';
import { openCampaignPoster } from '../../../ecommerce/utils/campaignNavigation';
import { getCampaignServices } from '../../api/ServiceCampaignAPI';
import ServiceGridCard from '../constant/ServiceGridCard';
import { useAppTheme } from '../../../../theme/ThemeContext';

export function ServiceCampaignItems({ campaignId, horizontal = false }: { campaignId: number; horizontal?: boolean }) {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const focused = useIsFocused();
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['services', 'campaign', campaignId],
    queryFn: () => getCampaignServices(campaignId),
    staleTime: 30000,
    refetchInterval: focused ? 30000 : false,
  });
  if (isLoading) return <ActivityIndicator style={styles.loading} />;
  if (error) return <Text onPress={() => refetch()} style={[styles.message, { color: theme.text }]}>Unable to load offers. Tap to retry.</Text>;
  if (!data.length) return horizontal ? null : <Text style={[styles.message, { color: theme.text }]}>No active services in this campaign.</Text>;
  return <FlatList
    data={data}
    horizontal={horizontal}
    numColumns={horizontal ? 1 : 2}
    contentContainerStyle={styles.list}
    columnWrapperStyle={horizontal ? undefined : styles.columns}
    keyExtractor={item => `${item.service_id}:${item.variant_id}`}
    showsHorizontalScrollIndicator={false}
    renderItem={({ item }) => <ServiceGridCard
      item={item} cardWidth={horizontal ? 150 : (width - 44) / 2} image={item.image ? { uri: item.image } : null}
      onPress={() => navigation.navigate('ServiceDescription', {
        serviceId: item.service_id, variantId: item.variant_id || undefined, title: item.name,
      })}
    />}
  />;
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
  columns: { gap: 12 },
  poster: { width: 260, height: 160, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: '700', marginHorizontal: 16, marginTop: 16 },
  loading: { padding: 24 },
  message: { padding: 24, textAlign: 'center' },
});
