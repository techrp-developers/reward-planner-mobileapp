import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, FlatList 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FilterBottomSheet from './FilterBottomSheet';

export default function OrderHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('30days');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // This function mimics your API call
  const fetchOrders = React.useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (timeFilter) params.append('time_filter', timeFilter);
    if (statusFilter) params.append('status', statusFilter);

    const apiUrl = `/orders-history?${params.toString()}`;
    console.log("Calling API:", apiUrl);
    // Call your axios/fetch function here with apiUrl
  }, [searchQuery, timeFilter, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 500); // Debounce search to prevent too many API calls
    return () => clearTimeout(delayDebounceFn);
  }, [fetchOrders]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#777" />
          <TextInput
            placeholder="Search your orders here"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setIsFilterVisible(true)}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color="#5B47A3" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* List of orders would go here */}
      <FlatList 
        data={[]} // Your API data
        renderItem={null}
        ListEmptyComponent={<Text style={styles.empty}>No orders found matching filters.</Text>}
      />

      <FilterBottomSheet 
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        currentTime={timeFilter}
        currentStatus={statusFilter}
        onApply={(time, status) => {
          setTimeFilter(time);
          setStatusFilter(status);
          setIsFilterVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 16, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  searchRow: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1A1A1A' },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9E4FF',
  },
  filterText: { marginLeft: 6, fontWeight: '700', color: '#5B47A3', fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' }
});