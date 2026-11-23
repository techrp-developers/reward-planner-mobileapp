import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useBottomTabsInset } from '../../../bottombar/BottomTabsInsetContext';

import ProductHeadColor from '../constants/heading/Poduct_Head_Color';
import ProductCard from '../constants/product_cart/ProductCard';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { fetchFeaturedCampaignProducts } from '../api/ProductApi';
import { normalizeProduct } from '../utils/normalizeProduct';
import type { HomeStackParamList } from '../navigation/types';
import { useAppTheme } from '../../../theme/ThemeContext';

type FeaturedCampaignRoute = RouteProp<HomeStackParamList, 'FeaturedCampaignProducts'>;
type Navigation = NativeStackNavigationProp<HomeStackParamList>;

const PAGE_SIZE = 20;

export default function FeaturedCampaignProductsScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<FeaturedCampaignRoute>();
  const { theme } = useAppTheme();
  const bottomTabsInset = useBottomTabsInset();
  const { width } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;
  const { campaignId, title } = route.params;
  const horizontalPadding = 16;
  const columnGap = 12;
  const cardWidth = Math.max(0, (width - horizontalPadding * 2 - columnGap) / 2);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isLoadingError,
    isFetchNextPageError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['ecommerce', 'featured-campaign-products', String(campaignId)],
    queryFn: async ({ pageParam }) => {
      const page = await fetchFeaturedCampaignProducts(
        campaignId,
        pageParam,
        PAGE_SIZE,
      );
      return {
        ...page,
        products: page.products.map(product =>
          normalizeProduct({ ...product, id: product.product_id ?? product.id }),
        ),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: String(campaignId).trim().length > 0,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const products = useMemo(() => {
    const uniqueProducts = new Map<string, any>();
    (data?.pages ?? []).forEach((page) => {
      page.products.forEach((product) => {
        const productId = product?.product_id ?? product?.id;
        if (productId === undefined || productId === null || String(productId).trim() === "") return;
        const key = String(productId);
        if (!uniqueProducts.has(key)) uniqueProducts.set(key, product);
      });
    });
    return Array.from(uniqueProducts.values());
  }, [data?.pages]);

  const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);
  useEffect(() => {
    if (!isLoading) {
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isLoading, pulse]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetching || isFetchNextPageError) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching, isFetchNextPageError]);

  const retryNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleProductPress = useCallback((productId: string | number, item: any) => {
    navigation.navigate("ProductDescription", {
      productId,
      variantId: item?.variant_id ?? item?.variantId,
      campaignId,
    });
  }, [campaignId, navigation]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ProductHeadColor title={title} onBackPress={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {skeletonItems.map((_, index) => (
            <View
              key={`featured-product-skeleton-${index}`}
              style={[styles.skeletonCard, { width: cardWidth, backgroundColor: theme.card }]}
            >
              <SkeletonBox pulse={pulse} width="100%" height={cardWidth} borderRadius={14} />
              <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
              <SkeletonBox pulse={pulse} width="58%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
            </View>
          ))}
        </View>
      ) : isLoadingError ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            Unable to load featured products.
          </Text>
          <Pressable accessibilityRole="button" onPress={handleRefresh}>
            <Text style={[styles.emptyAction, { color: theme.text }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item: any) => String(item.product_id ?? item.id)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomTabsInset + 18 }]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage && !isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              cardWidth={cardWidth}
              shouldLoadImage
              onProductPress={handleProductPress}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                No featured products are currently available.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : isFetchNextPageError ? (
              <Pressable
                style={styles.footerLoader}
                accessibilityRole="button"
                onPress={retryNextPage}
              >
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Unable to load more. Tap to retry.
                </Text>
              </Pressable>
            ) : null
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
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  skeletonCard: { borderRadius: 14, padding: 6, marginBottom: 12 },
  skeletonText: { marginTop: 8 },
  skeletonTextSmall: { marginTop: 6 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptyAction: { padding: 12, textDecorationLine: 'underline', fontWeight: '700' },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
});
