import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import BBPSHead from '../constatnt/BBPSHead';
import { createBillPayOrder, verifyBillPayPayment } from '../api/BillsAPI';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAlert } from '../../ecommerce/components/alerts';

const getPlanId = (plan: any) =>
  String(plan?.planId || plan?.plan_id || plan?.id || plan?.recharge_plan_id || '');

const getPlanAmount = (plan: any) =>
  String(plan?.amount || plan?.price || plan?.rs || plan?.recharge_amount || '');

const getPlanValidity = (plan: any) =>
  String(plan?.validity || plan?.validityDescription || plan?.validity_desc || '-');

const getOrderValue = (order: any, keys: string[]) => {
  for (const key of keys) {
    if (order?.[key] !== undefined && order?.[key] !== null && String(order[key]).trim()) {
      return order[key];
    }
  }

  return undefined;
};

const RechargeConfirmationScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const params = route?.params || {};
  const formValues = params.formValues || {};
  const plan = params.plan || {};
  const mobile =
    formValues.utility_acc_no ||
    Object.values(formValues).find((value: any) => String(value || '').trim()) ||
    '';
  const planId = getPlanId(plan);
  const amount = getPlanAmount(plan);

  const handleCreateOrder = async () => {
    if (!params.operatorId || !mobile || !params.circleId || !planId) {
      alert.warning('Missing Details', 'Recharge details are incomplete.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        operator_id: String(params.operatorId),
        utility_acc_no: String(mobile),
        circle_id: String(params.circleId),
        plan_id: planId,
        sender_name: user?.name || 'Customer',
      };

      console.log('Create Recharge Order Payload:', payload);
      const response = await createBillPayOrder(payload);
      console.log('Create Recharge Order Response:', response);

      if (!response?.success) {
        alert.warning(
          'Order Failed',
          response?.message || 'Unable to create recharge order.'
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
        amount: getOrderValue(order, ['amount']),
        currency: getOrderValue(order, ['currency']) || 'INR',
        name: 'RewardsPlanners',
        description: `${params.operatorName || 'Recharge'} payment`,
        prefill: {
          name: user?.name || 'Customer',
          contact: user?.phone || String(mobile),
        },
      });

      const verifyPayload = {
        ...paymentResult,
        order_id: getOrderValue(order, ['order_id', 'id']),
        transaction_id: getOrderValue(order, ['transaction_id', 'transactionId']),
      };
      console.log('Verify Recharge Payment Payload:', verifyPayload);
      const verifyResponse = await verifyBillPayPayment(verifyPayload);
      console.log('Verify Recharge Payment Response:', verifyResponse);

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
      alert.error('Error', error?.message || 'Could not create recharge order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BBPSHead
        title="Confirm Recharge"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.operatorName}>{params.operatorName || 'Operator'}</Text>
          <Text style={styles.mobileText}>{String(mobile)}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Circle</Text>
            <Text style={styles.value}>{params.circleName || params.circleId || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amount}>Rs {amount || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Validity</Text>
            <Text style={styles.value}>{getPlanValidity(plan)}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading}
          onPress={handleCreateOrder}
        >
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.button, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Proceed Securely</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  container: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 20,
  },
  operatorName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  mobileText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1, textAlign: 'right' },
  amount: { fontSize: 20, color: '#111827', fontWeight: '800' },
  button: {
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.65 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default RechargeConfirmationScreen;
