import React from 'react';
import { Modal, Platform, TextInput } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import {
  DOCUMENTS,
  LoanProvider,
  useLoan,
} from '../src/modules/loan/context/LoanContext';
import { pick } from '@react-native-documents/picker';
import {
  LoanAgreementScreen,
  LoanMandateScreen,
  LoanMandateSuccessScreen,
} from '../src/modules/loan/components/screens/AgreementScreens';
import {
  LoanClosureScreen,
  LoanDisbursementScreen,
  LoanPaymentResultScreen,
  LoanPaymentScreen,
} from '../src/modules/loan/components/screens/ServicingScreens';
import {
  Button,
  Check,
  Field,
  PreviewTools,
} from '../src/modules/loan/components/LoanUI';
import {
  LoanFlowScreen,
  FlowLink,
} from '../src/modules/loan/components/LoanFlowUI';
import { PreviewDownloadButton } from '../src/modules/loan/components/PreviewDownloadButton';
import {
  LoanAmountScreen,
  LoanSummaryScreen,
  LoanScheduleScreen,
} from '../src/modules/loan/components/screens/OfferScreens';
import PersonalLoanDetailsScreen, {
  LoanEmploymentScreen,
} from '../src/modules/loan/components/screens/PersonalLoanDetailsScreen';
import {
  LoanWelcomeScreen,
  LoanMobileScreen,
  LoanOTPScreen,
} from '../src/modules/loan/components/screens/OnboardingScreens';
import {
  LoanDocumentsScreen,
  LoanVerificationScreen,
  LoanFetchedScreen,
} from '../src/modules/loan/components/screens/DocumentScreens';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false }),
}));
jest.mock('react-native-html-to-pdf', () => ({ generatePDF: jest.fn() }));
jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  types: { pdf: 'application/pdf', images: 'image/*' },
  isErrorWithCode: (error: { code?: string }) => !!error?.code,
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
}));
jest.mock('react-native-image-picker', () => ({ launchCamera: jest.fn() }));

let state: ReturnType<typeof useLoan>;
function Probe() {
  state = useLoan();
  return null;
}
const navigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
  setParams: jest.fn(),
};
let tree: TestRenderer.ReactTestRenderer;
function mount(Screen: React.ComponentType<any>, route?: any) {
  act(() => {
    tree = TestRenderer.create(
      <LoanProvider>
        <Probe />
        <Screen navigation={navigation} route={route} />
      </LoanProvider>,
    );
  });
}
afterEach(() => {
  act(() => tree?.unmount());
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('agreement requires opening the document and both consents before e-sign', () => {
  mount(LoanAgreementScreen);
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(true);
  act(() =>
    tree.root
      .findAllByType(FlowLink)
      .find(button => button.props.label === 'View Agreement')!
      .props.onPress(),
  );
  const checks = tree.root.findAllByType(Check);
  act(() => checks[0].props.onChange());
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(true);
  act(() => checks[1].props.onChange());
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(false);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanOTP', {
    purpose: 'sign',
  });
});

test('mandate redirects to signing until signed and then requires mandate consent', () => {
  mount(LoanMandateScreen);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanAgreement');
  act(() => state.setSigned(true));
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(true);
  act(() => tree.root.findByType(Check).props.onChange());
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(false);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanOTP', {
    purpose: 'mandate',
  });
});

test('failed payment leaves progress untouched and repeated success taps record one EMI', () => {
  mount(LoanPaymentScreen);
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(true);
  act(() => state.setDisbursed(true));
  act(() =>
    tree.root
      .findByType(PreviewTools)
      .findByProps({ accessibilityLabel: 'Preview options' })
      .props.onPress(),
  );
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Preview a failed payment')!
      .props.onPress(),
  );
  expect(state.paid).toBe(0);
  expect(navigation.replace).toHaveBeenCalledWith('LoanPaymentResult', {
    success: false,
  });
  act(() => tree.unmount());
  mount(LoanPaymentScreen);
  act(() => state.setDisbursed(true));
  act(() => {
    const pay = tree.root.findByType(LoanFlowScreen).props.action;
    pay();
    pay();
  });
  expect(state.paid).toBe(1);
  expect(navigation.replace).toHaveBeenLastCalledWith('LoanPaymentResult', {
    success: true,
  });
  act(() => tree.unmount());
  mount(LoanPaymentScreen);
  act(() => {
    state.setDisbursed(true);
    state.setMandate(true);
    state.setPaid(state.months - 1);
  });
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(state.paid).toBe(state.months);
  expect(state.mandate).toBe(false);
});

