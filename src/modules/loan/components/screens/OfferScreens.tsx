import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../navigation/types';
import { useLoan } from '../../context/LoanContext';
import { money } from '../../utils/loanMath';
import { Row, useLoanColors } from '../LoanUI';
import {
  FlowAmount,
  FlowLink,
  FlowNote,
  FlowPanel,
  FlowSection,
  LoanFlowScreen,
} from '../LoanFlowUI';

type Props<T extends keyof LoanStackParamList> = NativeStackScreenProps<
  LoanStackParamList,
  T
>;
export { default as LoanAmountScreen } from './LoanAmountScreen';

export function LoanSummaryScreen({ navigation }: Props<'LoanSummary'>) {
  const { offer, disbursed } = useLoan();
  return (
    <LoanFlowScreen
      eyebrow="YOUR PERSONAL LOAN OFFER"
      title="Loan Summary"
      subtitle="Every amount, fee and repayment commitment, clearly laid out."
      onBack={() => navigation.goBack()}
      actionLabel={disbursed ? 'Back to Dashboard' : 'View Repayment Schedule'}
      action={() =>
        navigation.navigate(disbursed ? 'LoanDashboard' : 'LoanSchedule')
      }
    >
      <FlowAmount
        label="YOUR MONTHLY EMI"
        value={money(offer.emi)}
        caption={`${offer.months} monthly instalments · Illustrative terms`}
      />
      <FlowPanel>
        <FlowSection>Your loan at a glance</FlowSection>
        <Row label="Selected loan amount" value={money(offer.amount)} />
        <Row label="Interest rate" value={`${offer.annualRate}% p.a.`} />
        <Row label="Processing fee (2%)" value={money(offer.fee)} />
        <Row label="Tenure" value={`${offer.months} months`} />
        <Row label="Monthly EMI" value={money(offer.emi)} accent />
        <Row label="Total repayment" value={money(offer.total)} />
        <Row label="Net disbursal after fee" value={money(offer.net)} accent />
      </FlowPanel>
      {!disbursed ? (
        <FlowLink
          label="Adjust amount & tenure"
          icon="tune"
          detail="Fine-tune your personal loan offer"
          onPress={() => navigation.navigate('LoanEligibility')}
        />
      ) : (
        <FlowLink
          label="Repayment schedule"
          icon="calendar-month"
          onPress={() => navigation.navigate('LoanSchedule', { active: true })}
        />
      )}
      <FlowNote>
        The sample processing fee is deducted upfront. The lender’s final offer
        will confirm APR, taxes, additional charges and repayment dates.
      </FlowNote>
    </LoanFlowScreen>
  );
}

export function LoanScheduleScreen({
  navigation,
  route,
}: Props<'LoanSchedule'>) {
  const { offer, paid, disbursed } = useLoan();
  const c = useLoanColors();
  const [expanded, setExpanded] = useState(false);
  const active = route?.params?.active || disbursed;
  const ceiling = Math.ceil(offer.emi / 1000) * 1000;
  return (
    <LoanFlowScreen
      eyebrow="A CLEAR REPAYMENT PLAN"
      title="Repayment Schedule"
      subtitle={`A monthly plan for your ${offer.months}-month personal loan.`}
      onBack={() => navigation.goBack()}
      actionLabel={active ? 'Back to Dashboard' : 'Continue to Agreement'}
      action={() =>
        navigation.navigate(active ? 'LoanDashboard' : 'LoanAgreement')
      }
    >
      <FlowPanel>
        <FlowSection>Your monthly instalments</FlowSection>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartCaption, { color: c.muted }]}>
            Monthly EMI
          </Text>
          <Text style={[styles.chartAmount, { color: c.accent }]}>
            {money(offer.emi)}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`${
            offer.months
          } monthly instalments of approximately ${money(
            offer.emi,
          )}. Total repayment ${money(offer.total)}.`}
          style={styles.chart}
        >
          <View style={styles.axis}>
            <Text style={[styles.axisText, { color: c.muted }]}>
              {money(ceiling)}
            </Text>
            <Text style={[styles.axisText, { color: c.muted }]}>
              {money(ceiling / 2)}
            </Text>
            <Text style={[styles.axisText, { color: c.muted }]}>₹0</Text>
          </View>
          <View style={styles.columns}>
            {offer.schedule.map(row => (
              <View key={row.number} style={styles.column}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, (row.payment / ceiling) * 124),
                      backgroundColor:
                        row.number <= paid ? '#9D7BAC' : c.accent,
                    },
                  ]}
                >
                  <View
                    style={{
                      height: `${(row.interest / row.payment) * 100}%`,
                      backgroundColor: '#D3B8E5',
                    }}
                  />
                </View>
                <Text style={[styles.month, { color: c.muted }]}>
                  {row.number === offer.months ||
                  row.number % Math.ceil(offer.months / 12) === 1 ||
                  offer.months <= 12
                    ? row.number
                    : ' '}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: c.accent }]} />
          <Text style={[styles.legendText, { color: c.muted }]}>Principal</Text>
          <View style={[styles.legendDot, { backgroundColor: '#D3B8E5' }]} />
          <Text style={[styles.legendText, { color: c.muted }]}>Interest</Text>
        </View>
      </FlowPanel>
      <FlowPanel>
        <Row label="Monthly EMI" value={money(offer.emi)} accent />
        <Row label="Tenure" value={`${offer.months} months`} />
        <Row label="Total interest" value={money(offer.interest)} />
        <Row label="Total repayment" value={money(offer.total)} accent />
      </FlowPanel>
      <FlowLink
        label={
          expanded ? 'Hide instalment breakdown' : 'View instalment breakdown'
        }
        detail="Principal, interest and balance by month"
        icon="format-list-bulleted"
        onPress={() => setExpanded(!expanded)}
      />
      {expanded ? (
        <FlowPanel>
          {offer.schedule.map(row => (
            <View
              key={row.number}
              style={[styles.instalment, { borderColor: c.border }]}
            >
              <View style={styles.chartHeader}>
                <Text style={[styles.instalmentTitle, { color: c.text }]}>
                  Month {row.number}
                  {row.number <= paid ? ' · Paid' : ''}
                </Text>
                <Text style={[styles.instalmentTitle, { color: c.accent }]}>
                  {money(row.payment)}
                </Text>
              </View>
              <Text style={[styles.breakdown, { color: c.muted }]}>
                Principal {money(row.principal)} · Interest{' '}
                {money(row.interest)}
                {'\n'}Balance after payment {money(row.balance)}
              </Text>
            </View>
          ))}
        </FlowPanel>
      ) : null}
      <FlowNote icon="event-note">
        Dates will appear after lender confirmation. Displayed amounts are
        rounded; the final instalment reconciles the remaining balance.
      </FlowNote>
    </LoanFlowScreen>
  );
}

const styles = StyleSheet.create({
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartCaption: { fontSize: 12 },
  chartAmount: { fontSize: 22, fontWeight: '700' },
  chart: { flexDirection: 'row', gap: 8, height: 154, marginTop: 23 },
  axis: { justifyContent: 'space-between', paddingBottom: 20 },
  axisText: { fontSize: 10 },
  columns: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  column: {
    flex: 1,
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, overflow: 'hidden' },
  month: {
    fontSize: 10,
    width: 22,
    alignSelf: 'center',
    height: 20,
    textAlign: 'center',
    paddingTop: 5,
  },
  legend: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, marginRight: 8 },
  instalment: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  instalmentTitle: { fontSize: 13, fontWeight: '600' },
  breakdown: { fontSize: 11, lineHeight: 20, marginTop: 7 },
});
