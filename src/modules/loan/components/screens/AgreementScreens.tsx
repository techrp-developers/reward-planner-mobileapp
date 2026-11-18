import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../navigation/types';
import { useLoan } from '../../context/LoanContext';
import { money } from '../../utils/loanMath';
import {
  Button,
  Check,
  Copy,
  PreviewTools,
  Row,
  useLoanColors,
} from '../LoanUI';
import {
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
export function LoanAgreementScreen({ navigation }: Props<'LoanAgreement'>) {
  const { offer, setAgreementAccepted } = useLoan();
  const [read, setRead] = useState(false);
  const [terms, setTerms] = useState(false);
  const [opened, setOpened] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [failure, setFailure] = useState(false);
  useEffect(() => {
    setRead(false);
    setTerms(false);
    setOpened(false);
    setViewed(false);
  }, [offer.amount, offer.months]);
  const rows: [string, string][] = [
    ['Loan amount', money(offer.amount)],
    ['Interest rate', `${offer.annualRate}% p.a.`],
    ['Tenure', `${offer.months} months`],
    ['Monthly EMI', money(offer.emi)],
    ['Processing fee', money(offer.fee)],
    ['Net disbursal', money(offer.net)],
    ['Total repayment', money(offer.total)],
  ];
  const allowed = read && terms && viewed;
  const sign = () => {
    if (allowed) {
      setAgreementAccepted(true);
      navigation.navigate('LoanOTP', { purpose: 'sign' });
    }
  };
  return (
    <LoanFlowScreen
      eyebrow="REVIEW BEFORE YOU SIGN"
      title="Loan Agreement"
      subtitle="Read the agreement and confirm that you understand the commitments."
      artwork="agreement"
      onBack={() => navigation.goBack()}
      actionLabel="Continue to E-Sign"
      action={sign}
      disabled={!allowed}
    >
      <FlowPanel>
        <Row label="Personal loan" value={money(offer.amount)} />
        <Row label="Monthly EMI" value={money(offer.emi)} />
        <Row label="Repayment period" value={`${offer.months} months`} />
      </FlowPanel>
      <FlowLink
        label={opened ? 'Hide Agreement' : 'View Agreement'}
        icon="description"
        detail="Read the sample agreement summary"
        onPress={() => {
          setOpened(!opened);
          setViewed(true);
        }}
      />
      {opened ? (
        <FlowPanel>
          <FlowSection>Sample agreement summary</FlowSection>
          <Copy>
            This preview is an illustration, not a credit contract. Final lender
            terms and the Key Fact Statement must be provided before a live
            agreement can be signed.
          </Copy>
          {rows.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </FlowPanel>
      ) : null}
      <View style={{ marginBottom: 15 }}>
        <PreviewDownloadButton
          title="Agreement"
          label="Download Sample Agreement"
          rows={rows}
        />
      </View>
      <FlowPanel>
        <Check
          label="I have read and understood the sample loan agreement."
          value={read}
          onChange={() => setRead(!read)}
        />
        <Check
          label="I agree to the sample terms and conditions."
          value={terms}
          onChange={() => setTerms(!terms)}
        />
      </FlowPanel>
      <FlowNote icon="draw">
        You’ll confirm the next step with a preview OTP. No legal signature is
        created.
      </FlowNote>
      <PreviewTools>
        <Button
          secondary
          label="Preview an e-sign failure"
          onPress={() => setFailure(true)}
        />
        {failure ? (
          <>
            <Copy error>
              Signing could not be completed. Your details are kept for another
              attempt.
            </Copy>
            <Button
              secondary
              label="Retry e-sign"
              disabled={!allowed}
              onPress={sign}
            />
          </>
        ) : null}
      </PreviewTools>
    </LoanFlowScreen>
  );
}

export function LoanMandateScreen({ navigation }: Props<'LoanMandate'>) {
  const { offer, signed, setMandateAccepted } = useLoan();
  const [consent, setConsent] = useState(false);
  const [selected, setSelected] = useState(true);
  const [failed, setFailed] = useState(false);
  const next = () => {
    if (!signed) {
      navigation.navigate('LoanAgreement');
      return;
    }
    if (consent && selected) {
      setMandateAccepted(true);
      navigation.navigate('LoanOTP', { purpose: 'mandate' });
    }
  };
  return (
    <LoanFlowScreen
      eyebrow="SET UP YOUR REPAYMENTS"
      title="Set Up Repayment Mandate"
      subtitle="Choose the bank account for your monthly EMI. Your mandate is set up before disbursement."
      artwork="bank"
      onBack={() => navigation.goBack()}
      actionLabel={signed ? 'Continue' : 'Complete E-Sign First'}
      action={next}
      disabled={signed && (!consent || !selected)}
    >
      <FlowSection>Select bank account</FlowSection>
      <FlowOption
        label="HDFC Bank"
        detail="Sample savings account · •••• 1234"
        icon="account-balance"
        selected={selected}
        onPress={() => setSelected(!selected)}
      />
      <FlowPanel>
        <Row label="Monthly debit" value={money(offer.emi)} accent />
        <Row label="Frequency" value="Monthly" />
        <Row label="Repayment period" value={`${offer.months} months`} />
      </FlowPanel>
      <Check
        label="I understand the sample monthly auto-debit arrangement shown here."
        value={consent}
        onChange={() => setConsent(!consent)}
      />
      <FlowNote icon="verified-user">
        The next step demonstrates bank verification. No real mandate is
        registered in this preview.
      </FlowNote>
      <PreviewTools>
        <Button
          secondary
          label="Preview a mandate failure"
          onPress={() => setFailed(true)}
        />
        {failed ? (
          <>
            <Copy error>
              The bank authorisation was not completed. Please try again.
            </Copy>
            <Button
              secondary
              label="Retry mandate setup"
              onPress={() => {
                setFailed(false);
                setConsent(false);
              }}
            />
          </>
        ) : null}
      </PreviewTools>
    </LoanFlowScreen>
  );
}

export function LoanMandateSuccessScreen({
  navigation,
}: Props<'LoanMandateSuccess'>) {
  const { mandate, signed, offer } = useLoan();
  const c = useLoanColors();
  const ready = mandate && signed;
  return (
    <LoanFlowScreen
      eyebrow="BANK SETUP COMPLETE"
      title={ready ? 'Mandate Setup Successful!' : 'Complete your bank setup'}
      subtitle={
        ready
          ? 'Your repayment arrangement is ready in this sample journey.'
          : 'Verify your signed agreement and bank mandate before continuing.'
      }
      onBack={() => navigation.goBack()}
      actionLabel={ready ? 'Continue to Disbursement' : 'Return to Bank Setup'}
      action={() =>
        ready
          ? navigation.replace('LoanDisbursement', { status: 'processing' })
          : navigation.replace('LoanMandate')
      }
    >
      <FlowStatus tone={ready ? 'success' : 'pending'} />
      <FlowPanel>
        <FlowSection>Repayment account</FlowSection>
        <Row label="Bank" value="HDFC Bank" />
        <Row label="Account" value="•••• 1234 · Sample" />
        <Row label="Monthly EMI" value={money(offer.emi)} accent />
        <Row
          label="Mandate status"
          value={ready ? 'Active · Preview' : 'Not confirmed'}
        />
      </FlowPanel>
      <Text
        style={{
          color: c.muted,
          fontSize: 12,
          textAlign: 'center',
          lineHeight: 21,
        }}
      >
        This is a sample authorisation. No account will be debited.
      </Text>
    </LoanFlowScreen>
  );
}
