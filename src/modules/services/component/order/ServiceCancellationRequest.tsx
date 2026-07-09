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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={26} color="#111111" />
          </TouchableOpacity>

          <View style={styles.confirmCard}>
            <View style={styles.confirmCopy}>
              <Text style={styles.confirmTitle}>Order Cancellation Requested</Text>
              <Text style={styles.confirmSubtitle}>
                We've received your request and our team will review it shortly.
              </Text>
              <TouchableOpacity
                style={styles.confirmLink}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
              >
                <Text style={styles.confirmLinkText}>View Cancellation Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.successBadge}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="check" size={34} color="#FFFFFF" />
              </View>
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#18A957"
                style={styles.sparkleOne}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={14}
                color="#18A957"
                style={styles.sparkleTwo}
              />
            </View>
          </View>

          <View style={styles.confirmContent}>
            <OrderItemCard
              image={
                image_url ? (
                  <Image source={{ uri: image_url }} style={styles.productImage} />
                ) : (
                  <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
                )
              }
              title={service_name || 'Service'}
              weight={variant_name || 'Cancellation requested'}
              orderId={order_ref}
            />
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>Keep Shopping</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.confirmDivider} />

            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('MyOrder')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>View All Orders</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#6B7280" />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  confirmCard: {
    marginTop: 28,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmCopy: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 14,
  },
  confirmTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'left',
  },
  confirmSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  confirmLinkText: {
    color: '#8665FF',
    fontSize: 14,
    fontWeight: '700',
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F8ED',
  },
  successCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#18A957',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOne: {
    position: 'absolute',
    left: 8,
    top: 9,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 7,
    bottom: 10,
  },
  confirmContent: {
    marginBottom: 10,
  },
  confirmActions: {
    marginTop: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 0,
  },
  confirmActionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D4D4D',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#D4D4D8',
  },
});
