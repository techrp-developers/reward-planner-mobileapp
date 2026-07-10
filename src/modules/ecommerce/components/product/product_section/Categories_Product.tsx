import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProductCard from "../../../constants/product_cart/ProductCard";
import ProductHead from "../../../constants/heading/Product_Head_Img";
import FilterChipsRow from "./FilterChipsRow";
import AllIcons from "../../../../../assets/menu/AllCategories.svg";

import {
  fetchCategoriesByID,
  fetchCategoriesScreenAll,
  fetchProductsBySubcategoryId,
  getProductImageUrl,
} from "../../../api/ProductApi";
import { HomeStackParamList } from "../../../navigation/types";
import { normalizeProduct } from "../../../../../modules/ecommerce/utils/normalizeProduct";
import { PROMO_CARD_GAP } from "../../../constants/cardLayout";

interface Category {
  id: string | number;
  name: string;
  image?: string;
}

interface SubCategory {
  id: string | number;
  name: string;
  image?: string;
  categoryId?: string | number;
}

interface CategoryWithSubcategories extends Category {
  subcategories?: SubCategory[];
}

type CategoryProductsPage = {
  products: any[];
  nextPage?: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
};

const SIDEBAR_WIDTH = 104;
const CONTENT_PADDING = 10;
const PAGE_LIMIT = 10;
const CATEGORY_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedCategoryTree: CategoryWithSubcategories[] = [];

type CategoryRouteProp = RouteProp<HomeStackParamList, "Category">;

const resolveInitialSelection = (
  allCategories: CategoryWithSubcategories[],
  categoryId?: string | number,
  subcategoryId?: string | number,
) => {
  if (allCategories.length === 0) {
    return { category: null, subcategory: null };
  }

  const matchedCategory = allCategories.find(
    (cat) => String(cat.id) === String(categoryId)
  );
  const category = matchedCategory || allCategories[0];
  const matchedSubcategory =
    subcategoryId !== undefined && subcategoryId !== null
      ? (category.subcategories || []).find(
          (sub) => String(sub.id) === String(subcategoryId)
        )
      : undefined;

  return {
    category: category.id,
    subcategory: matchedSubcategory ? matchedSubcategory.id : null,
  };
};

