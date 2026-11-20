import React, { useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import ProductHeadColor from '../constants/heading/Poduct_Head_Color';
import ProductCard from '../constants/product_cart/ProductCard';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { getCampaignProducts } from '../api/CampaignAPI';
import { getContentOfferProducts } from '../api/ContentOfferAPI';
import { normalizeProduct } from '../utils/normalizeProduct';
import type { HomeStackParamList } from '../navigation/types';
import { useAppTheme } from '../../../theme/ThemeContext';
import CampaignListingControls, { useCampaignListing } from '../../common/cms/CampaignListingControls';
import { campaignPrice, defaultCampaignFilters } from '../../common/cms/campaignListing';

type CampaignRoute = RouteProp<HomeStackParamList, 'CampaignProducts'>;
type Navigation = NativeStackNavigationProp<HomeStackParamList>;

const offerProductsQueryKey = (campaignId?: number | string, contentId?: number | string, imageId?: number) =>
  ['ecommerce', 'offer-products', String(campaignId ?? ''), String(contentId ?? ''), imageId ?? null] as const;

const normalizeCampaignProducts = (response: any) => {
  const products = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.products) ? response.data.products : [];

  return products.map((product: any) => normalizeProduct({
    ...product,
    id: product.product_id ?? product.id,
    campaign_item_id: product.id,
    title: product.title ?? product.product_name,
    brand: product.brand ?? product.brand_name,
    price: product.price ?? product.sale_price ?? product.final_price,
    originalPrice: product.originalPrice ?? product.original_sale_price ?? product.original_price ?? product.mrp,
    image: product.image,
  }));
};

const noProducts: ReturnType<typeof normalizeCampaignProducts> = [];

function getProductMetrics(product: ReturnType<typeof normalizeProduct>) {
  const rpPrice = campaignPrice(product.rp_price);
  const price = rpPrice > 0 ? rpPrice : campaignPrice(product.price);
  const originalPrice = campaignPrice(product.originalPrice);
  const discount = Number.parseFloat(product.discount);
  return {
    price,
    rating: Number(product.rating) || 0,
    discount: Number.isFinite(discount)
      ? discount
      : originalPrice > 0 && price < originalPrice
        ? Math.round(100 * (originalPrice - price) / originalPrice)
        : 0,
    brand: typeof product.brand === 'string' ? product.brand.trim() : undefined,
  };
}

export default function CampaignProductsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<CampaignRoute>();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;
  const cardWidth = (width - 44) / 2;
  const { campaignId, contentId, imageId } = route.params;
  const sourceId = Number(contentId ?? campaignId);

  const { data: products = noProducts, isLoading, error, refetch } = useQuery({
    queryKey: offerProductsQueryKey(campaignId, contentId, imageId),
    queryFn: () => contentId != null ? getContentOfferProducts(sourceId, imageId) : getCampaignProducts(sourceId),
    select: normalizeCampaignProducts,
    enabled: Number.isInteger(sourceId) && sourceId > 0,
    staleTime: contentId == null ? 5 * 60 * 1000 : 0,
    refetchOnMount: contentId != null,
  });

  const { results, ...listingControls } = useCampaignListing(products, getProductMetrics);
  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}> 
      <ProductHeadColor title={route.params.title || 'Campaign Products'} onBackPress={() => navigation.goBack()} />
      {!isLoading && !error && products.length > 0 && (
        <CampaignListingControls count={results.length} label="product" {...listingControls} />
      )}

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {skeletonItems.map((_, index) => (
            <View key={index} style={[styles.skeletonCard, { width: cardWidth, backgroundColor: theme.card }]}> 
              <SkeletonBox pulse={pulse} width="100%" height={cardWidth} borderRadius={14} />
              <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
              <SkeletonBox pulse={pulse} width="58%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Unable to load products.</Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()}>
            <Text style={[styles.emptyAction, { color: theme.text }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item: any) => `${item.id}:${item.variant_id}`}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              cardWidth={cardWidth}
              shouldLoadImage
              onProductPress={(productId, product) => navigation.navigate('ProductDescription', {
                productId,
                variantId: product.variant_id,
                campaignId,
                contentId,
              })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                {products.length ? 'No products match your filters.' : 'No products are currently available.'}
              </Text>
              {products.length > 0 && (
                <Pressable accessibilityRole="button" onPress={() => listingControls.setFilters(defaultCampaignFilters)}>
                  <Text style={[styles.emptyAction, { color: theme.text }]}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            results.length > 0 ? <View style={styles.footerSpace} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
  skeletonCard: { borderRadius: 14, padding: 6, marginBottom: 12 },
  skeletonText: { marginTop: 8 },
  skeletonTextSmall: { marginTop: 6 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyAction: { padding: 12, textDecorationLine: 'underline', fontWeight: '700' },
  footerSpace: { height: 24 },
});
