import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import OrderItemCard from '../../../../modules/common/order/OrderItemCard';
import {
  getServiceCancellationReasons,
  requestServiceOrderCancellation,
  type ServiceCancellationReason,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceCancellationRequest'>;

const PURPLE = '#7C3AED';

export default function ServiceCancellationRequest() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const {
    service_order_id,
    parent_order_id,
    order_ref,
    service_name,
    variant_name,
    image_url,
  } = route.params;

  const [reasons, setReasons] = useState<ServiceCancellationReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<ServiceCancellationReason | null>(null);
  const [comment, setComment] = useState('');
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadReasons = useCallback(async () => {
    setLoadingReasons(true);
    try {
      const res = await getServiceCancellationReasons();
      setReasons(res.reasons);
    } catch (err: any) {
      Alert.alert(
        'Unable to load reasons',
        err?.message || 'Please try again in a moment.'
      );
      setReasons([]);
    } finally {
      setLoadingReasons(false);
    }
  }, []);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const isReasonOther = /isn.t listed|not listed|other/i.test(
    selectedReason?.reason_text || ''
  );
  const isSubmitDisabled =
    !selectedReason || submitting || (isReasonOther && comment.trim().length === 0);

  const submitCancellation = async () => {
    if (!selectedReason) {
      Alert.alert('Reason required', 'Please select a cancellation reason.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestServiceOrderCancellation({
        service_order_id,
        reason_id: selectedReason.reason_id,
        comment,
      });

      if (res?.success) {
        setSubmitted(true);
        return;
      }

      Alert.alert('Request failed', res?.message || 'Unable to submit cancellation request.');
    } catch (err: any) {
      Alert.alert(
        'Request failed',
        err?.message || 'Unable to submit cancellation request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.confirmScroll}>
          <LinearGradient
            colors={['#30205F', '#5B3CB4', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmTop}
          >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.confirmHero}>
            <View style={styles.confirmCopy}>
              <Text style={styles.confirmEyebrow}>REQUEST SUBMITTED</Text>
              <Text style={styles.confirmTitle}>Cancellation Requested</Text>
              <Text style={styles.confirmSubtitle}>
                We’ve received your request and our team will review it shortly.
              </Text>
              <TouchableOpacity
                style={styles.confirmLink}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
              >
                <Text style={styles.confirmLinkText}>View Request Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.successBadge}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="clock-check-outline" size={32} color="#FFF" />
              </View>
              <MaterialCommunityIcons
                name="star-four-points"
                size={22}
                color="#FFF"
                style={styles.sparkleOne}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#FFF"
                style={styles.sparkleTwo}
              />
            </View>
          </View>
          </LinearGradient>

          <View style={styles.confirmContent}>
            <ServiceSummaryCard
              serviceName={service_name}
              variantName={variant_name}
              orderRef={order_ref}
              imageUrl={image_url}
            />

            <View style={styles.reviewCard}>
              <View style={styles.reviewIcon}>
                <MaterialCommunityIcons name="progress-clock" size={22} color={PURPLE} />
              </View>
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewTitle}>Request under review</Text>
                <Text style={styles.reviewText}>
                  Your service remains in request status until the cancellation is reviewed.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>Keep Shopping</Text>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.confirmDivider} />

            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('MyOrder')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>View All Orders</Text>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Request Cancellation" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <OrderItemCard
          image={
            image_url ? (
              <Image source={{ uri: image_url }} style={styles.productImage} />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
            )
          }
          title={service_name || 'Service'}
          weight={variant_name || 'Service cancellation request'}
          orderId={order_ref}
        />

        <View style={styles.reasonCard}>
          <View style={styles.reasonHeader}>
            <Text style={styles.reasonTitle}>Reason For Cancellation</Text>
          </View>

          {loadingReasons ? (
            <View style={styles.loadingReasons}>
              <ActivityIndicator color={PURPLE} />
              <Text style={styles.loadingReasonText}>Loading reasons...</Text>
            </View>
          ) : null}

          {!loadingReasons && !selectedReason && reasons.map(reason => (
            <TouchableOpacity
              key={reason.reason_id}
              style={styles.reasonRow}
              activeOpacity={0.75}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={styles.radioOuter} />
              <Text style={styles.reasonText}>{reason.reason_text}</Text>
            </TouchableOpacity>
          ))}

          {!loadingReasons && !selectedReason && reasons.length === 0 ? (
            <View style={styles.emptyReasonBox}>
              <Text style={styles.emptyReasonText}>
                No cancellation reasons are available right now.
              </Text>
              <TouchableOpacity onPress={loadReasons} style={styles.retryReasonsButton}>
                <Text style={styles.retryReasonsText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedReason ? (
            <>
              <TouchableOpacity
                style={[styles.reasonRow, styles.reasonRowSelected]}
                activeOpacity={0.75}
                onPress={() => setSelectedReason(null)}
              >
                <View style={[styles.radioOuter, styles.radioOuterActive]}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.reasonText}>{selectedReason.reason_text}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {selectedReason ? (
          <View style={styles.commentBox}>
            <Text style={styles.commentLabel}>
              Comments{isReasonOther ? '*' : ''}
            </Text>
            <TextInput
              placeholder="Enter any specific questions or requirements you'd like to share"
              placeholderTextColor="#9CA3AF"
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
              style={styles.commentInput}
            />
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitDisabled}
          onPress={submitCancellation}
        >
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit Request</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerBack}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={34} color="#777777" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function ServiceSummaryCard({
  serviceName,
  variantName,
  orderRef,
  imageUrl,
}: {
  serviceName: string;
  variantName?: string;
  orderRef: string;
  imageUrl?: string | null;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryAccent} />
      <View style={styles.summaryTop}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
          )}
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.serviceName} numberOfLines={2}>{serviceName}</Text>
          <Text style={styles.variantName} numberOfLines={2}>
            {variantName || 'Service cancellation request'}
          </Text>
        </View>
      </View>

      <View style={styles.orderRefRow}>
        <View>
          <Text style={styles.orderRefLabel}>ORDER ID</Text>
          <Text style={styles.orderRefText}>Order ID- #{orderRef}</Text>
        </View>
        <View style={styles.copyButton}>
          <MaterialCommunityIcons name="content-copy" size={16} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  summaryCard: {
    paddingHorizontal: 36,
    paddingTop: 34,
    paddingBottom: 28,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PURPLE,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EEFF',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 28,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4B4B4B',
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  variantName: {
    fontSize: 18,
    color: '#555555',
    marginTop: 18,
    lineHeight: 25,
    fontWeight: '500',
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },
  orderRefLabel: {
    display: 'none',
  },
  orderRefText: {
    fontSize: 18,
    color: '#767676',
    fontWeight: '700',
  },
  copyButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  reasonCard: {
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  reasonHeader: {
    marginBottom: 12,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  loadingReasons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingReasonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reasonRowSelected: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: '#6D5AE6',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6D5AE6',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
    fontWeight: '400',
  },
  changeReasonText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '900',
  },
  emptyReasonBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  emptyReasonText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  retryReasonsButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  retryReasonsText: {
    fontSize: 13,
    color: PURPLE,
    fontWeight: '800',
  },
  commentBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  commentInput: {
    minHeight: 80,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  submitButton: {
    height: 52,
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmScroll: {
    flexGrow: 1,
    backgroundColor: '#F6F5FB',
    paddingBottom: 32,
  },
  confirmTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 72,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  confirmHero: {
    marginTop: 22,
    alignItems: 'center',
  },
  confirmCopy: {
    alignItems: 'center',
  },
  confirmEyebrow: {
    marginTop: 18,
    fontSize: 10,
    color: 'rgba(255,255,255,0.66)',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  confirmTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.7,
    marginTop: 5,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.76)',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  confirmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  confirmLinkText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOne: {
    position: 'absolute',
    left: 13,
    top: 15,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 10,
    bottom: 17,
  },
  confirmContent: {
    marginTop: -46,
    paddingHorizontal: 20,
    gap: 14,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  reviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    marginRight: 12,
  },
  reviewCopy: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 14,
    color: '#251B40',
    fontWeight: '900',
  },
  reviewText: {
    fontSize: 12,
    color: '#817A91',
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 4,
  },
  confirmActions: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  confirmActionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmActionText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#251B40',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#D4D4D8',
  },
});
