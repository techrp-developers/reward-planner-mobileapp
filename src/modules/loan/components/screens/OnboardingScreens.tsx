import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { LoanStackParamList } from '../../navigation/types';
import { useLoan } from '../../context/LoanContext';
import { Button, Copy, useLoanColors } from '../LoanUI';
import { LoanFlowScreen, FlowNote } from '../LoanFlowUI';
import {
  LoanOnboardingLayout,
  onboardingStyles as base,
} from '../LoanOnboardingLayout';

type Props<T extends keyof LoanStackParamList> = NativeStackScreenProps<
  LoanStackParamList,
  T
>;

export function LoanWelcomeScreen({ navigation }: Props<'LoanWelcome'>) {
  const c = useLoanColors();
  const { height } = useWindowDimensions();
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Get Started"
          onPress={() => navigation.navigate('LoanMobile')}
        />
      }
    >
      <View style={base.center}>
        <View
          style={[
            styles.productBadge,
            { backgroundColor: c.tint, borderColor: c.border },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={13} color={c.accent} />
          <Text style={[styles.productText, { color: c.accent }]}>
            PERSONAL LOAN
          </Text>
        </View>
        <Text style={[styles.productName, { color: c.accent }]}>
          RP Quick Loan
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.welcomeTitle, { color: c.text }]}
        >
          Quick loans for a{'\n'}brighter tomorrow.
        </Text>
        <Text style={[base.subtitle, { color: c.muted }]}>
          Fast. Secure. Simple.
        </Text>
        <View style={styles.illustrationWrap}>
          <View
            style={[styles.illustrationGlow, { backgroundColor: c.tint }]}
          />
          <Image
            accessibilityLabel="Personal loan illustration with a rupee coin, supporting hand and lavender leaves"
            source={require('../../assets/personal-loan-welcome.png')}
            resizeMode="contain"
            style={[
              styles.illustration,
              { height: Math.max(175, Math.min(260, height * 0.29)) },
            ]}
          />
          <View
            style={[
              styles.imageBadge,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <MaterialIcons name="verified-user" size={15} color={c.accent} />
            <Text style={[styles.imageBadgeText, { color: c.text }]}>
              Made for your next step
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.benefits,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        {[
          [
            'bolt',
            'Fast eligibility review',
            'Understand your options before you apply',
          ],
          [
            'description',
            'Essential documents only',
            'Upload once for a simpler application',
          ],
          [
            'verified-user',
            'Your data, in your control',
            'Review your details before continuing',
          ],
        ].map(([icon, title, description], index) => (
          <View
            key={title}
            style={[
              styles.benefit,
              index < 2 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.border,
              },
            ]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: c.tint }]}>
              <MaterialIcons name={icon} size={21} color={c.accent} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.benefitTitle, { color: c.text }]}>
                {title}
              </Text>
              <Text style={[styles.benefitDetail, { color: c.muted }]}>
                {description}
              </Text>
            </View>
            <MaterialIcons
              name="check-circle-outline"
              size={16}
              color={c.accent}
            />
          </View>
        ))}
      </View>
    </LoanOnboardingLayout>
  );
}

