import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../navigation/types';
import { useLoan } from '../../context/LoanContext';
import { LOAN_MAX, LOAN_MIN, money, TENURES } from '../../utils/loanMath';
import { Button, Copy, useLoanColors } from '../LoanUI';
import {
  LoanOnboardingLayout,
  onboardingStyles as base,
} from '../LoanOnboardingLayout';

export default function LoanAmountScreen({
  navigation,
  route,
}: NativeStackScreenProps<
  LoanStackParamList,
  'LoanAmount' | 'LoanEligibility'
>) {
  const { amount, setAmount, months, setMonths, offer } = useLoan();
  const c = useLoanColors();
  const [draft, setDraft] = useState(String(amount));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const reviewing = route?.name === 'LoanEligibility';
  useEffect(() => {
    setDraft(String(amount));
  }, [amount]);
  const slider = useRef<View>(null);
  const geometry = useRef({ left: 0, width: 0 });
  const valid = Number(draft) >= LOAN_MIN && Number(draft) <= LOAN_MAX;
  const changeAmount = (value: number) => {
    const next = Math.max(LOAN_MIN, Math.min(LOAN_MAX, value));
    setAmount(next);
    setDraft(String(next));
    setError('');
  };
  const fromPosition = (pageX: number) => {
    if (!geometry.current.width) {
      return;
    }
    const fraction = (pageX - geometry.current.left) / geometry.current.width;
    changeAmount(
      Math.round((LOAN_MIN + fraction * (LOAN_MAX - LOAN_MIN)) / 1000) * 1000,
    );
  };
  const next = () => {
    if (!valid) {
      setError('Choose an amount between ₹10,000 and ₹3,00,000.');
      return;
    }
    setAmount(Number(draft));
    navigation.navigate(reviewing ? 'LoanSummary' : 'LoanEligibility');
  };
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Illustrative offer · Final eligibility and rates come from the lender"
      footer={
        <Button
          label={reviewing ? 'See Loan Details' : 'View Loan Details'}
          onPress={next}
        />
      }
    >
      <Text style={[styles.eyebrow, { color: c.accent }]}>
        YOUR LOAN, YOUR CHOICE
      </Text>
      <Text accessibilityRole="header" style={[base.title, { color: c.text }]}>
        {reviewing ? 'Your Loan Eligibility' : 'Select Loan Amount'}
      </Text>
      <Text style={[base.subtitle, { color: c.muted }]}>
        Choose an amount and tenure that fit your plans and your monthly budget.
      </Text>
      <LinearGradient
        colors={c.isDark ? ['#493051', '#302037'] : ['#EADBF3', '#F5EDF9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.eligibility}
      >
        <View style={styles.flex}>
          <View style={styles.limitHeading}>
            <MaterialIcons name="verified" size={16} color={c.accent} />
            <Text style={[styles.limitLabel, { color: c.accent }]}>
              Eligible up to
            </Text>
          </View>
          <Text style={[styles.limitAmount, { color: c.text }]}>
            {money(LOAN_MAX)}
          </Text>
          <Text style={[styles.limitNote, { color: c.muted }]}>
            Sample eligibility limit
          </Text>
        </View>
        <Image
          accessible={false}
          source={require('../../assets/personal-loan-welcome.png')}
          resizeMode="contain"
          style={styles.eligibilityArt}
        />
      </LinearGradient>
      <View
        style={[
          styles.amountCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Choose your loan amount
        </Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease amount by 10000"
            accessibilityState={{ disabled: amount <= LOAN_MIN }}
            disabled={amount <= LOAN_MIN}
            onPress={() => changeAmount(amount - 10000)}
            style={[
              styles.stepButton,
              {
                backgroundColor: c.tint,
                opacity: amount <= LOAN_MIN ? 0.4 : 1,
              },
            ]}
          >
            <MaterialIcons name="remove" size={23} color={c.accent} />
          </Pressable>
          <View style={styles.amountEditor}>
            <Text style={[styles.currency, { color: c.text }]}>₹</Text>
            <TextInput
              accessibilityLabel="Loan amount in rupees"
              value={
                editing
                  ? draft
                  : draft
                  ? Number(draft).toLocaleString('en-IN')
                  : ''
              }
              onFocus={() => setEditing(true)}
              onBlur={() => setEditing(false)}
              onChangeText={text => {
                const clean = text.replace(/\D/g, '').slice(0, 6);
                setDraft(clean);
                setError('');
                const value = Number(clean);
                if (value >= LOAN_MIN && value <= LOAN_MAX) {
                  setAmount(value);
                }
              }}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={next}
              selectTextOnFocus
              placeholder="1,00,000"
              placeholderTextColor={c.muted}
              style={[styles.amountInput, { color: c.text }]}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase amount by 10000"
            accessibilityState={{ disabled: amount >= LOAN_MAX }}
            disabled={amount >= LOAN_MAX}
            onPress={() => changeAmount(amount + 10000)}
            style={[
              styles.stepButton,
              {
                backgroundColor: c.tint,
                opacity: amount >= LOAN_MAX ? 0.4 : 1,
              },
            ]}
          >
            <MaterialIcons name="add" size={23} color={c.accent} />
          </Pressable>
        </View>
        <Text style={[styles.editHint, { color: c.muted }]}>
          Tap the amount to edit
        </Text>
        <View
          ref={slider}
          collapsable={false}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Loan amount slider"
          accessibilityValue={{
            min: LOAN_MIN,
            max: LOAN_MAX,
            now: amount,
            text: money(amount),
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={event =>
            changeAmount(
              amount +
                (event.nativeEvent.actionName === 'increment' ? 10000 : -10000),
            )
          }
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={event => {
            const pageX = event.nativeEvent.pageX;
            slider.current?.measureInWindow((left, _top, width) => {
              geometry.current = { left, width };
              fromPosition(pageX);
            });
          }}
          onResponderMove={event => fromPosition(event.nativeEvent.pageX)}
          style={styles.sliderTouch}
        >
          <View style={[styles.sliderTrack, { backgroundColor: c.border }]}>
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: c.accent,
                  width: `${
                    ((amount - LOAN_MIN) / (LOAN_MAX - LOAN_MIN)) * 100
                  }%`,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  borderColor: c.card,
                  backgroundColor: c.accent,
                  left: `${
                    ((amount - LOAN_MIN) / (LOAN_MAX - LOAN_MIN)) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.range}>
          <Text style={[styles.rangeText, { color: c.muted }]}>
            {money(LOAN_MIN)}
          </Text>
          <Text style={[styles.rangeText, { color: c.muted }]}>
            {money(LOAN_MAX)}
          </Text>
        </View>
        {error ? (
          <View style={styles.error}>
            <Copy error>{error}</Copy>
          </View>
        ) : null}
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Select tenure
        </Text>
        <Text style={[styles.tenureHint, { color: c.muted }]}>
          Choose how long you’d like to repay.
        </Text>
        <View style={styles.tenures}>
          {TENURES.map(tenure => (
            <Pressable
              key={tenure}
              accessibilityRole="radio"
              accessibilityLabel={`${tenure} months`}
              accessibilityState={{ checked: months === tenure }}
              onPress={() => setMonths(tenure)}
              style={[
                styles.tenure,
                {
                  backgroundColor: months === tenure ? '#4C2D56' : c.bg,
                  borderColor: months === tenure ? '#4C2D56' : c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tenureNumber,
                  { color: months === tenure ? '#FFFFFF' : c.text },
                ]}
              >
                {tenure}M
              </Text>
              {months === tenure ? (
                <MaterialIcons name="check-circle" size={13} color="#D3B8E5" />
              ) : (
                <Text style={[styles.monthsLabel, { color: c.muted }]}>
                  months
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
      <View
        style={[
          styles.emiCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <View style={[styles.emiIcon, { backgroundColor: c.tint }]}>
          <MaterialIcons name="calendar-month" size={23} color={c.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.emiLabel, { color: c.muted }]}>
            Estimated monthly EMI
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.emiAmount, { color: c.accent }]}
          >
            {valid ? money(offer.emi) : '—'}
            <Text style={[styles.perMonth, { color: c.muted }]}> / month</Text>
          </Text>
        </View>
      </View>
      <Text style={[styles.rateNote, { color: c.muted }]}>
        Illustration at 12% p.a. over {months} months. Review the full breakdown
        on the next screen.
      </Text>
    </LoanOnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: 13,
  },
  eligibility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 23,
    padding: 20,
    marginTop: 24,
    marginBottom: 19,
  },
  limitHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  limitLabel: { fontSize: 13, fontWeight: '600' },
  limitAmount: {
    fontSize: 29,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginTop: 9,
  },
  limitNote: { fontSize: 11, marginTop: 7 },
  eligibilityArt: { width: 96, height: 107 },
  amountCard: { borderWidth: 1, borderRadius: 23, padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  stepButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountEditor: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  currency: { fontSize: 25, fontWeight: '600' },
  amountInput: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    paddingVertical: 4,
    paddingHorizontal: 0,
    textAlign: 'center',
  },
  editHint: { textAlign: 'center', fontSize: 10, marginTop: 6 },
  sliderTouch: { paddingVertical: 22, marginHorizontal: 9, marginTop: 8 },
  sliderTrack: { height: 5, borderRadius: 5 },
  sliderFill: { height: 5, borderRadius: 5 },
  sliderThumb: {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 4,
    top: -9,
    marginLeft: -11,
    elevation: 2,
    shadowColor: '#4C2D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  range: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { fontSize: 11 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 23 },
  error: { marginTop: 12 },
  tenureHint: { fontSize: 12, lineHeight: 19, marginTop: 7, marginBottom: 16 },
  tenures: { flexDirection: 'row', gap: 8 },
  tenure: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    minHeight: 66,
    gap: 7,
  },
  tenureNumber: { fontSize: 17, fontWeight: '700' },
  monthsLabel: { fontSize: 9 },
  emiCard: {
    borderWidth: 1,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    marginTop: 17,
  },
  emiIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emiLabel: { fontSize: 11, marginBottom: 7 },
  emiAmount: { fontSize: 23, fontWeight: '700' },
  perMonth: { fontSize: 11, fontWeight: '400' },
  rateNote: {
    fontSize: 11,
    lineHeight: 19,
    marginTop: 12,
    paddingHorizontal: 3,
  },
});