test('sample NOC is available only after every instalment has been paid', () => {
  mount(LoanClosureScreen);
  expect(tree.root.findAllByType(PreviewDownloadButton)).toHaveLength(0);
  act(() => state.setPaid(state.months - 1));
  expect(tree.root.findAllByType(PreviewDownloadButton)).toHaveLength(0);
  act(() => state.setPaid(state.months));
  expect(tree.root.findAllByType(PreviewDownloadButton)).toHaveLength(0);
  act(() => state.setDisbursed(true));
  expect(tree.root.findByType(PreviewDownloadButton).props.title).toBe('NOC');
});

test('amount selection opens eligibility review and rejects an out-of-range amount', () => {
  mount(LoanAmountScreen);
  const next = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'View Loan Details')!
      .props.onPress();
  act(next);
  expect(navigation.navigate).toHaveBeenCalledWith('LoanEligibility');
  act(() =>
    tree.root
      .findAllByType(TextInput)
      .find(
        input => input.props.accessibilityLabel === 'Loan amount in rupees',
      )!
      .props.onChangeText('9999'),
  );
  navigation.navigate.mockClear();
  act(next);
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('offer review opens a dedicated schedule before the agreement', () => {
  mount(LoanSummaryScreen);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanSchedule');
  act(() => tree.unmount());
  mount(LoanScheduleScreen);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanAgreement');
});

test('personal information validates independently before opening employment', () => {
  mount(PersonalLoanDetailsScreen);
  const next = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Continue')!
      .props.onPress();
  act(next);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() => state.loadSampleDetails());
  act(() => state.setEmployment(previous => ({ ...previous, income: '0' })));
  act(next);
  expect(navigation.navigate).toHaveBeenCalledWith('LoanEmployment');
});

test('employment validates income and experience, while optional fields may be empty', () => {
  mount(LoanEmploymentScreen);
  const next = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Continue')!
      .props.onPress();
  act(() => state.loadSampleDetails());
  act(() => state.setEmployment(previous => ({ ...previous, income: '0' })));
  act(next);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() =>
    state.setEmployment(previous => ({
      ...previous,
      income: '50000',
      experience: '61',
    })),
  );
  act(next);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() =>
    state.setEmployment(previous => ({
      ...previous,
      experience: '',
      designation: '',
    })),
  );
  act(next);
  expect(navigation.navigate).toHaveBeenCalledWith('LoanAmount');
});

test('permanent address is required when different, and follows current address when same', () => {
  mount(PersonalLoanDetailsScreen);
  const next = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Continue')!
      .props.onPress();
  act(() => state.loadSampleDetails());
  act(() =>
    state.setPersonal(previous => ({
      ...previous,
      sameAddress: false,
      permanent: '',
    })),
  );
  act(next);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() =>
    tree.root
      .findAllByType(Field)
      .find(field => field.props.label === 'Permanent address details')!
      .props.onChangeText('12, Garden Road, Pune 411001'),
  );
  act(next);
  expect(state.personal.permanent).toBe('12, Garden Road, Pune 411001');
  act(() => tree.root.findByType(Check).props.onChange());
  act(() =>
    tree.root
      .findAllByType(Field)
      .find(field => field.props.label === 'Current address')!
      .props.onChangeText('45, Park Street, Kolkata 700016'),
  );
  act(next);
  expect(state.personal.permanent).toBe('45, Park Street, Kolkata 700016');
});

