import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../navigation/types';
import {
  useLoan,
  type Personal,
  type Employment,
} from '../../context/LoanContext';
import { isAdult } from '../../utils/loanMath';
import { Button, Check, Field, useLoanColors } from '../LoanUI';
import { LoanOnboardingLayout } from '../LoanOnboardingLayout';

function DetailsHeader({ employment = false }: { employment?: boolean }) {
  const c = useLoanColors();
  return (
    <>
      <View style={styles.stageRow}>
        {[
          ['person-outline', 'Personal details'],
          ['work-outline', 'Employment'],
        ].map(([icon, title], index) => (
          <View key={title} style={styles.stageItem}>
            <View
              style={[
                styles.stageLine,
                {
                  backgroundColor:
                    !employment && index === 1 ? c.border : c.accent,
                },
              ]}
            />
            <View style={styles.stageLabel}>
              <MaterialIcons
                name={employment && index === 0 ? 'check-circle' : icon}
                size={14}
                color={!employment && index === 1 ? c.muted : c.accent}
              />
              <Text
                style={[
                  styles.stageText,
                  { color: !employment && index === 1 ? c.muted : c.accent },
                ]}
              >
                {title}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.heading}>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: c.accent }]}>
            REVIEW YOUR DETAILS · {employment ? '2' : '1'} OF 2
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: c.text }]}
          >
            {employment ? 'Employment & Income' : 'Personal Information'}
          </Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            {employment
              ? 'Confirm your work and income details.'
              : 'Check your information and update anything that needs a change.'}
          </Text>
        </View>
        <Image
          accessible={false}
          source={
            employment
              ? require('../../assets/loan-employment.png')
              : require('../../assets/loan-documents.png')
          }
          resizeMode="contain"
          style={styles.headingArt}
        />
      </View>
    </>
  );
}

