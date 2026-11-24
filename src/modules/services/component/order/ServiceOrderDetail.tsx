import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import RazorpayCheckout from 'react-native-razorpay';
import { useBottomTabsInset } from '../../../../bottombar/BottomTabsInsetContext';

// ── Reused ecommerce common components ──────────────────────────────────────
import DeliveryDetailsCard from '../../../../modules/common/order/DeliveryDetailsCard';
import PriceDetailsCard from '../../../../modules/common/order/PriceDetailsCard';
import OrderItemCard from '../../../../modules/common/order/OrderItemCard';
import OrderHeading from '../../../../modules/ecommerce/constants/heading/OrderHeading';
import { ORDER_PAYMENT_FLOW_ROUTES } from '../../../../modules/common/order/returnToModuleHome';

// ── Service-specific components ──────────────────────────────────────────────
import ServiceOrderItemCard from './ServiceOrderItemCard';
import ServiceBundleCard from './ServiceBundleCard';
import YouMayNeedServicesCarousel from '../constant/YouMayNeedServicesCarousel';
import RecommendedServicesCarousel from '../constant/RecommendedServicesCarousel';

// ── API & types ──────────────────────────────────────────────────────────────
import {
  getServiceInvoiceDetails,
  getServiceOrderDetails,
  type ServiceOrderDetails,
  type ServiceItem,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';
import {
  checkServicePaymentStatus,
  createServicePaymentOrder,
  getServicePaymentError,
  isServicePaymentVerified,
  verifyServicePayment,
} from '../../api/ServicepaymentAPI';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceOrderDetail'>;

const PURPLE = '#7C3AED';

// ── Data transforms ──────────────────────────────────────────────────────────
// Derives the header status from the individual service items rather than the
// single aggregated `order.status`, which can read "Payment Pending" for the
// whole order even when only one of several items hasn't been paid for.
function getOrderStatusSummary(items: ServiceItem[]): { label: string; color: string } {
  const total = items.length;

  if (total === 0) {
    return { label: 'Order Placed', color: '#6B7280' };
  }

  const cancelled = items.filter(item => item.status === 'cancelled').length;
  if (cancelled === total) {
    return { label: 'Order Cancelled', color: '#DC2626' };
  }

  const completed = items.filter(item => item.status === 'completed').length;
  if (completed === total) {
    return { label: 'Order Completed', color: '#16A34A' };
  }

  const confirmed = items.filter(item => item.status !== 'pending_payment').length;
  if (confirmed < total) {
    return { label: `${confirmed} of ${total} Services Confirmed`, color: '#D97706' };
  }

  return { label: `${completed} of ${total} Services Completed`, color: '#2563EB' };
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
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<Nav>();
  const servicesTheme = useServicesTheme();
  const bottomTabsInset = useBottomTabsInset();
  const route = useRoute<RouteT>();
  const { parent_order_id } = route.params;

  const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
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
    navigation.navigate('ServiceCancellationRequest', {
      service_order_id: item.id,
      parent_order_id: order?.parent_order_id || parent_order_id,
      order_ref: item.order_ref,
      service_name: item.service_name,
      variant_name: item.variant_name,
      image_url: item.image_url,
    });
  };

  const handleCancellationDetailsItem = (item: ServiceItem) => {
    navigation.navigate('ServiceCancellationDetails', {
      service_order_id: item.id,
      parent_order_id: order?.parent_order_id || parent_order_id,
      service_id: item.service_id,
    });
  };

  const handleFeedbackItem = (item: ServiceItem) => {
    navigation.navigate('ServiceFeedback', {
      service_order_id: item.id,
      parent_order_id: order?.parent_order_id || parent_order_id,
      order_ref: item.order_ref,
      service_name: item.service_name,
      variant_name: item.variant_name,
      image_url: item.image_url,
    });
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceDownloading(true);
      const res = await getServiceInvoiceDetails(parent_order_id);

      if (res.success === false) {
        Alert.alert('Invoice unavailable', res.message || 'Unable to find invoice for this order.');
        return;
      }

      await Share.open({
        title: 'Download Invoice',
        url: `data:application/pdf;base64,${res.base64}`,
        type: 'application/pdf',
        filename: res.fileName.replace(/\.pdf$/i, ''),
        failOnCancel: false,
        saveToFiles: Platform.OS === 'ios',
        ...(Platform.OS === 'android' ? ({ useInternalStorage: true } as Record<string, unknown>) : {}),
      });
    } catch (err: any) {
      Alert.alert(
        'Download failed',
        err?.message || 'Unable to download invoice. Please try again.'
      );
    } finally {
      setInvoiceDownloading(false);
    }
  };

  const handlePayNow = useCallback(async () => {
    if (paymentLoading) return;

    try {
      setPaymentLoading(true);

      const currentStatus = await checkServicePaymentStatus(parent_order_id);
      if (isServicePaymentVerified(currentStatus)) {
        await fetchOrder(true);
        Alert.alert('Payment confirmed', 'Your payment is already complete. Document upload is now available.');
        return;
      }

      const paymentResponse = await createServicePaymentOrder(parent_order_id);
      const payment = paymentResponse?.data;
      if (!payment?.key || !payment?.orderId || !Number(payment?.amount)) {
        throw new Error('Unable to initialize payment');
      }

      const response = await RazorpayCheckout.open({
        key: payment.key,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        order_id: payment.orderId,
        name: 'Reward Planners',
        description: `Service order ${parent_order_id}`,
        theme: { color: PURPLE },
      });

      let verified = false;
      try {
        const result = await verifyServicePayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        verified = isServicePaymentVerified(result);
      } catch {
        const reconciled = await checkServicePaymentStatus(parent_order_id);
        verified = isServicePaymentVerified(reconciled);
      }

      if (!verified) {
        Alert.alert('Payment processing', 'Your payment is still being confirmed. Please refresh this order shortly.');
        return;
      }

      await fetchOrder(true);
      Alert.alert('Payment successful', 'You can now upload the required documents.');
    } catch (error: any) {
      const message = getServicePaymentError(error, 'Unable to complete payment');
      const cancelled = /cancel|dismiss/i.test(message) || Number(error?.code) === 0;
      if (!cancelled) Alert.alert('Payment unsuccessful', message);
    } finally {
      setPaymentLoading(false);
    }
  }, [fetchOrder, parent_order_id, paymentLoading]);

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
        <OrderHeading
          title={translateUi('common:orderDetails')}
          showHomeButton
          interceptSystemBack
          isDark={servicesTheme.isDark}
          fallbackRouteNames={['MyOrder', 'Home']}
          blockedPreviousRouteNames={ORDER_PAYMENT_FLOW_ROUTES}
          onHelpPress={() => navigation.navigate('HelpForm', { context: 'services' })}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={servicesTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: servicesTheme.colors.muted }]}>Loading order details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
        <OrderHeading
          title={translateUi('common:orderDetails')}
          showHomeButton
          interceptSystemBack
          isDark={servicesTheme.isDark}
          fallbackRouteNames={['MyOrder', 'Home']}
          blockedPreviousRouteNames={ORDER_PAYMENT_FLOW_ROUTES}
          onHelpPress={() => navigation.navigate('HelpForm', { context: 'services' })}
        />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Order not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrder()}>
            <Text style={styles.retryText}>{translateUi('common:tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived data (transforms live in parent, not in components) ───────────
  const addressLine  = buildAddressLine(order);
  const hasStandaloneItems = order.items.length > 0;
  const hasBundles         = order.bundles.length > 0;
  const allServiceItems = [
    ...order.items,
    ...order.bundles.flatMap(bundle => bundle.items),
  ];
  const { label: statusLabel, color: statusColor } = getOrderStatusSummary(allServiceItems);
  const allDocuments = allServiceItems.flatMap(item => item.documents);
  const pendingDocumentCount = allDocuments.filter(document => !document.uploaded).length;
  const uploadedDocumentCount = allDocuments.length - pendingDocumentCount;
  const documentsUnlocked =
    allServiceItems.length > 0 &&
    allServiceItems.every(item => String(item.payment_status || '').toLowerCase() === 'paid');
  const documentOrderId =
    allServiceItems.find(item => item.documents.some(document => !document.uploaded))?.id ||
    allServiceItems[0]?.id ||
    0;
  const primaryService = allServiceItems[0];
  const primaryTitle = primaryService?.service_name || 'Service Order';
  const primarySubtitle =
    primaryService?.variant_name ||
    `${allServiceItems.length} service${allServiceItems.length === 1 ? '' : 's'}`;
  const primaryImage = primaryService?.image_url;
  const itemSubtotal = Number(
    order.subtotal ??
    order.summary?.subtotal ??
    allServiceItems.reduce((sum, item) => sum + Number(item.price || 0), 0),
  );
  const rewardCoinsUsed = Number(
    order.reward_coins_used ??
    order.rewards?.used ??
    order.reward_discount ??
    order.summary?.reward_coins_used ??
    0,
  );
  const rewardDiscount = Number(
    order.reward_discount ??
    order.summary?.reward_discount ??
    rewardCoinsUsed,
  );
  const rewardCoinsEarned = Number(
    order.reward_coins_earned ??
    order.rewards?.earned ??
    order.summary?.reward_coins_earned ??
    0,
  );
  const orderTotal = Number(
    order.total_amount ??
    order.summary?.total ??
    Math.max(0, itemSubtotal - rewardDiscount),
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
      <OrderHeading
        title={translateUi('common:orderDetails')}
        showHomeButton
        interceptSystemBack
        isDark={servicesTheme.isDark}
        fallbackRouteNames={['MyOrder', 'Home']}
        blockedPreviousRouteNames={ORDER_PAYMENT_FLOW_ROUTES}
        onHelpPress={() => navigation.navigate('HelpForm', { context: 'services' })}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomTabsInset + 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      >
        <OrderItemCard
          image={
            primaryImage ? (
              <Image source={{ uri: primaryImage }} style={styles.productImage} />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={34} color="#8665FF" />
            )
          }
          title={primaryTitle}
          weight={primarySubtitle}
          orderId={parent_order_id.slice(0, 8).toUpperCase()}
        />

        <View style={[styles.statusSummaryCard, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
          <View style={styles.statusSummaryHeader}>
            <Text style={[styles.statusSummaryTitle, { color: statusColor }]}>
              {statusLabel}
            </Text>
            <Text style={[styles.statusSummaryDate, { color: servicesTheme.colors.muted }]}>{formatDate(order.created_at)}</Text>
          </View>
          <Text style={[styles.statusSummaryText, { color: servicesTheme.colors.muted }]}>
            Track each service below for its individual document and completion timeline.
          </Text>
        </View>

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
                  onCancellationDetailsPress={handleCancellationDetailsItem}
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
                onCancellationDetailsItem={handleCancellationDetailsItem}
                onFeedbackItem={handleFeedbackItem}
              />
            ))}
          </SectionCard>
        )}

        {/* ── Order-level journey (reused ecommerce component) ──────── */}
        {allDocuments.length > 0 && (
          <OrderDocumentsCard
            total={allDocuments.length}
            uploaded={uploadedDocumentCount}
            pending={pendingDocumentCount}
            canUpload={documentsUnlocked}
            paymentLoading={paymentLoading}
            onPay={handlePayNow}
            onUpload={() =>
              navigation.navigate('DocumentUpload', {
                order_id: documentOrderId,
                parent_order_id: order.parent_order_id,
              })
            }
          />
        )}


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
            offerSavings={allServiceItems.reduce((sum, item) => sum + Number(item.offer?.savings || 0), 0)}
            itemTotal={itemSubtotal}
            deliveryFee={0}
            rewardDiscount={rewardDiscount}
            orderTotal={orderTotal}
            rewardEarned={rewardCoinsEarned}
            rewardRedeemed={rewardCoinsUsed}
            paymentMethod="Online"
          />
          <InvoiceDownloadRow
            downloading={invoiceDownloading}
            onDownload={handleDownloadInvoice}
          />
        </SectionCard>

        <YouMayNeedServicesCarousel />
        <RecommendedServicesCarousel
          title="Top Picks for You"
          subtitle="Popular services customers choose next"
        />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.section, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      {title ? <Text style={[styles.sectionTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

function OrderDocumentsCard({
  total,
  uploaded,
  pending,
  canUpload,
  paymentLoading,
  onPay,
  onUpload,
}: {
  total: number;
  uploaded: number;
  pending: number;
  canUpload: boolean;
  paymentLoading: boolean;
  onPay: () => void;
  onUpload: () => void;
}) {
  const { t: translateUi } = useTranslation('common');
  const servicesTheme = useServicesTheme();
  const complete = pending === 0;

  return (
    <View style={[styles.documentsCard, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <View style={[styles.documentsIcon, { backgroundColor: servicesTheme.isDark ? '#18112A' : '#F0ECFF' }]}>
        <MaterialCommunityIcons
          name={complete ? 'file-check-outline' : canUpload ? 'file-upload-outline' : 'file-lock-outline'}
          size={24}
          color={complete ? '#16A34A' : PURPLE}
        />
      </View>
      <View style={styles.documentsCopy}>
        <Text style={[styles.documentsTitle, { color: servicesTheme.colors.textStrong }]}>{translateUi('common:documents')}</Text>
        <Text style={[styles.documentsText, { color: servicesTheme.colors.muted }]}>
          {complete
            ? `${uploaded} of ${total} documents uploaded`
            : !canUpload
            ? 'Document upload unlocks after payment'
            : `${pending} document${pending > 1 ? 's' : ''} still needed`}
        </Text>
      </View>
      {complete ? (
        <View style={styles.documentsDone}>
          <MaterialCommunityIcons name="check" size={14} color="#16A34A" />
          <Text style={styles.documentsDoneText}>Complete</Text>
        </View>
      ) : canUpload ? (
        <TouchableOpacity style={styles.uploadDocumentsButton} onPress={onUpload}>
          <Text style={styles.uploadDocumentsText}>{translateUi('common:upload')}</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.payNowButton, paymentLoading && styles.payNowButtonDisabled]}
          activeOpacity={0.82}
          disabled={paymentLoading}
          onPress={onPay}
        >
          {paymentLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="credit-card-outline" size={15} color="#FFFFFF" />
              <Text style={styles.payNowText}>Pay now</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}



// ── Styles ────────────────────────────────────────────────────────────────────
function InvoiceDownloadRow({
  downloading,
  onDownload,
}: {
  downloading: boolean;
  onDownload: () => void;
}) {
  const { t: translateUi } = useTranslation('common');
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.invoiceRow, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <Text style={[styles.invoiceText, { color: servicesTheme.colors.text }]}>{translateUi('common:saveOrderCopy')}</Text>

      <TouchableOpacity
        style={[styles.invoiceButton, downloading && styles.invoiceButtonDisabled]}
        activeOpacity={0.82}
        onPress={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={servicesTheme.colors.primary} />
        ) : (
          <Text style={[styles.invoiceButtonText, { color: servicesTheme.colors.primary }]}>{translateUi('common:downloadInvoice')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  scroll: { padding: 16, paddingBottom: 8 },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  statusSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  statusSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSummaryDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusSummaryText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },




  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  documentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  documentsIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0ECFF', alignItems: 'center', justifyContent: 'center' },
  documentsCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  documentsTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  documentsText: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 3 },
  documentsDone: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9 },
  documentsDoneText: { fontSize: 10, color: '#16A34A', fontWeight: '800' },
  uploadDocumentsButton: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: PURPLE, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 },
  uploadDocumentsText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  documentsLocked: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9 },
  documentsLockedText: { fontSize: 10, color: '#64748B', fontWeight: '800' },
  payNowButton: { minWidth: 82, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#D97706', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10 },
  payNowButtonDisabled: { opacity: 0.65 },
  payNowText: { fontSize: 11, color: '#FFFFFF', fontWeight: '800' },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  invoiceText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  invoiceButton: {
    paddingLeft: 12,
    minWidth: 118,
    alignItems: 'flex-end',
  },
  invoiceButtonDisabled: {
    opacity: 0.65,
  },
  invoiceButtonText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
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
