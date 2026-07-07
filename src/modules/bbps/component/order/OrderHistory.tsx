import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';

import OrderHeading from '../../../ecommerce/constants/heading/OrderHeading';
import BBPSOrderFilterSheet, {
  BBPSOrderStatus,
  BBPSOrderTime,
  STATUS_LABELS,
  TIME_LABELS,
} from './BBPSOrderFilterSheet';
import { bbpsOrderHistoryQueryKey, fetchOrderHistory, OrderHistoryItem } from '../../api/BillsAPI';

type TemporaryOrder = {
  id: string;
  title: string;
  amount: number;
  status: BBPSOrderStatus;
  statusText: string;
  dateLabel: string;
  dateValue: string;
  month: string;
};

const ORDER_HISTORY_PAGE_LIMIT = 50;

const STATUS_TEXT: Record<string, string> = {
  SUCCESS: 'Successful',
  FAILED: 'Failed',
  RECONCILIATION_REQUIRED: 'Reconciliation Required',
  REFUNDED: 'Refunded',
  REFUND_PENDING: 'Refund In Progress',
  RETRYING: 'Retrying',
  PENDING: 'Processing',
};

const mapOrderStatus = (finalStatus: string): BBPSOrderStatus => {
  switch (finalStatus) {
    case 'SUCCESS':
      return 'successful';
    case 'FAILED':
    case 'RECONCILIATION_REQUIRED':
      return 'failed';
    case 'REFUNDED':
    case 'REFUND_PENDING':
      return 'refunded';
    default:
      return 'pending';
  }
};

const toTemporaryOrder = (item: OrderHistoryItem): TemporaryOrder => {
  const created = new Date(item.created_at);
  const validDate = !Number.isNaN(created.getTime());

  return {
    id: String(item.provider_client_ref_id || item.id),
    title: item.operator_name || `Operator #${item.operator_id}`,
    amount: Number(item.amount) || 0,
    status: mapOrderStatus(item.final_status),
    statusText: STATUS_TEXT[item.final_status] || 'Processing',
    dateLabel: validDate
      ? created.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })
      : '-',
    dateValue: item.created_at,
    month: validDate
      ? created.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : 'Unknown',
  };
};

const matchesTimeFilter = (dateValue: string, filter: BBPSOrderTime) => {
  if (!filter) return true;
  const date = new Date(dateValue);
  const now = new Date();
  if (/^\d{4}$/.test(filter)) return date.getFullYear() === Number(filter);
  if (filter === 'currentYear') return date.getFullYear() === now.getFullYear();

  const days = { '30days': 30, '3months': 90, '6months': 180 }[filter] ?? 0;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff && date <= now;
};

function statusTextStyle(status: BBPSOrderStatus) {
  switch (status) {
    case 'successful':
      return styles.success;
    case 'refunded':
      return styles.refunded;
    case 'failed':
      return styles.failed;
    default:
      return styles.pending;
  }
}

const OrderCard = ({ order }: { order: TemporaryOrder }) => (
  <View style={styles.orderCard}>
    <View style={styles.logoWrap}>
      <MaterialCommunityIcons name="receipt-text-outline" size={26} color="#8665FF" />
    </View>
    <View style={styles.orderDetails}>
      <Text style={styles.orderTitle} numberOfLines={1}>{order.title}</Text>
      <Text style={styles.orderId}>{order.id}</Text>
      <Text style={[styles.orderStatus, statusTextStyle(order.status)]}>
        {`\u20B9${order.amount.toLocaleString('en-IN')}, ${order.statusText}`}
      </Text>
      <Text style={styles.orderDate}>{order.dateLabel}</Text>
    </View>
  </View>
);

