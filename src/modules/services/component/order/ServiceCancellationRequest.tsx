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
            <MaterialCommunityIcons name="close" size={30} color="#111827" />
          </TouchableOpacity>

          <View style={styles.confirmHero}>
            <View style={styles.confirmCopy}>
              <Text style={styles.confirmTitle}>Service Cancellation Requested</Text>
              <TouchableOpacity
                style={styles.confirmLink}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
              >
                <Text style={styles.confirmLinkText}>View Cancellation Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6D5AE6" />
              </TouchableOpacity>
            </View>

            <View style={styles.successBadge}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="check" size={42} color="#FFF" />
              </View>
              <MaterialCommunityIcons
                name="star-four-points"
                size={22}
                color="#22C55E"
                style={styles.sparkleOne}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#22C55E"
                style={styles.sparkleTwo}
              />
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
        <ServiceSummaryCard
          serviceName={service_name}
          variantName={variant_name}
          orderRef={order_ref}
          imageUrl={image_url}
        />

        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Reason For Cancellation</Text>

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
                style={styles.reasonRow}
                activeOpacity={0.75}
                onPress={() => setSelectedReason(null)}
              >
                <View style={[styles.radioOuter, styles.radioOuterActive]}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.reasonText}>{selectedReason.reason_text}</Text>
              </TouchableOpacity>

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
            </>
          ) : null}
        </View>

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
        <MaterialCommunityIcons name="chevron-left" size={34} color="#6B7280" />
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
        <Text style={styles.orderRefText}>Order ID - #{orderRef}</Text>
        <MaterialCommunityIcons name="content-copy" size={18} color="#4F46E5" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFEFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  headerBack: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4B4B4F',
    letterSpacing: -0.4,
  },
  scroll: {
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrap: {
    width: 86,
    height: 86,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 18,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4B4B4F',
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  variantName: {
    fontSize: 15,
    color: '#5C5C62',
    marginTop: 8,
    lineHeight: 20,
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  orderRefText: {
    fontSize: 18,
    color: '#737373',
    fontWeight: '700',
  },
  reasonCard: {
    marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  reasonTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#171717',
    marginBottom: 18,
    letterSpacing: -0.25,
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
    paddingVertical: 9,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  radioOuterActive: {
    borderColor: '#222',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#222',
  },
  reasonText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    color: '#55555A',
    fontWeight: '700',
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
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  commentLabel: {
    fontSize: 18,
    color: '#55555A',
    fontWeight: '500',
    marginBottom: 14,
  },
  commentInput: {
    minHeight: 96,
    fontSize: 17,
    lineHeight: 23,
    color: '#111827',
    padding: 0,
  },
  submitButton: {
    height: 58,
    marginTop: 28,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  confirmScroll: {
    flexGrow: 1,
    paddingTop: 34,
  },
  closeButton: {
    width: 54,
    height: 54,
    marginLeft: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  confirmCopy: {
    flex: 1,
    paddingRight: 12,
  },
  confirmTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.7,
  },
  confirmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  confirmLinkText: {
    color: '#6D5AE6',
    fontSize: 18,
    fontWeight: '900',
  },
  successBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  successCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOne: {
    position: 'absolute',
    left: 18,
    top: 20,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 12,
    bottom: 24,
  },
  confirmActions: {
    marginTop: 80,
    marginHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 2,
  },
  confirmActionRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmActionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4B4B4F',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#D4D4D8',
  },
});