export default function PersonalLoanDetailsScreen({
  navigation,
}: NativeStackScreenProps<LoanStackParamList, 'LoanPersonal'>) {
  const { personal, setPersonal, detailsReady } = useLoan();
  const c = useLoanColors();
  const [errors, setErrors] = useState<Partial<Record<keyof Personal, string>>>(
    {},
  );
  const edit = (key: keyof Personal, value: string) => {
    setPersonal(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };
  const next = () => {
    const issues: typeof errors = {};
    if (personal.name.trim().length < 3) {
      issues.name = 'Enter your full name as shown on PAN.';
    }
    if (!isAdult(personal.dob)) {
      issues.dob = 'Enter a valid date (DD/MM/YYYY). You must be at least 18.';
    }
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(personal.pan)) {
      issues.pan = 'Enter a valid PAN, for example ABCDE1234F.';
    }
    if (personal.address.trim().length < 10) {
      issues.address = 'Enter your complete current address.';
    }
    if (!personal.sameAddress && personal.permanent.trim().length < 10) {
      issues.permanent = 'Enter your complete permanent address.';
    }
    setErrors(issues);
    if (!Object.keys(issues).length) {
      setPersonal(previous => ({
        ...previous,
        name: previous.name.trim(),
        permanent: previous.sameAddress ? previous.address : previous.permanent,
      }));
      navigation.navigate('LoanEmployment');
    }
  };
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Sample application · Your details stay in this preview session"
      footer={<Button label="Continue" onPress={next} />}
    >
      <DetailsHeader />
      <View style={[styles.reviewNote, { backgroundColor: c.tint }]}>
        <MaterialIcons name="edit-note" size={19} color={c.accent} />
        <Text style={[styles.reviewCopy, { color: c.accent }]}>
          {detailsReady
            ? 'Sample details are pre-filled. Please review each field.'
            : 'Enter your personal details below to continue.'}
        </Text>
      </View>
      <View
        style={[
          styles.form,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Field
          label="Full name"
          value={personal.name}
          onChangeText={text => edit('name', text)}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Name as on PAN"
          error={errors.name}
          maxLength={100}
        />
        <Field
          label="Date of birth"
          value={personal.dob}
          onChangeText={text => {
            const digits = text.replace(/\D/g, '').slice(0, 8);
            edit(
              'dob',
              [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
                .filter(Boolean)
                .join('/'),
            );
          }}
          keyboardType="number-pad"
          placeholder="DD/MM/YYYY"
          maxLength={10}
          error={errors.dob}
        />
        <Field
          label="PAN number"
          value={personal.pan}
          onChangeText={text =>
            edit('pan', text.toUpperCase().replace(/[^A-Z0-9]/g, ''))
          }
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          placeholder="ABCDE1234F"
          error={errors.pan}
        />
        <Field
          label="Current address"
          value={personal.address}
          onChangeText={text => edit('address', text)}
          multiline
          maxLength={500}
          placeholder="House, street, city, state & PIN"
          error={errors.address}
        />
        <Text style={[styles.addressLabel, { color: c.text }]}>
          Permanent address
        </Text>
        <Check
          label="Same as current address"
          value={personal.sameAddress}
          onChange={() => {
            setPersonal(previous => ({
              ...previous,
              sameAddress: !previous.sameAddress,
            }));
            setErrors(previous => ({ ...previous, permanent: undefined }));
          }}
        />
        {personal.sameAddress ? (
          <View
            accessibilityLabel="Permanent address same as current address"
            style={[
              styles.sameAddress,
              { backgroundColor: c.bg, borderColor: c.border },
            ]}
          >
            <MaterialIcons name="home" size={18} color={c.muted} />
            <Text style={[styles.addressCopy, { color: c.muted }]}>
              {personal.address || 'Your current address will be used here.'}
            </Text>
          </View>
        ) : (
          <Field
            label="Permanent address details"
            value={personal.permanent}
            onChangeText={text => edit('permanent', text)}
            multiline
            maxLength={500}
            placeholder="House, street, city, state & PIN"
            error={errors.permanent}
          />
        )}
      </View>
    </LoanOnboardingLayout>
  );
}

export function LoanEmploymentScreen({
  navigation,
}: NativeStackScreenProps<LoanStackParamList, 'LoanEmployment'>) {
  const { employment, setEmployment } = useLoan();
  const c = useLoanColors();
  const [errors, setErrors] = useState<
    Partial<Record<keyof Employment, string>>
  >({});
  const edit = (key: keyof Employment, value: string) => {
    setEmployment(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };
  const next = () => {
    const issues: typeof errors = {};
    const income = Number(employment.income);
    if (!Number.isFinite(income) || income <= 0 || income > 10000000) {
      issues.income = 'Enter a valid monthly take-home income.';
    }
    if (employment.company.trim().length < 2) {
      issues.company = 'Enter your company name.';
    }
    if (
      employment.experience.trim() &&
      (!/^\d{1,2}(\.\d{1,2})?$/.test(employment.experience.trim()) ||
        Number(employment.experience) > 60)
    ) {
      issues.experience = 'Enter experience between 0 and 60 years.';
    }
    setErrors(issues);
    if (!Object.keys(issues).length) {
      setEmployment(previous => ({
        ...previous,
        type: 'Salaried',
        income: String(income),
        company: previous.company.trim(),
        designation: previous.designation.trim(),
        experience: previous.experience.trim(),
      }));
      navigation.navigate('LoanAmount');
    }
  };
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Illustrative eligibility · Final assessment is made by the lender"
      footer={<Button label="Continue" onPress={next} />}
    >
      <DetailsHeader employment />
      <View
        style={[
          styles.form,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: c.text }]}>
          Employment type
        </Text>
        <View style={[styles.fixedField, { backgroundColor: c.tint }]}>
          <MaterialIcons name="work-outline" size={20} color={c.accent} />
          <Text style={[styles.fixedValue, { color: c.text }]}>Salaried</Text>
          <MaterialIcons name="lock-outline" size={15} color={c.muted} />
        </View>
        <Text style={[styles.helper, { color: c.muted }]}>
          This application is for salaried employees.
        </Text>
        <Field
          label="Company name"
          value={employment.company}
          onChangeText={text => edit('company', text)}
          placeholder="Your employer"
          maxLength={120}
          error={errors.company}
        />
        <Field
          label="Monthly income (₹)"
          value={employment.income}
          onChangeText={text => edit('income', text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={8}
          placeholder="50000"
          error={errors.income}
        />
        <Text style={[styles.incomeHelper, { color: c.muted }]}>
          Your monthly salary after deductions.
        </Text>
        <Field
          label="Designation (optional)"
          value={employment.designation}
          onChangeText={text => edit('designation', text)}
          placeholder="e.g. Software engineer"
          maxLength={80}
        />
        <Field
          label="Years of experience (optional)"
          value={employment.experience}
          onChangeText={text => edit('experience', text)}
          keyboardType="decimal-pad"
          maxLength={5}
          placeholder="e.g. 4"
          error={errors.experience}
        />
      </View>
      <View style={[styles.reviewNote, { backgroundColor: c.tint }]}>
        <MaterialIcons name="tune" size={19} color={c.accent} />
        <Text style={[styles.reviewCopy, { color: c.accent }]}>
          Next, choose a loan amount and tenure that feel comfortable for you.
        </Text>
      </View>
    </LoanOnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stageRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  stageItem: { flex: 1 },
  stageLine: { height: 3, borderRadius: 3, marginBottom: 9 },
  stageLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stageText: { fontSize: 11, fontWeight: '600' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 19,
  },
  headingArt: { width: 88, height: 95 },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 9,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.7,
    marginBottom: 9,
  },
  subtitle: { fontSize: 14, lineHeight: 22 },
  reviewNote: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    padding: 13,
    borderRadius: 14,
    marginBottom: 18,
  },
  reviewCopy: { flex: 1, fontSize: 12, lineHeight: 20 },
  form: { padding: 19, borderRadius: 23, borderWidth: 1, marginBottom: 18 },
  addressLabel: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  sameAddress: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  addressCopy: { flex: 1, fontSize: 13, lineHeight: 22 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 9 },
  fixedField: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 15,
    borderRadius: 14,
  },
  fixedValue: { flex: 1, fontSize: 15, fontWeight: '600' },
  helper: { fontSize: 11, lineHeight: 19, marginTop: 8, marginBottom: 21 },
  incomeHelper: {
    fontSize: 11,
    lineHeight: 19,
    marginTop: -8,
    marginBottom: 20,
  },
});
