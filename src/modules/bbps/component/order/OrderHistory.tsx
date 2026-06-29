import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import EmptyOrders from '../../../../assets/product/EmptyCart.svg';
import OrderHeading from '../../../ecommerce/constants/heading/OrderHeading';
import jio from '../../assets/Sample/jio.png';
import vi from '../../assets/Sample/VI_Card.png';
import bill1 from '../../assets/Sample/HDFC.png';
import bill2 from '../../assets/Sample/SBI_card.png';
import BBPSOrderFilterSheet, {
  BBPSOrderStatus,
  BBPSOrderTime,
  STATUS_LABELS,
  TIME_LABELS,
} from './BBPSOrderFilterSheet';

type TemporaryOrder = {
  id: string;
  icon: any;
  title: string;
  amount: number;
  status: BBPSOrderStatus;
  statusText: string;
  dateLabel: string;
  dateValue: string;
  month: string;
  repeatable?: boolean;
};

const TEMPORARY_ORDERS: TemporaryOrder[] = [
  { id: '9175334410', icon: vi, title: 'Recharge of VI Mobile', amount: 249, status: 'successful', statusText: 'Your order is successful', dateLabel: '23 Jan 2026, 7:34 PM', dateValue: '2026-01-23T19:34:00', month: 'January 2026', repeatable: true },
  { id: 'Payment', icon: bill1, title: 'Groww', amount: 5490, status: 'failed', statusText: 'Failed', dateLabel: '22 Jan 2026, 5:34 PM', dateValue: '2026-01-22T17:34:00', month: 'January 2026' },
  { id: '736263728', icon: bill2, title: 'DTH Recharge', amount: 446, status: 'failed', statusText: 'Your order failed', dateLabel: '16 Jan 2026, 9:23 PM', dateValue: '2026-01-16T21:23:00', month: 'January 2026' },
  { id: '7293334410', icon: jio, title: 'Recharge of Jio Mobile', amount: 549, status: 'successful', statusText: 'Your order is successful', dateLabel: '22 Jan 2026, 5:34 PM', dateValue: '2026-01-22T17:34:00', month: 'January 2026', repeatable: true },
  { id: '9175334410-dec', icon: vi, title: 'Recharge of VI Mobile', amount: 249, status: 'successful', statusText: 'Your order is successful', dateLabel: '23 Dec 2025, 7:34 PM', dateValue: '2025-12-23T19:34:00', month: 'December 2025', repeatable: true },
  { id: '7293334410-dec', icon: jio, title: 'Recharge of Jio Mobile', amount: 549, status: 'successful', statusText: 'Your order is successful', dateLabel: '22 Dec 2025, 5:34 PM', dateValue: '2025-12-22T17:34:00', month: 'December 2025', repeatable: true },
];

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

const OrderCard = ({ order }: { order: TemporaryOrder }) => (
  <View style={styles.orderCard}>
    <View style={styles.logoWrap}>
      <Image source={order.icon} style={styles.operatorLogo} resizeMode="contain" />
    </View>
    <View style={styles.orderDetails}>
      <Text style={styles.orderTitle} numberOfLines={1}>{order.title}</Text>
      <Text style={styles.orderId}>{order.id.replace('-dec', '')}</Text>
      <Text style={[styles.orderStatus, order.status === 'successful' ? styles.success : styles.failed]}>
        {`\u20B9${order.amount.toLocaleString('en-IN')}, ${order.statusText}`}
      </Text>
      <Text style={styles.orderDate}>{order.dateLabel}</Text>
    </View>
    {order.repeatable && (
      <TouchableOpacity style={styles.repeatButton} activeOpacity={0.8}>
        <Text style={styles.repeatText}>Repeat</Text>
      </TouchableOpacity>
    )}
  </View>
);

function OrderHistory({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BBPSOrderStatus>('');
  const [timeFilter, setTimeFilter] = useState<BBPSOrderTime>('');
  const [filterVisible, setFilterVisible] = useState(false);

  const groupedOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = TEMPORARY_ORDERS.filter((order) => {
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
  }, [search, statusFilter, timeFilter]);

  const clearFilters = () => {
    setStatusFilter('');
    setTimeFilter('');
    setSearch('');
  };

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

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {groupedOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyArt}><EmptyOrders width={210} height={210} /></View>
            <Text style={styles.emptyTitle}>No transactions found!</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.olderOrders}>View Older Orders</Text>
            </TouchableOpacity>
          </View>
        ) : groupedOrders.map((group) => {
          const total = group.orders.reduce((sum, order) => sum + order.amount, 0);
          return (
            <View key={group.month}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthText}>{group.month}</Text>
                <Text style={styles.monthTotal}>{`\u20B9${total.toLocaleString('en-IN')}`}</Text>
              </View>
              {group.orders.map((order) => <OrderCard key={order.id} order={order} />)}
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
  operatorLogo: { width: 36, height: 36, borderRadius: 18 },
  orderDetails: { flex: 1, minWidth: 0, marginLeft: 12 },
  orderTitle: { color: '#4B4B52', fontSize: 14, fontWeight: '800' },
  orderId: { marginTop: 1, color: '#52525B', fontSize: 12, fontWeight: '700' },
  orderStatus: { marginTop: 5, fontSize: 12, fontWeight: '800' },
  success: { color: '#08A85A' },
  failed: { color: '#F04A24' },
  orderDate: { marginTop: 4, color: '#71717A', fontSize: 11 },
  repeatButton: { minWidth: 72, marginLeft: 6, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.25, borderColor: '#8665FF', borderRadius: 9 },
  repeatText: { color: '#6D4ACB', fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  emptyArt: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', borderRadius: 110, backgroundColor: '#F3F1FF' },
  emptyTitle: { marginTop: 26, color: '#3F3F46', fontSize: 16, fontWeight: '800' },
  olderOrders: { marginTop: 10, color: '#6D4ACB', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  bottomSpace: { height: 24 },
});

export default OrderHistory;