test('amount controls respect both limits and tenure updates the estimated EMI', () => {
  mount(LoanAmountScreen);
  const decrease = () =>
    tree.root.findByProps({ accessibilityLabel: 'Decrease amount by 10000' });
  const increase = () =>
    tree.root.findByProps({ accessibilityLabel: 'Increase amount by 10000' });
  for (let step = 0; step < 9; step++) {
    act(() => decrease().props.onPress());
  }
  expect(state.amount).toBe(10000);
  expect(decrease().props.disabled).toBe(true);
  for (let step = 0; step < 29; step++) {
    act(() => increase().props.onPress());
  }
  expect(state.amount).toBe(300000);
  expect(increase().props.disabled).toBe(true);
  const previousEMI = state.offer.emi;
  act(() =>
    tree.root.findByProps({ accessibilityLabel: '24 months' }).props.onPress(),
  );
  expect(state.months).toBe(24);
  expect(state.offer.emi).toBeLessThan(previousEMI);
  expect(
    tree.root.findByProps({ accessibilityLabel: '24 months' }).props
      .accessibilityState.checked,
  ).toBe(true);
});

test('Get Started always opens mobile entry instead of bypassing onboarding', () => {
  mount(LoanWelcomeScreen);
  act(() => state.setDisbursed(true));
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Get Started')!
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('LoanMobile');
});

test('mobile entry validates the number before opening its OTP screen', () => {
  mount(LoanMobileScreen);
  const send = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Send OTP')!
      .props.onPress();
  act(send);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() =>
    tree.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'Mobile number')!
      .props.onChangeText('9876543210'),
  );
  act(send);
  expect(navigation.navigate).toHaveBeenCalledWith('LoanOTP', {
    purpose: 'login',
    phone: '9876543210',
  });
});

test('six-box OTP rejects a wrong code, accepts paste and then opens documents', () => {
  jest.useFakeTimers();
  mount(LoanOTPScreen, { params: { purpose: 'login', phone: '9876543210' } });
  const enter = (value: string) =>
    tree.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'OTP digit 1')!
      .props.onChangeText(value);
  const verify = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Verify OTP')!
      .props.onPress();
  act(() => enter('111111'));
  act(verify);
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(
    tree.root
      .findAllByType(TextInput)
      .filter(input => input.props.accessibilityLabel?.startsWith('OTP digit'))
      .every(input => !input.props.value),
  ).toBe(true);
  act(() => enter('123456'));
  expect(
    tree.root
      .findAllByType(TextInput)
      .filter(input => input.props.accessibilityLabel?.startsWith('OTP digit'))
      .map(input => input.props.value)
      .join(''),
  ).toBe('123456');
  act(verify);
  expect(navigation.replace).toHaveBeenCalledWith('LoanDocuments');
});

test('OTP resend waits 30 seconds and expired codes require a fresh preview code', () => {
  jest.useFakeTimers();
  mount(LoanOTPScreen, { params: { purpose: 'login', phone: '9876543210' } });
  const resend = () =>
    tree.root.findByProps({ accessibilityLabel: 'Resend OTP' });
  expect(resend().props.disabled).toBe(true);
  act(() => jest.advanceTimersByTime(30000));
  expect(resend().props.disabled).toBe(false);
  act(() => jest.advanceTimersByTime(91000));
  const enter = () =>
    tree.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'OTP digit 1')!
      .props.onChangeText('123456');
  const verify = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Verify OTP')!
      .props.onPress();
  act(enter);
  act(verify);
  expect(navigation.replace).not.toHaveBeenCalled();
  act(() => resend().props.onPress());
  expect(resend().props.disabled).toBe(true);
  act(enter);
  act(verify);
  expect(navigation.replace).toHaveBeenCalledWith('LoanDocuments');
});

function addSampleDocuments() {
  state.setDocuments(
    Object.fromEntries(
      DOCUMENTS.map(doc => [
        doc.key,
        { name: `Sample ${doc.title}.pdf`, sample: true },
      ]),
    ),
  );
}