function OrderHistory({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BBPSOrderStatus>('');
  const [timeFilter, setTimeFilter] = useState<BBPSOrderTime>('');
  const [filterVisible, setFilterVisible] = useState(false);

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: bbpsOrderHistoryQueryKey({ limit: ORDER_HISTORY_PAGE_LIMIT }),
    queryFn: () => fetchOrderHistory({ limit: ORDER_HISTORY_PAGE_LIMIT }),
  });

  const orders = useMemo(
    () => (data?.orders || []).map(toTemporaryOrder),
    [data?.orders]
  );

  const groupedOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const matchesSearch = !query || [order.title, order.id, order.statusText]
        .some((value) => value.toLowerCase().includes(query));
      return matchesSearch
        && (!statusFilter || order.status === statusFilter)
        && matchesTimeFilter(order.dateValue, timeFilter);
    });

    return filtered.reduce<Array<{ month: string; orders: TemporaryOrder[] }>>((groups, order) => {
      const group = groups.find((item) => item.month === order.month);
      if (group) group.orders.push(order);
      else groups.push({ month: order.month, orders: [order] });
      return groups;
    }, []);
  }, [orders, search, statusFilter, timeFilter]);

  return (
    <View style={styles.container}>
      <OrderHeading
        title="My Orders"
        onBackPress={() => navigation.goBack()}
        onHelpPress={() => navigation.navigate('HelpForm')}
      />

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={24} color="#4B5563" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search transactions" placeholderTextColor="#8B8B91" style={styles.searchInput} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={19} color="#A1A1AA" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <MaterialCommunityIcons name="tune-variant" size={25} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {(statusFilter || timeFilter) && (
        <View style={styles.activeFilters}>
          {statusFilter && <FilterChip label={STATUS_LABELS[statusFilter]} onPress={() => setStatusFilter('')} />}
          {timeFilter && <FilterChip label={TIME_LABELS[timeFilter] || timeFilter} onPress={() => setTimeFilter('')} />}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#8665FF" size="large" />
          </View>
        ) : isError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Could not load transactions</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : groupedOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No transaction found</Text>
          </View>
        ) : groupedOrders.map((group) => {
          const total = group.orders.reduce((sum, order) => sum + order.amount, 0);
          return (
            <View key={group.month}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthText}>{group.month}</Text>
                <Text style={styles.monthTotal}>{`\u20B9${total.toLocaleString('en-IN')}`}</Text>
              </View>
              {group.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </View>
          );
        })}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <BBPSOrderFilterSheet
        visible={filterVisible}
        currentStatus={statusFilter}
        currentTime={timeFilter}
        onClose={() => setFilterVisible(false)}
        onApply={(status, time) => {
          setStatusFilter(status);
          setTimeFilter(time);
          setFilterVisible(false);
        }}
      />
    </View>
  );
}

const FilterChip = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.activeChip} onPress={onPress}>
    <Text style={styles.activeChipText}>{label}</Text>
    <MaterialCommunityIcons name="close" size={18} color="#52525B" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFCFA' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  searchBox: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D8E5E3', borderRadius: 10, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, paddingVertical: 0, color: '#27272A', fontSize: 14 },
  filterButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8E5E3', borderRadius: 10, backgroundColor: '#FFFFFF' },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: '#D8E5E3', borderRadius: 10, backgroundColor: '#FFFFFF' },
  activeChipText: { color: '#71717A', fontSize: 12, fontWeight: '600' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#F0F1FF' },
  monthText: { color: '#4B4B52', fontSize: 14, fontWeight: '800' },
  monthTotal: { color: '#3F3F46', fontSize: 14, fontWeight: '800' },
  orderCard: { flexDirection: 'row', alignItems: 'center', minHeight: 114, marginHorizontal: 14, marginTop: 10, padding: 12, borderWidth: 1, borderColor: '#ECECEF', borderRadius: 13, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 1 },
  logoWrap: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D4D4D8', borderRadius: 25, backgroundColor: '#FFFFFF' },
  orderDetails: { flex: 1, minWidth: 0, marginLeft: 12 },
  orderTitle: { color: '#4B4B52', fontSize: 14, fontWeight: '800' },
  orderId: { marginTop: 1, color: '#52525B', fontSize: 12, fontWeight: '700' },
  orderStatus: { marginTop: 5, fontSize: 12, fontWeight: '800' },
  success: { color: '#08A85A' },
  failed: { color: '#F04A24' },
  pending: { color: '#8665FF' },
  refunded: { color: '#D97706' },
  orderDate: { marginTop: 4, color: '#71717A', fontSize: 11 },
  retryButton: { minWidth: 72, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.25, borderColor: '#8665FF', borderRadius: 9 },
  retryText: { color: '#6D4ACB', fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  emptyTitle: { marginTop: 18, color: '#3F3F46', fontSize: 16, fontWeight: '800' },
  bottomSpace: { height: 24 },
});

export default OrderHistory;