export function LoanMobileScreen({ navigation }: Props<'LoanMobile'>) {
  const c = useLoanColors();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [policy, setPolicy] = useState<'terms' | 'privacy' | null>(null);
  const next = () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    navigation.navigate('LoanOTP', { purpose: 'login', phone });
  };
  return (
    <LoanOnboardingLayout onBack={() => navigation.goBack()}>
      <View style={[base.center, styles.formIntro]}>
        <LinearGradient
          colors={c.isDark ? ['#4C2D56', '#33213F'] : ['#E4D1EE', '#F6EFFA']}
          style={[base.iconHalo, { borderColor: c.border }]}
        >
          <MaterialIcons name="phone-iphone" size={37} color={c.accent} />
        </LinearGradient>
        <Text style={[base.stage, { color: c.accent }]}>
          01 / MOBILE VERIFICATION
        </Text>
        <Text
          accessibilityRole="header"
          style={[base.title, { color: c.text }]}
        >
          Enter Mobile Number
        </Text>
        <Text style={[base.subtitle, { color: c.muted }]}>
          We’ll send you an OTP to verify{'\n'}your mobile number.
        </Text>
      </View>
      <View
        style={[
          base.formCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: c.text }]}>
          Mobile number
        </Text>
        <View
          style={[
            styles.phoneField,
            {
              backgroundColor: c.bg,
              borderColor: error ? '#BD425B' : focused ? c.accent : c.border,
            },
          ]}
        >
          <View style={[styles.country, { borderColor: c.border }]}>
            <Text style={[styles.countryText, { color: c.text }]}>+91</Text>
          </View>
          <TextInput
            accessibilityLabel="Mobile number"
            value={phone}
            onChangeText={value => {
              setPhone(value.replace(/\D/g, '').slice(0, 10));
              setError('');
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter mobile number"
            placeholderTextColor={c.muted}
            keyboardType="phone-pad"
            autoComplete="tel-national"
            textContentType="telephoneNumber"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={next}
            style={[styles.phoneInput, { color: c.text }]}
          />
          {phone.length === 10 ? (
            <MaterialIcons
              name="check-circle"
              size={18}
              color={c.accent}
              style={styles.inputCheck}
            />
          ) : null}
        </View>
        {error ? (
          <View style={styles.error}>
            <Copy error>{error}</Copy>
          </View>
        ) : null}
        <View style={styles.sendButton}>
          <Button label="Send OTP" onPress={next} />
        </View>
        <Text style={[styles.legalCopy, { color: c.muted }]}>
          By continuing, you agree to the
        </Text>
        <View style={styles.legalLinks}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPolicy('terms')}
            hitSlop={8}
          >
            <Text style={[styles.legalLink, { color: c.accent }]}>
              Terms & Conditions
            </Text>
          </Pressable>
          <Text style={{ color: c.muted }}> & </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPolicy('privacy')}
            hitSlop={8}
          >
            <Text style={[styles.legalLink, { color: c.accent }]}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.trustLine}>
        <MaterialIcons name="lock-outline" size={16} color={c.accent} />
        <Text style={[styles.trustText, { color: c.muted }]}>
          A simple, private start to your personal loan.
        </Text>
      </View>
      <Modal
        visible={policy !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPolicy(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.policySheet, { backgroundColor: c.card }]}>
            <View style={styles.sheetHeader}>
              <Text
                accessibilityRole="header"
                style={[styles.sheetTitle, { color: c.text }]}
              >
                {policy === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close policy information"
                onPress={() => setPolicy(null)}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={24} color={c.accent} />
              </Pressable>
            </View>
            <Text style={[styles.policyText, { color: c.muted }]}>
              {policy === 'terms'
                ? 'This is a personal loan UI preview. No credit application is submitted, no SMS is sent and no loan agreement is created. Final eligibility, rates, fees and contractual terms must be supplied by the lender before a live application can be accepted.'
                : 'The number entered here is used only inside this preview session and is not sent to an SMS service or lender. Preview details are held in module memory and cleared when the module is closed. Use sample information when exploring the journey.'}
            </Text>
            <Button label="Got it" onPress={() => setPolicy(null)} />
          </View>
        </View>
      </Modal>
    </LoanOnboardingLayout>
  );
}

