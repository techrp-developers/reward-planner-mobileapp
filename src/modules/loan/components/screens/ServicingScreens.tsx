import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../navigation/types';
import { useLoan } from '../../context/LoanContext';
import { money } from '../../utils/loanMath';
import { Button, PreviewTools, Row, useLoanColors } from '../LoanUI';
import {
  FlowAmount,
  FlowLink,
  FlowNote,
  FlowOption,
  FlowPanel,
  FlowSection,
  FlowStatus,
  LoanFlowScreen,
} from '../LoanFlowUI';
import { PreviewDownloadButton } from '../PreviewDownloadButton';

type Props<T extends keyof LoanStackParamList> = NativeStackScreenProps<
  LoanStackParamList,
  T
>;
export function LoanDisbursementScreen({
  navigation,
  route,
}: Props<'LoanDisbursement'>) {
  const { status } = route.params;
  const { offer, signed, mandate, setDisbursed } = useLoan();
  const c = useLoanColors();
  const ready = signed && mandate;
  useEffect(() => {
    if (!ready || status !== 'processing') {
      return;
    }
    const timer = setTimeout(
      () => navigation.setParams({ status: 'success' }),
      3500,
    );
    return () => clearTimeout(timer);
  }, [ready, status, navigation]);
  const content = {
    processing: {
      title: 'Disbursement Processing',
      description:
        'Your repayment setup is complete. We’re showing how your loan transfer will be processed.',
      action: 'Processing…',
    },
    success: {
      title: 'Disbursed',
      description:
        'The sample transfer is complete. Your personal loan dashboard is ready.',
      action: 'View Details',
    },
    failed: {
      title: 'Disbursement Failed',
      description:
        'The transfer could not be completed. Try again or contact support for help.',
      action: 'Retry',
    },
    pending: {
      title: 'Disbursement Pending',
      description:
        'The transfer is still awaiting confirmation. Check its status before trying again.',
      action: 'View Status',
    },
  }[status];
  const next = () => {
    if (!ready) {
      navigation.replace('LoanMandate');
      return;
    }
    if (status === 'processing') {
      return;
    }
    if (status === 'success') {
      setDisbursed(true);
      navigation.reset({
        index: 1,
        routes: [{ name: 'LoanWelcome' }, { name: 'LoanDashboard' }],
      });
    } else {
      navigation.setParams({ status: 'processing' });
    }
  };
  return (
    <LoanFlowScreen
      eyebrow="YOUR PERSONAL LOAN"
      title={ready ? content.title : 'Complete bank setup first'}
      subtitle={
        ready
          ? content.description
          : 'A signed agreement and verified mandate are needed before disbursement.'
      }
      onBack={() => navigation.goBack()}
      actionLabel={ready ? content.action : 'Return to Bank Setup'}
      action={next}
      disabled={ready && status === 'processing'}
    >
      <FlowStatus
        tone={
          status === 'failed'
            ? 'failed'
            : status === 'success' && ready
            ? 'success'
            : 'pending'
        }
        loading={ready && status === 'processing'}
      />
      <FlowAmount
        label={
          status === 'success' ? 'SAMPLE NET CREDIT' : 'EXPECTED NET DISBURSAL'
        }
        value={money(offer.net)}
        caption="HDFC Bank · Sample account •••• 1234"
      />
      <FlowPanel>
        <Row label="Loan amount" value={money(offer.amount)} />
        <Row label="Processing fee deducted" value={money(offer.fee)} />
        <Row label="Net disbursal" value={money(offer.net)} accent />
        <Row
          label="Transfer status"
          value={ready ? `${status} · Preview` : 'Not initiated'}
        />
      </FlowPanel>
      <FlowNote icon="account-balance">
        No funds are transferred in this preview. Live credit is confirmed only
        after the lender completes the transfer.
      </FlowNote>
      {status === 'failed' ? (
        <FlowLink
          label="Contact support"
          icon="support-agent"
          detail="Get help from Rewards Planners"
          onPress={() =>
            navigation
              .getParent()
              ?.navigate('HelpForm', { context: 'dashboard' })
          }
        />
      ) : null}
      <PreviewTools>
        <FlowSection>Explore transfer states</FlowSection>
        <View style={styles.stateOptions}>
          {(['processing', 'pending', 'failed', 'success'] as const).map(
            value => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Preview transfer ${value}`}
                onPress={() => navigation.setParams({ status: value })}
                style={[
                  styles.stateChip,
                  {
                    backgroundColor: value === status ? c.tint : c.card,
                    borderColor: c.border,
                  },
                ]}
              >
                <Text style={{ color: c.accent, fontSize: 12 }}>{value}</Text>
              </Pressable>
            ),
          )}
        </View>
      </PreviewTools>
    </LoanFlowScreen>
  );
}

export function LoanDashboardScreen({ navigation }: Props<'LoanDashboard'>) {
  const { offer, paid, disbursed } = useLoan();
  const c = useLoanColors();
  const complete = paid >= offer.months;
  const principalBalance = !disbursed
    ? 0
    : paid
    ? offer.schedule[paid - 1]?.balance || 0
    : offer.amount;
  const totalPaid = offer.schedule
    .slice(0, paid)
    .reduce((sum, row) => sum + row.payment, 0);
  const nextEMI = offer.schedule[paid]?.payment || 0;
  return (
    <LoanFlowScreen
      eyebrow="YOUR LOAN, IN ONE PLACE"
      title="Loan Dashboard"
      subtitle={
        complete && disbursed
          ? 'Every instalment is complete. Your next chapter starts here.'
          : 'Track your balance, repayments and important documents.'
      }
      onBack={() => navigation.goBack()}
      actionLabel={
        !disbursed
          ? 'Complete Bank Setup'
          : complete
          ? 'View Loan Closure'
          : `Pay EMI · ${money(nextEMI)}`
      }
      action={() =>
        navigation.navigate(
          !disbursed ? 'LoanMandate' : complete ? 'LoanClosure' : 'LoanPayment',
        )
      }
    >
      <FlowAmount
        label={
          disbursed
            ? complete
              ? 'FULLY REPAID · SAMPLE LOAN'
              : 'ACTIVE PERSONAL LOAN · SAMPLE'
            : 'NO ACTIVE LOAN'
        }
        value={money(principalBalance)}
        caption="Principal outstanding"
      >
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(paid / offer.months) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.heroFooter}>
          <Text style={styles.heroCaption}>
            {paid} of {offer.months} EMIs paid
          </Text>
          <Text style={styles.heroCaption}>
            {Math.round((paid / offer.months) * 100)}%
          </Text>
        </View>
      </FlowAmount>
      <View style={styles.metricRow}>
        <View
          style={[
            styles.metric,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: c.muted }]}>
            Total paid
          </Text>
          <Text style={[styles.metricValue, { color: c.accent }]}>
            {money(totalPaid)}
          </Text>
        </View>
        <View
          style={[
            styles.metric,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: c.muted }]}>
            EMIs remaining
          </Text>
          <Text style={[styles.metricValue, { color: c.text }]}>
            {offer.months - paid}
          </Text>
        </View>
      </View>
      <FlowPanel>
        <FlowSection>
          {complete ? 'Repayment complete' : 'Your next EMI'}
        </FlowSection>
        <Row label="Amount" value={money(nextEMI)} accent />
        <Row
          label="Due date"
          value={
            complete ? 'All instalments paid' : 'Awaiting lender confirmation'
          }
        />
        <Row
          label="Repayment mandate"
          value={complete ? 'Cancelled · Sample' : 'Active · Sample'}
        />
      </FlowPanel>
      <FlowSection>Your loan documents</FlowSection>
      <FlowLink
        label="Loan Details"
        icon="description"
        detail="Your terms, charges and net disbursal"
        onPress={() => navigation.navigate('LoanSummary')}
      />
      <FlowLink
        label="Repayment Schedule"
        icon="calendar-month"
        detail="See the plan, month by month"
        onPress={() => navigation.navigate('LoanSchedule', { active: true })}
      />
      <PreviewDownloadButton
        title="Statement"
        label="Download Sample Statement"
        rows={[
          ['Loan amount', money(offer.amount)],
          ['Principal outstanding', money(principalBalance)],
          ['Instalments paid', `${paid} of ${offer.months}`],
          ['Total paid', money(totalPaid)],
          ...offer.schedule
            .slice(0, paid)
            .map(
              row =>
                [
                  `Instalment ${row.number}`,
                  `${money(row.payment)} · Sample payment`,
                ] as [string, string],
            ),
        ]}
      />
      <FlowNote icon="event-note">
        Your official due dates, statements and transaction status will come
        from the lender. These records are sample data.
      </FlowNote>
    </LoanFlowScreen>
  );
}

export function LoanPaymentScreen({ navigation }: Props<'LoanPayment'>) {
  const { offer, paid, setPaid, disbursed, setMandate } = useLoan();
  const [method, setMethod] = useState('upi');
  const locked = useRef(false);
  const complete = paid >= offer.months;
  const pay = (success: boolean) => {
    if (locked.current || !disbursed || complete) {
      return;
    }
    locked.current = true;
    if (success) {
      setPaid(value => Math.min(value + 1, offer.months));
      if (paid + 1 === offer.months) {
        setMandate(false);
      }
    }
    navigation.replace('LoanPaymentResult', { success });
  };
  return (
    <LoanFlowScreen
      eyebrow="ONE STEP CLOSER"
      title="Make Payment"
      subtitle="Choose a payment method for your next monthly instalment."
      onBack={() => navigation.goBack()}
      actionLabel={`Pay Now · ${money(offer.schedule[paid]?.payment || 0)}`}
      action={() => pay(true)}
      disabled={!disbursed || complete}
    >
      <FlowAmount
        label={`INSTALMENT ${Math.min(paid + 1, offer.months)} OF ${
          offer.months
        }`}
        value={money(offer.schedule[paid]?.payment || 0)}
        caption="Sample payment · No money is debited"
      />
      <FlowSection>Pay with</FlowSection>
      {[
        ['upi', 'UPI', 'GPay, PhonePe or another UPI app', 'qr-code-scanner'],
        [
          'bank',
          'Net Banking',
          'Use your preferred bank account',
          'account-balance',
        ],
        [
          'card',
          'Debit Card',
          'Continue securely with a debit card',
          'credit-card',
        ],
      ].map(([key, label, detail, icon]) => (
        <FlowOption
          key={key}
          label={label}
          detail={detail}
          icon={icon}
          selected={method === key}
          onPress={() => setMethod(key)}
        />
      ))}
      <FlowNote icon="autorenew">
        Your sample auto-debit mandate is already set up. In the live journey,
        check any pending bank debit before making a manual payment.
      </FlowNote>
      <PreviewTools>
        <Button
          secondary
          label="Preview a failed payment"
          onPress={() => pay(false)}
          disabled={!disbursed || complete}
        />
      </PreviewTools>
    </LoanFlowScreen>
  );
}

export function LoanPaymentResultScreen({
  navigation,
  route,
}: Props<'LoanPaymentResult'>) {
  const { success } = route.params;
  const { offer, paid, disbursed } = useLoan();
  const confirmed = success && disbursed && paid > 0;
  const complete = paid === offer.months;
  const payment = confirmed
    ? offer.schedule[paid - 1].payment
    : offer.schedule[paid]?.payment || 0;
  const dashboard = () =>
    navigation.reset({
      index: 1,
      routes: [
        { name: 'LoanWelcome' },
        { name: confirmed && complete ? 'LoanClosure' : 'LoanDashboard' },
      ],
    });
  return (
    <LoanFlowScreen
      eyebrow="YOUR REPAYMENT UPDATE"
      title={
        confirmed
          ? 'Payment Successful'
          : success
          ? 'No payment to show yet'
          : 'Payment Failed'
      }
      subtitle={
        confirmed
          ? 'Your sample payment has been recorded. You’re one instalment closer to your goal.'
          : success
          ? 'Complete a sample EMI payment before viewing its receipt.'
          : 'The payment was not recorded. Try again or choose a different method.'
      }
      onBack={dashboard}
      actionLabel={
        confirmed
          ? complete
            ? 'View Loan Closure'
            : 'Back to Dashboard'
          : success
          ? 'Back to Dashboard'
          : 'Retry'
      }
      action={
        confirmed || success
          ? dashboard
          : () => navigation.replace('LoanPayment')
      }
    >
      <FlowStatus
        tone={confirmed ? 'success' : success ? 'pending' : 'failed'}
      />
      <FlowAmount
        label={confirmed ? 'PAID IN THIS PREVIEW' : 'INSTALMENT AMOUNT'}
        value={money(payment)}
        caption={
          confirmed
            ? `EMI ${paid} of ${offer.months} · Sample transaction`
            : 'No money has been debited'
        }
      />
      {confirmed ? (
        <>
          <FlowPanel>
            <Row label="Payment status" value="Successful · Sample" />
            <Row
              label="Instalments remaining"
              value={String(offer.months - paid)}
            />
            <Row label="Real transaction" value="Not applicable" />
          </FlowPanel>
          <PreviewDownloadButton
            title="Receipt"
            label="Download Sample Receipt"
            rows={[
              [`Instalment ${paid}`, money(payment)],
              ['Status', 'Sample payment only'],
              ['Transaction reference', 'Not applicable — no real payment'],
            ]}
          />
        </>
      ) : !success ? (
        <FlowLink
          label="Try Different Method"
          icon="swap-horiz"
          detail="Choose another way to pay"
          onPress={() => navigation.replace('LoanPayment')}
        />
      ) : null}
      <FlowNote>
        {confirmed
          ? 'A live receipt is issued only after payment settlement is confirmed by the gateway.'
          : 'In a live transaction, a pending payment must be checked before retrying to avoid duplicate charges.'}
      </FlowNote>
    </LoanFlowScreen>
  );
}

export function LoanClosureScreen({ navigation }: Props<'LoanClosure'>) {
  const { offer, paid, disbursed } = useLoan();
  const complete = disbursed && paid === offer.months;
  return (
    <LoanFlowScreen
      eyebrow={
        complete ? 'A MILESTONE WORTH CELEBRATING' : 'YOUR REPAYMENT JOURNEY'
      }
      title={
        complete ? 'Congratulations!' : 'Your journey is still in progress'
      }
      subtitle={
        complete
          ? 'You’ve successfully repaid your personal loan in this sample journey.'
          : 'Complete every instalment before viewing the loan closure and NOC.'
      }
      artwork={complete ? 'closure' : undefined}
      onBack={() => navigation.goBack()}
      actionLabel="Back to Dashboard"
      action={() => navigation.navigate('LoanDashboard')}
    >
      {complete ? (
        <>
          <FlowPanel>
            <FlowSection>Your loan is fully repaid</FlowSection>
            <Row label="Outstanding amount" value="₹0" accent />
            <Row
              label="Instalments paid"
              value={`${paid} of ${offer.months}`}
            />
            <Row label="Loan status" value="Closed · Sample" />
            <Row label="Repayment mandate" value="Cancelled · Sample" />
          </FlowPanel>
          <PreviewDownloadButton
            title="NOC"
            label="Download Sample NOC"
            rows={[
              ['Loan amount', money(offer.amount)],
              ['Instalments', `${offer.months} completed in preview`],
              ['Outstanding', '₹0 (sample)'],
              ['Legal validity', 'None — sample document'],
            ]}
          />
          <FlowNote icon="verified">
            Your official NOC will be issued by the lender after all repayments
            and closure checks are confirmed. This export is a sample.
          </FlowNote>
        </>
      ) : (
        <>
          <FlowStatus tone="pending" />
          <FlowNote>
            The NOC becomes available only after the final confirmed repayment.
          </FlowNote>
        </>
      )}
    </LoanFlowScreen>
  );
}

const styles = StyleSheet.create({
  stateOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#FFFFFF25',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 26,
  },
  progressFill: { height: 5, borderRadius: 5, backgroundColor: '#D3B8E5' },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  heroCaption: { color: '#EADDED', fontSize: 11 },
  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  metric: { flex: 1, padding: 17, borderWidth: 1, borderRadius: 18 },
  metricLabel: { fontSize: 11, lineHeight: 19 },
  metricValue: { fontSize: 22, fontWeight: '700', marginTop: 9 },
});