export default function Categories_Product() {
  const route = useRoute<CategoryRouteProp>();
  const { categoryId, title, subcategoryId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topSpacing = Math.max(insets.top, 8);
  const HEADER_HEIGHT = Math.round(width * 0.25) + topSpacing;

  const [categories, setCategories] = useState<CategoryWithSubcategories[]>(() => cachedCategoryTree);
  const initialSelection = useMemo(
    () => resolveInitialSelection(cachedCategoryTree, categoryId, subcategoryId),
    [categoryId, subcategoryId],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number | null>(
    () => initialSelection.category,
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | number | null>(
    () => initialSelection.subcategory,
  );
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(() => cachedCategoryTree.length === 0);

  const numColumns = 2;
  const cardWidth = useMemo(() => {
    const availableWidth = width - SIDEBAR_WIDTH - CONTENT_PADDING * 2;
    return Math.floor((availableWidth - PROMO_CARD_GAP * (numColumns - 1)) / numColumns);
  }, [width, numColumns]);

  const selectedCategory = useMemo(
    () => categories.find((cat) => String(cat.id) === String(selectedCategoryId)),
    [categories, selectedCategoryId]
  );

  const subcategories = selectedCategory?.subcategories || [];

  const resolveImageUri = useCallback((path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return getProductImageUrl(path);
  }, []);

  const extractProducts = useCallback((res: any): any[] => {
    const candidates = [
      res?.products,
      res?.data?.products,
      res?.items,
      res?.data?.items,
      res?.data,
      res?.result?.products,
      res?.result?.items,
      res?.result,
    ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }

    return [];
  }, []);

  const parseQueryParams = (query: string) => {
    if (!query?.trim()) return {};
    const params = Object.fromEntries(new URLSearchParams(query));
    return Object.entries(params).reduce((acc, [key, value]) => {
      const numeric = Number(value);
      acc[key] = Number.isNaN(numeric) ? value : numeric;
      return acc;
    }, {} as Record<string, any>);
  };

  // ── Infinite Query ──────────────────────────────────────────────────────────
  const {
    data: paginatedData,
    isLoading: isProductsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<CategoryProductsPage>({
    queryKey: ["category-products", selectedCategoryId, selectedSubcategoryId, filterQuery],
    enabled: Boolean(selectedCategoryId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam) || 1;

      const queryOptions = {
        page,
        limit: PAGE_LIMIT,
        ...parseQueryParams(filterQuery),
      };

      const res = selectedSubcategoryId
        ? await fetchProductsBySubcategoryId(selectedSubcategoryId, queryOptions)
        : await fetchCategoriesByID(selectedCategoryId as string | number, queryOptions);

      const rawProducts = extractProducts(res);
      const normalized = rawProducts.map((raw: any) => {
        const n = normalizeProduct(raw);

        return {
          ...n,
          rewardCoins: n.rewardCoins,
          redeem_coins: n.redeem_coins,
        };
      });

      const hasMore = Boolean(res?.hasMore ?? res?.data?.hasMore ?? false);
      const currentPage = Number(res?.currentPage ?? res?.data?.currentPage ?? page);
      const totalPages = Number(res?.totalPages ?? res?.data?.totalPages ?? 1);
      const nextPage =
        hasMore && currentPage < totalPages ? currentPage + 1 : undefined;

      return { products: normalized, nextPage, currentPage, totalPages, hasMore };
    },
    // Uses currentPage, totalPages, and hasMore — all three fields as required
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.currentPage >= lastPage.totalPages) {
        return undefined;
      }
      return lastPage.nextPage;
    },
    staleTime: CATEGORY_CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  // Flatten all pages into a single list; new pages are appended, not replaced
  const products = useMemo(
    () => (paginatedData?.pages ?? []).flatMap((page) => page.products),
    [paginatedData?.pages]
  );

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ── Viewability-based image loading ─────────────────────────────────────────
  const visibleIdsRef = useRef<Set<string>>(new Set());
  const [, forceVisibleTick] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<any> }) => {
      let didChange = false;
      viewableItems.forEach((entry) => {
        const key = String(entry.item?.id ?? entry.item?.product_id ?? "");
        if (key && !visibleIdsRef.current.has(key)) {
          visibleIdsRef.current.add(key);
          didChange = true;
        }
      });
      if (!didChange) return;
      forceVisibleTick((p) => p + 1);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
    minimumViewTime: 60,
  }).current;

  // ── Category Loading ────────────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      if (cachedCategoryTree.length > 0) {
        setCategories(cachedCategoryTree);
        const cachedSelection = resolveInitialSelection(cachedCategoryTree, categoryId, subcategoryId);
        setSelectedCategoryId(cachedSelection.category);
        setSelectedSubcategoryId(cachedSelection.subcategory);
        setLoadingCategories(false);
      } else {
        setLoadingCategories(true);
      }

      const res = await fetchCategoriesScreenAll();
      const allCategories = Array.isArray(res?.data) ? res.data : [];
      cachedCategoryTree = allCategories;
      setCategories(allCategories);

      if (allCategories.length === 0) {
        setSelectedCategoryId(null);
        setSelectedSubcategoryId(null);
        return;
      }

      const selection = resolveInitialSelection(allCategories, categoryId, subcategoryId);
      setSelectedCategoryId(selection.category);
      setSelectedSubcategoryId(selection.subcategory);
      // useInfiniteQuery auto-fetches once selectedCategoryId is non-null
    } catch (e) {
      console.error("Category load error", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onSubcategoryPress = (id: string | number | null) => {
    setSelectedSubcategoryId(id);
    // queryKey includes selectedSubcategoryId → useInfiniteQuery reruns automatically
  };

  if (loadingCategories) {
    return (
      <View style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.fixedHeader, { height: HEADER_HEIGHT }]}>
        <ProductHead headerHeight={HEADER_HEIGHT} topSpacing={topSpacing} />
      </View>

      <View style={[styles.mainContainer, { marginTop: HEADER_HEIGHT }]}>
        <View style={styles.sidebar}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarScrollContent}
          >
            <TouchableOpacity
              onPress={() => onSubcategoryPress(null)}
              activeOpacity={0.85}
              style={styles.sidebarItemTouch}
            >
              {selectedSubcategoryId === null && (
                <View style={styles.activeAccent} />
              )}
              <View style={
                selectedSubcategoryId === null
                  ? styles.sidebarItemActive
                  : styles.sidebarItem
              }>
                <View style={[
                  styles.iconContainer,
                  selectedSubcategoryId === null && styles.iconContainerActive,
                ]}>
                  <AllIcons width={26} height={26} />
                </View>
                <Text
                  style={
                    selectedSubcategoryId === null
                      ? styles.sidebarTextActive
                      : styles.sidebarText
                  }
                  numberOfLines={2}
                >
                  All
                </Text>
              </View>
            </TouchableOpacity>

            {subcategories.map((subcategory) => {
              const isActive = String(selectedSubcategoryId) === String(subcategory.id);
              return (
                <TouchableOpacity
                  key={String(subcategory.id)}
                  onPress={() => onSubcategoryPress(subcategory.id)}
                  activeOpacity={0.85}
                  style={styles.sidebarItemTouch}
                >
                  {isActive && <View style={styles.activeAccent} />}
                  <View style={isActive ? styles.sidebarItemActive : styles.sidebarItem}>
                    <View style={[
                      styles.iconContainer,
                      isActive && styles.iconContainerActive,
                    ]}>
                      {subcategory.image ? (
                        <Image
                          source={{ uri: resolveImageUri(subcategory.image) }}
                          style={styles.categoryIcon}
                        />
                      ) : (
                        <View style={styles.placeholderIcon} />
                      )}
                    </View>
                    <Text
                      style={isActive ? styles.sidebarTextActive : styles.sidebarText}
                      numberOfLines={2}
                    >
                      {subcategory.name?.trim()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.contentArea}>
          <FlatList
            key={`products-${numColumns}`}
            data={products}
            keyExtractor={(item, index) => String(item?.id ?? index)}
            numColumns={numColumns}
            columnWrapperStyle={styles.row}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ListHeaderComponent={
              <View>
                <View style={styles.categoryRow}>
                  <MaterialIcons name="category" size={20} color="#16A34A" />
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {selectedCategory?.name || title}
                  </Text>
                </View>

                <View style={styles.line} />
                <FilterChipsRow
                  onSelect={(chip) => {
                    setFilterQuery(chip.query || "");
                    // queryKey includes filterQuery → useInfiniteQuery reruns automatically
                  }}
                />
              </View>
            }
            renderItem={({ item }) => {
              const key = String(item?.id ?? item?.product_id ?? "");
              const shouldLoadImage =
                visibleIdsRef.current.size === 0
                  ? true
                  : visibleIdsRef.current.has(key);
              return (
                <ProductCard
                  item={item}
                  cardWidth={cardWidth}
                  shouldLoadImage={shouldLoadImage}
                />
              );
            }}
            ListEmptyComponent={
              !isProductsLoading ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No products found in this category.</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#16A34A" />
                </View>
              ) : null
            }
          />
        </View>
      </View>

      {isProductsLoading && !isFetchingNextPage && (
        <ActivityIndicator style={styles.loadingIndicator} color="#16A34A" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  loaderScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },

  mainContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },

  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#F8F7FF",
    borderRightWidth: 1,
    borderRightColor: "#EDE9FE",
    shadowColor: "#8665FF",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  sidebarScrollContent: {
    paddingTop: 12,
    paddingBottom: 80,
  },

  sidebarItemTouch: {
    marginHorizontal: 6,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },

  activeAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#8665FF",
    zIndex: 1,
  },

  sidebarItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "transparent",
  },

  sidebarItemActive: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "#EDE9FE",
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  iconContainerActive: {
    backgroundColor: "#8665FF",
    borderColor: "#8665FF",
    shadowColor: "#8665FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },

  categoryIcon: {
    width: 44,
    height: 44,
    resizeMode: "cover",
    borderRadius: 22,
  },

  placeholderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },

  sidebarText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },

  sidebarTextActive: {
    fontSize: 11,
    color: "#5B47A3",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },

  contentArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  list: { flex: 1, backgroundColor: "#fff" },

  listContent: {
    paddingTop: 8,
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: 100,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: PROMO_CARD_GAP,
  },

  categoryRow: {
    minHeight: 44,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 8,
  },

  categoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  categorySliderRow: {
    paddingVertical: 8,
    gap: 10,
  },

  sliderItem: {
    width: 76,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  sliderItemActive: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },

  sliderImageWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  sliderImage: {
    width: "100%",
    height: "100%",
  },

  sliderLabel: {
    marginTop: 5,
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },

  sliderLabelActive: {
    color: "#111827",
    fontWeight: "700",
  },

  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },

  line: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 10,
  },

  emptyWrap: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  footerLoader: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
});