test('document Continue is gated until all four documents are added', () => {
  mount(LoanDocumentsScreen);
  const next = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Continue')!;
  expect(next().props.disabled).toBe(true);
  act(() => next().props.onPress());
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(addSampleDocuments);
  expect(next().props.disabled).toBe(false);
  act(() => next().props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanVerification');
});

test('upload rejects oversized files and accepts a readable replacement', async () => {
  mount(LoanDocumentsScreen);
  const openPAN = () =>
    tree.root
      .findByProps({ accessibilityLabel: 'Add PAN card' })
      .props.onPress();
  const chooseFile = async () => {
    await tree.root
      .findByProps({ accessibilityLabel: 'Choose a file' })
      .props.onPress();
    if (Platform.OS === 'ios') {
      await tree.root.findByType(Modal).props.onDismiss();
    }
  };
  (pick as jest.Mock).mockResolvedValueOnce([
    {
      name: 'large.pdf',
      uri: 'file:///large.pdf',
      size: 11 * 1024 * 1024,
      type: 'application/pdf',
    },
  ]);
  act(openPAN);
  await act(async () => {
    await chooseFile();
  });
  expect(state.documents.pan).toBeUndefined();
  (pick as jest.Mock).mockResolvedValueOnce([
    {
      name: 'PAN.pdf',
      uri: 'file:///pan.pdf',
      size: 2000,
      type: 'application/pdf',
    },
  ]);
  act(openPAN);
  await act(async () => {
    await chooseFile();
  });
  expect(state.documents.pan?.name).toBe('PAN.pdf');
  expect(state.detailsReady).toBe(false);
});

test('verification checks all documents then opens the dedicated results screen', () => {
  jest.useFakeTimers();
  mount(LoanVerificationScreen);
  act(() => jest.advanceTimersByTime(5000));
  expect(navigation.replace).not.toHaveBeenCalled();
  act(addSampleDocuments);
  for (let step = 0; step < 4; step++) {
    act(() => jest.advanceTimersByTime(800));
  }
  expect(navigation.replace).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(650));
  expect(state.detailsReady).toBe(true);
  expect(state.personal.name).toBe('Aarav Sharma');
  expect(navigation.replace).toHaveBeenCalledWith('LoanFetched');
});

test('a verification mismatch stops progress and does not expose successful results', () => {
  jest.useFakeTimers();
  mount(LoanVerificationScreen);
  act(addSampleDocuments);
  act(() =>
    tree.root
      .findByType(PreviewTools)
      .findByProps({ accessibilityLabel: 'Preview options' })
      .props.onPress(),
  );
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Preview a verification mismatch')!
      .props.onPress(),
  );
  act(() => jest.advanceTimersByTime(10000));
  expect(state.detailsReady).toBe(false);
  expect(navigation.replace).not.toHaveBeenCalled();
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Review documents')!
      .props.onPress(),
  );
  expect(navigation.replace).toHaveBeenCalledWith('LoanDocuments');
});

test('leaving verification cancels pending completion navigation', () => {
  jest.useFakeTimers();
  mount(LoanVerificationScreen);
  act(addSampleDocuments);
  for (let step = 0; step < 4; step++) {
    act(() => jest.advanceTimersByTime(800));
  }
  act(() => tree.unmount());
  act(() => jest.advanceTimersByTime(10000));
  expect(navigation.replace).not.toHaveBeenCalled();
});

test('fetched details require completed verification and Continue opens editable details', () => {
  mount(LoanFetchedScreen);
  expect(
    tree.root
      .findAllByType(Button)
      .some(button => button.props.label === 'Return to documents'),
  ).toBe(true);
  expect(
    tree.root
      .findAllByType(Button)
      .some(button => button.props.label === 'Continue'),
  ).toBe(false);
  act(() => state.loadSampleDetails());
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Continue')!
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('LoanPersonal');
});

test('eligibility fine-tuning opens the loan summary without losing selected terms', () => {
  mount(LoanAmountScreen, { name: 'LoanEligibility' });
  act(() =>
    tree.root.findByProps({ accessibilityLabel: '18 months' }).props.onPress(),
  );
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'See Loan Details')!
      .props.onPress(),
  );
  expect(state.months).toBe(18);
  expect(navigation.navigate).toHaveBeenCalledWith('LoanSummary');
});

