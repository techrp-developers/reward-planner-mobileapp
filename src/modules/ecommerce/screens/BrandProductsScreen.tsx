import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery } from '@tanstack/react-query';
import ProductHeadColor from '../constants/heading/Poduct_Head_Color';
import ProductCard from '../constants/product_cart/ProductCard';
import { fetchProductsByBrand } from '../api/ProductApi';
import { normalizeProduct } from '../utils/normalizeProduct';
import type { HomeStackParamList } from '../navigation/types';
import { useAppTheme } from '../../../theme/ThemeContext';

export default function BrandProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { params } = useRoute<RouteProp<HomeStackParamList, 'BrandProducts'>>();
  const brandName = params.brandName.trim();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const searchInput = useRef<TextInput>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);
  const query = useInfiniteQuery({
    queryKey: ['ecommerce', 'brand-products', brandName, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchProductsByBrand(brandName, pageParam, search),
    getNextPageParam: lastPage => lastPage.hasMore ? Number(lastPage.currentPage) + 1 : undefined,
  });
  const products = (query.data?.pages ?? []).flatMap(page => page.products.map(normalizeProduct));
  const retry = (loadMore = false) => (
    <TouchableOpacity accessibilityRole="button" style={styles.message} onPress={() => { if (loadMore) { query.fetchNextPage(); } else { query.refetch(); } }}>
      <Text style={{ color: theme.text }}>Unable to load products. Tap to retry.</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ProductHeadColor
        title={brandName}
        onBackPress={() => navigation.goBack()}
        onSearchPress={() => { setShowSearch(true); searchInput.current?.focus(); }}
      />
      {showSearch ? (
        <View style={[styles.searchRow, { borderColor: theme.border }]}>
          <TextInput
            ref={searchInput}
            autoFocus
            value={searchText}
            onChangeText={setSearchText}
            placeholder={`Search ${brandName} products`}
            accessibilityLabel={`Search ${brandName} products`}
            placeholderTextColor={theme.secondaryText}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(searchText.trim())}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close search and show all brand products"
            onPress={() => { setSearchText(''); setSearch(''); setShowSearch(false); }}
          >
            <Text style={{ color: theme.text }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {query.isPending ? (
        <ActivityIndicator style={styles.message} color={theme.text} />
      ) : query.isError && !query.data ? retry() : (
        <FlatList
          key={`${brandName}:${search}`}
          data={products}
          numColumns={2}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => { query.refetch(); }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) {
              query.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              cardWidth={(width - 44) / 2}
              shouldLoadImage
              onProductPress={(productId, product) => navigation.push('ProductDescription', {
                productId, variantId: product.variant_id,
              })}
            />
          )}
          ListEmptyComponent={<Text style={[styles.message, { color: theme.secondaryText }]}>{search ? `No ${brandName} products match “${search}”.` : 'No products available from this brand.'}</Text>}
          ListFooterComponent={query.isFetchingNextPage
            ? <ActivityIndicator style={styles.message} color={theme.text} />
            : query.isError ? retry(query.isFetchNextPageError) : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, marginTop: 12 },
  searchInput: { flex: 1, minHeight: 48, paddingRight: 12 },
  list: { flexGrow: 1, padding: 16 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  message: { padding: 24, alignItems: 'center', textAlign: 'center' },
});
