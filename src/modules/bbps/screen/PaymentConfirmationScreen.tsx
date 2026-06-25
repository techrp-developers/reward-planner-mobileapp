import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import BBPSHead from '../constatnt/BBPSHead';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { createBillPayOrder, verifyBillPayPayment } from '../api/BillsAPI';
import { useAlert } from '../../ecommerce/components/alerts';

type ConfirmationRouteParams = {
  operatorName?: string;
  categoryName?: string;
  nickname?: string;
  formValues?: Record<string, string>;
  fetchBillData?: {
    success?: boolean;
    message?: string;
    data?: {
      customer?: {
        consumerNumber?: string;
        customerName?: string;
        operatorId?: string;
      };
      bill?: {
        amount?: string;
        dueDate?: string;
        billNumber?: string;
        billDate?: string;
      };
      billFetchId?: number;
      raw?: Record<string, any>;
    };
  };
};

const hasDisplayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim().length > 0;
};

const formatAmount = (value?: string | number) => {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!normalized) {
    return '';
  }

  const amount = Number(normalized);
  if (Number.isNaN(amount)) {
    return normalized;
  }

  return amount.toString();
};

const getOrderValue = (order: any, keys: string[]) => {
  for (const key of keys) {
    if (order?.[key] !== undefined && order?.[key] !== null && String(order[key]).trim()) {
      return order[key];
    }
  }

  return undefined;
};

const PaymentConfirmationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const alert = useAlert();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  const params = (route.params || {}) as ConfirmationRouteParams;
  const customer = params.fetchBillData?.data?.customer || {};
  const bill = params.fetchBillData?.data?.bill || {};
  const consumerNumber =
    customer.consumerNumber ||
    params.formValues?.utility_acc_no ||
    Object.values(params.formValues || {}).find((value) => value?.trim()) ||
    '-';
  const customerName = customer.customerName || 'Customer';
  const nickname = params.nickname || '';
  const operatorName = params.operatorName || 'Biller';
  const cardTitle = nickname ? `${nickname}- ${customerName}` : customerName;
  const cardSubTitle = `${consumerNumber}- ${operatorName}`;
  const dueDate = bill.dueDate || '-';
  const billNumber = bill.billNumber || '-';
  const billDate = bill.billDate || '-';
  const billAmount = formatAmount(bill.amount);
  const billFetchId = params.fetchBillData?.data?.billFetchId;
  const rawMessage = params.fetchBillData?.data?.raw?.message || '';
  const isBillDetailsMissing =
    !hasDisplayValue(bill.amount) &&
    !hasDisplayValue(bill.dueDate) &&
    !hasDisplayValue(bill.billNumber);
  const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
  const isProceedDisabled = processing || sanitizedAmount.length === 0;
  const headerTitle = params.categoryName ? `Pay ${params.categoryName}` : 'Pay Bill';
  const logoText = operatorName.slice(0, 2).toUpperCase() || 'BB';

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    anim.start();

    const timer = setTimeout(() => setLoading(false), 900);

    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [pulse]);

  useEffect(() => {
    if (billAmount) {
      setAmount(billAmount);
    }
  }, [billAmount]);

  useEffect(() => {
    const incomingParams = (route.params || {}) as ConfirmationRouteParams;
    console.log('🧾 PaymentConfirmationScreen params:', incomingParams);
    console.log('🧾 Customer data:', incomingParams.fetchBillData?.data?.customer || {});
    console.log('🧾 Bill data:', incomingParams.fetchBillData?.data?.bill || {});
  }, [route.params]);

  const handleProceed = async () => {
    if (!billFetchId) {
      alert.warning('Missing Bill', 'Bill fetch id is missing. Please fetch the bill again.');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        operator_id: String(customer.operatorId || ''),
        bill_fetch_id: billFetchId,
      };

      console.log('Create Bill Order Payload:', payload);
      const response = await createBillPayOrder(payload);
      console.log('Create Bill Order Response:', response);

      if (!response?.success) {
        alert.warning(
          'Order Failed',
          response?.message || 'Unable to create bill payment order.'
        );
        return;
      }

      const order = response?.data || response;
      const razorpayKey = getOrderValue(order, ['key', 'key_id', 'razorpay_key']);
      const razorpayOrderId = getOrderValue(order, ['razorpay_order_id', 'razorpayOrderId', 'order_id', 'id']);

      if (!razorpayKey || !razorpayOrderId) {
        alert.warning('Payment Failed', 'Payment order details are missing.');
        return;
      }

      const paymentResult = await RazorpayCheckout.open({
        key: razorpayKey,
        order_id: razorpayOrderId,
        amount: getOrderValue(order, ['amount']) || sanitizedAmount,
        currency: getOrderValue(order, ['currency']) || 'INR',
        name: 'RewardsPlanners',
        description: `${operatorName} bill payment`,
        prefill: {
          name: customerName,
          contact: consumerNumber,
        },
      });

      const verifyPayload = {
        ...paymentResult,
        order_id: getOrderValue(order, ['order_id', 'id']),
        transaction_id: getOrderValue(order, ['transaction_id', 'transactionId']),
      };
      console.log('Verify Bill Payment Payload:', verifyPayload);
      const verifyResponse = await verifyBillPayPayment(verifyPayload);
      console.log('Verify Bill Payment Response:', verifyResponse);

      if (!verifyResponse?.success) {
        alert.warning(
          'Payment Verification Failed',
          verifyResponse?.message || 'Unable to verify payment.'
        );
        return;
      }

      const transactionId =
        verifyResponse?.data?.transaction_id ||
        verifyResponse?.data?.transactionId ||
        verifyResponse?.transaction_id ||
        verifyResponse?.transactionId;

      if (transactionId) {
        navigation.navigate('TransactionStatusScreen', { transactionId });
        return;
      }

      navigation.navigate('OrderSuccessful');
    } catch (error: any) {
      alert.error('Error', error?.message || 'Could not create bill payment order.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BBPSHead
          title={headerTitle}
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.container}>
          <View style={styles.billCard}>
            <View style={styles.billerHeaderBlock}>
              <SkeletonBox pulse={pulse} width={48} height={48} borderRadius={24} />
              <View style={styles.skeletonHeaderTextWrap}>
                <SkeletonBox pulse={pulse} width={170} height={14} borderRadius={8} />
                <SkeletonBox pulse={pulse} width={120} height={12} borderRadius={8} style={styles.skeletonTopGap} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <SkeletonBox pulse={pulse} width={90} height={12} borderRadius={8} />
              <SkeletonBox pulse={pulse} width="100%" height={52} borderRadius={8} style={styles.skeletonTopGap} />
            </View>

            <View style={styles.infoGrid}>
              <View>
                <SkeletonBox pulse={pulse} width={58} height={10} borderRadius={8} />
                <SkeletonBox pulse={pulse} width={70} height={12} borderRadius={8} style={styles.skeletonTopGap} />
              </View>
              <View>
                <SkeletonBox pulse={pulse} width={68} height={10} borderRadius={8} />
                <SkeletonBox pulse={pulse} width={46} height={12} borderRadius={8} style={styles.skeletonTopGap} />
              </View>
            </View>
          </View>

          <View style={styles.noteCard}>
            <SkeletonBox pulse={pulse} width="100%" height={12} borderRadius={8} />
            <SkeletonBox pulse={pulse} width="95%" height={12} borderRadius={8} style={styles.skeletonTopGap} />
            <SkeletonBox pulse={pulse} width="80%" height={12} borderRadius={8} style={styles.skeletonTopGap} />
          </View>

          <SkeletonBox pulse={pulse} width="100%" height={54} borderRadius={12} style={styles.skeletonButtonGap} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BBPSHead 
        title={headerTitle}
        onBackPress={() => navigation.goBack()} 
      />

      <View style={styles.container}>
        <View style={styles.billCard}>
          <LinearGradient
            colors={['#FFFDF2', '#FFFADD']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.billerHeaderBlock}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>{logoText}</Text>
            </View>
            <View>
              <Text style={styles.customerName}>{cardTitle}</Text>
              <Text style={styles.billId}>{cardSubTitle}</Text>
            </View>
          </LinearGradient>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter Amount</Text>
            <View style={styles.amountInputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
                editable={true}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{dueDate}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bill Number</Text>
              <Text style={styles.infoValue}>{billNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bill Date</Text>
              <Text style={styles.infoValue}>{billDate}</Text>
            </View>
          </View>
        </View>

        {isBillDetailsMissing ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Bill details not available. Please verify details.
              {rawMessage ? ` ${rawMessage}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            <Text style={styles.noteHighlight}>Note:</Text> Verify the bill details and amount before proceeding. Current bill amount is {billAmount || amount || '-'}.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.proceedButton, isProceedDisabled && styles.proceedButtonDisabled]}
          activeOpacity={0.8}
          disabled={isProceedDisabled}
          onPress={handleProceed}
        >
          <LinearGradient
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            colors={isProceedDisabled ? ['#C4B5FD', '#A5B4FC'] : ['#5B47A3', '#8665FF']}
            style={styles.proceedButtonGradient}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="verified-user" size={20} color="#FFFFFF" style={styles.shieldIcon} />
                <Text style={styles.proceedText}>Proceed Securely</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    padding: 16,
    flex: 1,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 16,
  },
  billerHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4C1D95', // Deep purple d2h logo color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  billId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  inputContainer: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
  },
  warningBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  noteHighlight: {
    color: '#10B981', // Green "Note" text
    fontWeight: '700',
  },
  proceedButton: {
    height: 54,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 10,
    overflow: 'hidden',
  },
  proceedButtonDisabled: {
    opacity: 0.75,
  },
  proceedButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  shieldIcon: {
    marginRight: 8,
  },
  proceedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skeletonHeaderTextWrap: {
    marginLeft: 12,
  },
  skeletonTopGap: {
    marginTop: 8,
  },
  skeletonButtonGap: {
    marginTop: 'auto',
    marginBottom: 10,
  },
});

export default PaymentConfirmationScreen;
