import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoanProvider } from '../context/LoanContext';
import type { LoanStackParamList } from './types';
import {
  LoanMobileScreen,
  LoanOTPScreen,
  LoanWelcomeScreen,
} from '../components/screens/OnboardingScreens';
import {
  LoanDocumentsScreen,
  LoanVerificationScreen,
  LoanFetchedScreen,
} from '../components/screens/DocumentScreens';
import PersonalLoanDetailsScreen, {
  LoanEmploymentScreen,
} from '../components/screens/PersonalLoanDetailsScreen';
import {
  LoanAmountScreen,
  LoanScheduleScreen,
  LoanSummaryScreen,
} from '../components/screens/OfferScreens';
import {
  LoanAgreementScreen,
  LoanMandateScreen,
  LoanMandateSuccessScreen,
} from '../components/screens/AgreementScreens';
import {
  LoanClosureScreen,
  LoanDashboardScreen,
  LoanDisbursementScreen,
  LoanPaymentResultScreen,
  LoanPaymentScreen,
} from '../components/screens/ServicingScreens';

const Stack = createNativeStackNavigator<LoanStackParamList>();
export default function LoanStack() {
  return (
    <LoanProvider>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="LoanWelcome" component={LoanWelcomeScreen} />
        <Stack.Screen name="LoanMobile" component={LoanMobileScreen} />
        <Stack.Screen name="LoanOTP" component={LoanOTPScreen} />
        <Stack.Screen name="LoanDocuments" component={LoanDocumentsScreen} />
        <Stack.Screen
          name="LoanVerification"
          component={LoanVerificationScreen}
        />
        <Stack.Screen name="LoanFetched" component={LoanFetchedScreen} />
        <Stack.Screen
          name="LoanPersonal"
          component={PersonalLoanDetailsScreen}
        />
        <Stack.Screen name="LoanEmployment" component={LoanEmploymentScreen} />
        <Stack.Screen name="LoanAmount" component={LoanAmountScreen} />
        <Stack.Screen name="LoanEligibility" component={LoanAmountScreen} />
        <Stack.Screen name="LoanSummary" component={LoanSummaryScreen} />
        <Stack.Screen name="LoanSchedule" component={LoanScheduleScreen} />
        <Stack.Screen name="LoanAgreement" component={LoanAgreementScreen} />
        <Stack.Screen name="LoanMandate" component={LoanMandateScreen} />
        <Stack.Screen
          name="LoanMandateSuccess"
          component={LoanMandateSuccessScreen}
        />
        <Stack.Screen
          name="LoanDisbursement"
          component={LoanDisbursementScreen}
        />
        <Stack.Screen name="LoanDashboard" component={LoanDashboardScreen} />
        <Stack.Screen name="LoanPayment" component={LoanPaymentScreen} />
        <Stack.Screen
          name="LoanPaymentResult"
          component={LoanPaymentResultScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="LoanClosure" component={LoanClosureScreen} />
      </Stack.Navigator>
    </LoanProvider>
  );
}