test('changing offer terms clears agreement acknowledgements and bank authorisation', () => {
  mount(LoanAgreementScreen);
  act(() =>
    tree.root
      .findAllByType(FlowLink)
      .find(link => link.props.label === 'View Agreement')!
      .props.onPress(),
  );
  const checks = tree.root.findAllByType(Check);
  act(() => checks[0].props.onChange());
  act(() => checks[1].props.onChange());
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(state.agreementAccepted).toBe(true);
  act(() => {
    state.setSigned(true);
    state.setMandate(true);
    state.setMandateAccepted(true);
  });
  act(() => state.setMonths(24));
  expect(state.signed).toBe(false);
  expect(state.mandate).toBe(false);
  expect(state.agreementAccepted).toBe(false);
  expect(state.mandateAccepted).toBe(false);
  expect(tree.root.findByType(LoanFlowScreen).props.disabled).toBe(true);
});

test('e-sign OTP cannot bypass agreement consent and a valid acknowledgement permits signing', () => {
  jest.useFakeTimers();
  mount(LoanOTPScreen, { params: { purpose: 'sign' } });
  act(() =>
    tree.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'OTP digit 1')!
      .props.onChangeText('123456'),
  );
  const verify = () =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Verify & Sign')!
      .props.onPress();
  act(verify);
  expect(state.signed).toBe(false);
  expect(navigation.replace).toHaveBeenCalledWith('LoanAgreement');
  act(() => state.setAgreementAccepted(true));
  act(verify);
  expect(state.signed).toBe(true);
  expect(navigation.replace).toHaveBeenLastCalledWith('LoanMandate');
});

test('verified mandate opens its success screen before disbursement', () => {
  jest.useFakeTimers();
  mount(LoanOTPScreen, { params: { purpose: 'mandate' } });
  act(() => {
    state.setSigned(true);
    state.setMandateAccepted(true);
  });
  act(() =>
    tree.root
      .findAllByType(TextInput)
      .find(input => input.props.accessibilityLabel === 'OTP digit 1')!
      .props.onChangeText('123456'),
  );
  act(() =>
    tree.root
      .findAllByType(Button)
      .find(button => button.props.label === 'Verify Mandate')!
      .props.onPress(),
  );
  expect(state.mandate).toBe(true);
  expect(navigation.replace).toHaveBeenCalledWith('LoanMandateSuccess');
});

test('mandate success requires both signing and an active mandate to start disbursement', () => {
  mount(LoanMandateSuccessScreen);
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.replace).toHaveBeenCalledWith('LoanMandate');
  act(() => {
    state.setSigned(true);
    state.setMandate(true);
  });
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.replace).toHaveBeenLastCalledWith('LoanDisbursement', {
    status: 'processing',
  });
});

test('disbursement retry restarts processing and processing waits for mandate readiness', () => {
  jest.useFakeTimers();
  mount(LoanDisbursementScreen, { params: { status: 'processing' } });
  act(() => jest.advanceTimersByTime(4000));
  expect(navigation.setParams).not.toHaveBeenCalled();
  act(() => {
    state.setSigned(true);
    state.setMandate(true);
  });
  act(() => jest.advanceTimersByTime(3500));
  expect(navigation.setParams).toHaveBeenCalledWith({ status: 'success' });
  act(() => tree.unmount());
  mount(LoanDisbursementScreen, { params: { status: 'failed' } });
  act(() => {
    state.setSigned(true);
    state.setMandate(true);
  });
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.setParams).toHaveBeenLastCalledWith({
    status: 'processing',
  });
});

test('active-loan schedule returns to the dashboard and receipts require a recorded payment', () => {
  mount(LoanScheduleScreen, { params: { active: true } });
  act(() => tree.root.findByType(LoanFlowScreen).props.action());
  expect(navigation.navigate).toHaveBeenCalledWith('LoanDashboard');
  act(() => tree.unmount());
  mount(LoanPaymentResultScreen, { params: { success: true } });
  expect(tree.root.findAllByType(PreviewDownloadButton)).toHaveLength(0);
  act(() => {
    state.setDisbursed(true);
    state.setPaid(1);
  });
  expect(tree.root.findByType(PreviewDownloadButton).props.title).toBe(
    'Receipt',
  );
});
