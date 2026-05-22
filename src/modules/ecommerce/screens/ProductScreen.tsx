import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import ProductCard from "../constants/product_cart/ProductCard";
import { fetchAllProducts } from "../api/ProductApi";
import type { HomeStackParamList } from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const PAGE_SIZE = 8;

function ProductScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gap = 12;
  const horizontalPadding = 16;
  const cardWidth = useMemo(
    () => (width - horizontalPadding * 2 - gap) / 2,
    [width]
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const normalizeLegacyProducts = (rawList: any[]) =>
    rawList.map((item: any, index: number) => ({
      ...item,
      id: item?.product_id ?? item?.id ?? `prod-${index}`,
      productId: item?.product_id ?? item?.id,
      title: item?.product_name ?? item?.title ?? "Product",
      brand: item?.brand_name ?? item?.brand ?? "",
      image:
        (Array.isArray(item?.images) && item.images[0]) ||
        item?.image ||
        item?.image_url ||
        "",
      price: item?.price ?? item?.selling_price ?? item?.final_price ?? "",
      oldPrice: item?.old_price ?? item?.original_price ?? "",
      rewardCoins: item?.rewardCoins ?? item?.points ?? item?.reward_points ?? 0,
      rating: item?.rating ?? 4.5,
      reviews: item?.reviews_count ?? item?.reviews ?? 0,
      is_wishlisted: item?.is_wishlisted ?? false,
    }));

  const fetchAllProductsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAllProducts();
      const rawList =
        (Array.isArray(res?.products) && res.products) ||
        (Array.isArray(res?.data?.products) && res.data.products) ||
        (Array.isArray(res?.data) && res.data) ||
        [];

      const normalized = normalizeLegacyProducts(rawList);
      setAllProducts(normalized);
      setPage(1);
      setVisibleProducts(normalized.slice(0, PAGE_SIZE));
    } catch (err: any) {
      console.error("ProductScreen Fetch Error:", err?.message || err);
      setError(err?.message || "Failed to load products");
      setAllProducts([]);
      setVisibleProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllProductsData();
    }, [fetchAllProductsData])
  );

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore) return;

    const startIndex = page * PAGE_SIZE;
    if (startIndex >= allProducts.length) return;

    setLoadingMore(true);
    const nextBatch = allProducts.slice(startIndex, startIndex + PAGE_SIZE);
    if (nextBatch.length === 0) {
      setLoadingMore(false);
      return;
    }

    setPage((prev) => prev + 1);
    setVisibleProducts((prev) => [...prev, ...nextBatch]);
    setLoadingMore(false);
  }, [loading, loadingMore, allProducts, page]);

  return (
    <View style={styles.screen}>
      <ProductHeadColor title="All Products" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <View style={styles.skeletonRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`product-skeleton-${index}`} style={[styles.skeletonCard, { width: cardWidth }]}>
                <SkeletonBox pulse={pulse} width="100%" height={Math.round(cardWidth * 1.05)} borderRadius={14} />
                <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
                <SkeletonBox pulse={pulse} width="60%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
              </View>
            ))}
          </View>
        </View>
      ) : error && visibleProducts.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => <ProductCard item={item} cardWidth={cardWidth} />}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#5B47A3" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default ProductScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  skeletonCard: {
    marginBottom: 12,
  },
  skeletonText: {
    marginTop: 10,
  },
  skeletonTextSmall: {
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 14,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});