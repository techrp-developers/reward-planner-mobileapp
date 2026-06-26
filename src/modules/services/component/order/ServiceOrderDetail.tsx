import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// ── Reused ecommerce common components ──────────────────────────────────────
import OrderStatusJourney, {
  type OrderStatusItem,
} from '../../../../modules/common/order/OrderStatusJourney';
import DeliveryDetailsCard from '../../../../modules/common/order/DeliveryDetailsCard';
import PriceDetailsCard from '../../../../modules/common/order/PriceDetailsCard';

// ── Service-specific components ──────────────────────────────────────────────
import ServiceOrderItemCard from './ServiceOrderItemCard';
import ServiceBundleCard from './ServiceBundleCard';

// ── API & types ──────────────────────────────────────────────────────────────
import {
  getServiceOrderDetails,
  type ServiceOrderDetails,
  type ServiceItem,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceOrderDetail'>;

// ── Status label map ─────────────────────────────────────────────────────────
const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment:  'Payment Pending',
  in_progress:      'In Progress',
  completed:        'Completed',
  cancelled:        'Cancelled',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending_payment: '#D97706',
  in_progress:     '#2563EB',
  completed:       '#16A34A',
  cancelled:       '#DC2626',
};

// ── Data transforms ──────────────────────────────────────────────────────────
function buildStatusJourney(order: ServiceOrderDetails): OrderStatusItem[] {
  return order.timeline.map(step => ({
    label: step.status,
    completed: step.completed,
  }));
}

function buildAddressLine(order: ServiceOrderDetails): string {
  const a = order.address;
  if (!a) return '';
  return [a.address1, a.address2, a.city, a.state, a.zipcode]
    .filter(Boolean)
    .join(', ');
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ServiceOrderDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { parent_order_id } = route.params;

  const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ── API call ───────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getServiceOrderDetails(parent_order_id);
      if (res?.success && res?.data) {
        setOrder(res.data as ServiceOrderDetails);
      } else {
        setError(res?.message || 'Order not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parent_order_id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder(true);
  };

  // ── Item action handlers (parent owns all side-effects) ───────────────────
  const handleCancelItem = (item: ServiceItem) => {
    Alert.alert(
      'Cancel Service',
      `Are you sure you want to cancel "${item.service_name}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: call cancel API when endpoint is available
            Alert.alert('Cancelled', `${item.service_name} has been cancelled.`);
          },
        },
      ]
    );
  };

  const handleFeedbackItem = (item: ServiceItem) => {
    // TODO: navigate to feedback screen when available
    Alert.alert('Feedback', `Rate your experience with "${item.service_name}".`);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading order details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Order not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrder()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived data (transforms live in parent, not in components) ───────────
  const statusLabel  = ORDER_STATUS_LABEL[order.status]  || order.status;
  const statusColor  = ORDER_STATUS_COLOR[order.status]  || '#6B7280';
  const journeySteps = buildStatusJourney(order);
  const addressLine  = buildAddressLine(order);
  const hasStandaloneItems = order.items.length > 0;
  const hasBundles         = order.bundles.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      >
        {/* ── Order summary card ─────────────────────────────────────── */}
        <LinearGradient
          colors={['#30205F', '#6344BD', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.orderEyebrow}>SERVICE ORDER</Text>
              <Text style={styles.orderId}>
                #{parent_order_id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={25} color="#FFF" />
            </View>
          </View>

          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>

          {/* ── Quick stats ───────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {order.items.length + order.bundles.reduce((s, b) => s + b.items.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ₹{order.total_amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{order.bundles.length || '—'}</Text>
              <Text style={styles.statLabel}>Bundles</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Standalone service items ───────────────────────────────── */}
        {hasStandaloneItems && (
          <SectionCard title={`Services (${order.items.length})`}>
            {order.items.map((item, idx) => (
              <View
                key={item.id}
                style={idx < order.items.length - 1 ? styles.itemDivider : undefined}
              >
                <ServiceOrderItemCard
                  item={item}
                  onCancelPress={handleCancelItem}
                  onFeedbackPress={handleFeedbackItem}
                />
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Bundle service items ───────────────────────────────────── */}
        {hasBundles && (
          <SectionCard title={`Bundles (${order.bundles.length})`}>
            {order.bundles.map((bundle, i) => (
              <ServiceBundleCard
                key={bundle.bundle_id}
                bundle={bundle}
                bundleIndex={i + 1}
                onCancelItem={handleCancelItem}
                onFeedbackItem={handleFeedbackItem}
              />
            ))}
          </SectionCard>
        )}

        {/* ── Order-level journey (reused ecommerce component) ──────── */}
        <SectionCard>
          <OrderStatusJourney
            headerText="Overall order progress"
            statuses={journeySteps}
          />
        </SectionCard>

        {/* ── Address (reused ecommerce component) ──────────────────── */}
        {order.address ? (
          <SectionCard>
            <DeliveryDetailsCard
              addressType={order.address.address_type?.toUpperCase() || 'HOME'}
              address={addressLine}
              name={order.address.contact_name}
              phone={order.address.contact_phone}
            />
          </SectionCard>
        ) : null}

        {/* ── Price summary (reused ecommerce component) ────────────── */}
        <SectionCard title="Payment Summary">
          <PriceDetailsCard
            itemTotal={order.total_amount}
            deliveryFee={0}
            bagDiscount={0}
            rewardDiscount={0}
            orderTotal={order.total_amount}
            rewardEarned={0}
            rewardRedeemed={0}
            paymentMethod="Online"
          />
        </SectionCard>

       

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Local layout helpers (not exported — presentational only) ─────────────────
function Header({ onBack }: { onBack: () => void }) {
  return (
    <LinearGradient
      colors={['#30205F', '#5B3CB4', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={21} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>SERVICE HUB</Text>
        <Text style={styles.headerTitle}>Order details</Text>
      </View>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="receipt-text-outline" size={21} color="#FFF" />
      </View>
    </LinearGradient>
  );
}

function SectionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}



// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F5FB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  headerCopy: { flex: 1, marginLeft: 12 },
  headerEyebrow: { color: 'rgba(255,255,255,0.64)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 1, letterSpacing: -0.3 },
  headerIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 14 },

  summaryCard: {
    borderRadius: 22,
    padding: 18,
    elevation: 5,
    shadowColor: '#33205E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderEyebrow: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  orderId: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },
  orderDate: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 3, fontWeight: '600' },
  summaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 14,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 8 },

  section: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    elevation: 2,
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#251B40',
    marginBottom: 10,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 4,
  },

  bottomPad: { height: 32 },
});
