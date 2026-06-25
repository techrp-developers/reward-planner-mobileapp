import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import BBPSHead from '../constatnt/BBPSHead';
import { checkBillTransactionStatus } from '../api/BillsAPI';

const TERMINAL_STATUSES = [
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'RECONCILIATION_REQUIRED',
];

const TransactionStatusScreen = ({ navigation, route }: any) => {
  const transactionId = route?.params?.transactionId;
  const [status, setStatus] = useState('PENDING');
  const [message, setMessage] = useState('Checking transaction status...');

  useEffect(() => {
    if (!transactionId) {
      setStatus('FAILED');
      setMessage('Transaction id is missing.');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const response = await checkBillTransactionStatus(transactionId);
        const nextStatus = String(
          response?.data?.status ||
          response?.status ||
          response?.data?.transaction_status ||
          'PENDING'
        ).toUpperCase();

        if (cancelled) {
          return;
        }

        setStatus(nextStatus);
        setMessage(response?.message || response?.data?.message || 'Transaction is being processed.');

        if (!TERMINAL_STATUSES.includes(nextStatus)) {
          timer = setTimeout(poll, 4000);
        }
      } catch (error: any) {
        if (!cancelled) {
          setStatus('FAILED');
          setMessage(error?.message || 'Could not check transaction status.');
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [transactionId]);

  const isTerminal = TERMINAL_STATUSES.includes(status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BBPSHead
        title="Payment Status"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {!isTerminal ? <ActivityIndicator color="#8665FF" size="large" /> : null}
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FE' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  status: {
    marginTop: 16,
    fontSize: 20,
    color: '#111827',
    fontWeight: '800',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TransactionStatusScreen;