export function LoanOTPScreen({ navigation, route }: Props<'LoanOTP'>) {
  const { purpose, phone } = route.params;
  const {
    signed,
    setSigned,
    setMandate,
    disbursed,
    paid,
    months,
    agreementAccepted,
    mandateAccepted,
  } = useLoan();
  const c = useLoanColors();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState('');
  const [expires, setExpires] = useState(() => Date.now() + 120000);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<Array<TextInput | null>>([]);
  const otp = digits.join('');
  useEffect(() => {
    const end = Date.now() + 30000;
    const timer = setInterval(
      () => setSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [expires]);
  const changeDigit = (index: number, text: string) => {
    const clean = text.replace(/\D/g, '');
    setError('');
    if (clean.length > 1) {
      const start = clean.length === 6 ? 0 : index;
      const pasted = [...digits];
      clean
        .slice(0, 6 - start)
        .split('')
        .forEach((digit, offset) => {
          pasted[start + offset] = digit;
        });
      setDigits(pasted);
      inputs.current[Math.min(5, start + clean.length)]?.focus();
    } else {
      setDigits(previous =>
        previous.map((digit, position) => (position === index ? clean : digit)),
      );
      if (clean && index < 5) {
        inputs.current[index + 1]?.focus();
      }
    }
  };
  const verify = () => {
    if (Date.now() > expires) {
      setError('This code has expired. Tap Resend OTP for a new code.');
      return;
    }
    if (otp !== '123456') {
      setError('Incorrect preview code. Enter 123456 to continue.');
      setDigits(Array(6).fill(''));
      inputs.current[0]?.focus();
      return;
    }
    if (purpose === 'sign') {
      if (!agreementAccepted) {
        navigation.replace('LoanAgreement');
        return;
      }
      setSigned(true);
      navigation.replace('LoanMandate');
    } else if (purpose === 'mandate') {
      if (!signed || !mandateAccepted) {
        navigation.replace(signed ? 'LoanMandate' : 'LoanAgreement');
        return;
      }
      setMandate(true);
      navigation.replace('LoanMandateSuccess');
    } else {
      navigation.replace(
        disbursed
          ? paid === months
            ? 'LoanClosure'
            : 'LoanDashboard'
          : 'LoanDocuments',
      );
    }
  };
  const resend = () => {
    if (seconds > 0) {
      return;
    }
    setExpires(Date.now() + 120000);
    setSeconds(30);
    setDigits(Array(6).fill(''));
    setError('');
    inputs.current[0]?.focus();
  };
  const otpContent = (
    <>
      <View
        style={[
          base.formCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: c.text }]}>
          Enter 6-digit OTP
        </Text>
        <View style={styles.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={element => {
                inputs.current[index] = element;
              }}
              accessibilityLabel={`OTP digit ${index + 1}`}
              value={digit}
              onChangeText={text => changeDigit(index, text)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              onKeyPress={({ nativeEvent }) => {
                if (
                  nativeEvent.key === 'Backspace' &&
                  !digits[index] &&
                  index > 0
                ) {
                  setDigits(previous =>
                    previous.map((value, position) =>
                      position === index - 1 ? '' : value,
                    ),
                  );
                  inputs.current[index - 1]?.focus();
                }
              }}
              keyboardType="number-pad"
              textContentType={index === 0 ? 'oneTimeCode' : 'none'}
              autoComplete={index === 0 ? 'sms-otp' : 'off'}
              maxLength={6}
              selectTextOnFocus
              caretHidden
              style={[
                styles.otpBox,
                {
                  backgroundColor: c.bg,
                  borderColor: error
                    ? '#BD425B'
                    : focusedIndex === index
                    ? c.accent
                    : c.border,
                  color: c.text,
                },
              ]}
            />
          ))}
        </View>
        {error ? <Copy error>{error}</Copy> : null}
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.timer, { color: c.muted }]}
        >
          {seconds > 0
            ? `Resend OTP in 00:${String(seconds).padStart(2, '0')}`
            : 'You can request a new code now'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend OTP"
          accessibilityState={{ disabled: seconds > 0 }}
          disabled={seconds > 0}
          onPress={resend}
          style={styles.resend}
        >
          <Text
            style={[
              styles.resendText,
              { color: c.accent, opacity: seconds > 0 ? 0.45 : 1 },
            ]}
          >
            Resend OTP
          </Text>
        </Pressable>
        <Button
          label={
            purpose === 'sign'
              ? 'Verify & Sign'
              : purpose === 'mandate'
              ? 'Verify Mandate'
              : 'Verify OTP'
          }
          onPress={verify}
          disabled={otp.length !== 6}
        />
      </View>
      <View style={[styles.previewCode, { backgroundColor: c.tint }]}>
        <MaterialIcons name="info-outline" size={16} color={c.accent} />
        <Text style={[styles.previewText, { color: c.accent }]}>
          Preview OTP: 123456 · No SMS is sent
        </Text>
      </View>
    </>
  );
  if (purpose !== 'login') {
    return (
      <LoanFlowScreen
        eyebrow={
          purpose === 'sign'
            ? 'CONFIRM YOUR AGREEMENT'
            : 'VERIFY YOUR REPAYMENT SETUP'
        }
        artwork={purpose === 'sign' ? 'agreement' : 'bank'}
        onBack={() => navigation.goBack()}
        title={
          purpose === 'sign' ? 'E-Sign with OTP' : 'Verify Mandate with OTP'
        }
        subtitle="Enter the preview code to continue. No real signature or bank authorisation is created."
      >
        {otpContent}
        <FlowNote icon="schedule">
          Codes expire after two minutes. You can request a new code after the
          resend timer ends.
        </FlowNote>
      </LoanFlowScreen>
    );
  }
  const displayPhone = phone
    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    : 'your mobile number';
  return (
    <LoanOnboardingLayout onBack={() => navigation.goBack()}>
      <View style={[base.center, styles.formIntro]}>
        <LinearGradient
          colors={c.isDark ? ['#4C2D56', '#33213F'] : ['#E4D1EE', '#F6EFFA']}
          style={[base.iconHalo, { borderColor: c.border }]}
        >
          <MaterialIcons name="mark-email-read" size={36} color={c.accent} />
        </LinearGradient>
        <Text style={[base.stage, { color: c.accent }]}>
          02 / CONFIRM YOUR NUMBER
        </Text>
        <Text
          accessibilityRole="header"
          style={[base.title, { color: c.text }]}
        >
          Verify OTP
        </Text>
        <Text style={[base.subtitle, { color: c.muted }]}>
          Enter the 6-digit OTP for
        </Text>
        <Text style={[styles.destination, { color: c.accent }]}>
          {displayPhone}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('LoanMobile')}
          style={styles.editNumber}
        >
          <MaterialIcons name="edit" size={13} color={c.accent} />
          <Text style={[styles.editText, { color: c.accent }]}>
            Edit number
          </Text>
        </Pressable>
      </View>
      {otpContent}
    </LoanOnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  productBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  productText: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700' },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 9,
  },
  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 18,
  },
  illustration: { width: '100%', maxWidth: 315 },
  illustrationGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.55,
  },
  imageBadge: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -18,
  },
  imageBadgeText: { fontSize: 11, fontWeight: '600' },
  benefits: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 16 },
  benefit: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  benefitIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  benefitDetail: { fontSize: 11, lineHeight: 18 },
  formIntro: { marginTop: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  phoneField: {
    minHeight: 57,
    borderWidth: 1.5,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  country: { paddingHorizontal: 14, borderRightWidth: 1 },
  countryText: { fontSize: 17, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 15,
    fontSize: 16,
  },
  inputCheck: { marginRight: 12 },
  sendButton: { marginTop: 20 },
  error: { marginTop: 10 },
  legalCopy: { textAlign: 'center', fontSize: 12, marginTop: 22 },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 7,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  trustLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 27,
  },
  trustText: { fontSize: 12, flexShrink: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#1E112B88',
    justifyContent: 'flex-end',
  },
  policySheet: {
    padding: 26,
    paddingBottom: 35,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  policyText: { fontSize: 15, lineHeight: 25, marginVertical: 24 },
  destination: { fontSize: 17, fontWeight: '700', marginTop: 6 },
  editNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 9,
    marginTop: 3,
  },
  editText: { fontSize: 12, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 7, marginBottom: 18 },
  otpBox: {
    flex: 1,
    minWidth: 0,
    height: 55,
    padding: 0,
    borderWidth: 1.5,
    borderRadius: 11,
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '600',
  },
  timer: { fontSize: 12, textAlign: 'center' },
  resend: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 21,
  },
  resendText: { fontSize: 14, fontWeight: '700' },
  previewCode: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  previewText: { fontSize: 12, lineHeight: 19, flexShrink: 1 },
});
