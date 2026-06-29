import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screen/HomePage';
import ProductScreen from '../screen/ProductScreen';
import BillerSelectScreen from '../screen/BillerSelectScreen';
import BillDetailsScreen from '../screen/BillDetailsScreen';
import PaymentConfirmationScreen from '../screen/PaymentConfirmationScreen';
import RechargeConfirmationScreen from '../screen/RechargeConfirmationScreen';
import TransactionStatusScreen from '../screen/TransactionStatusScreen';
import OrderSuccessful from '../screen/OrderSuccessful';
import ReachargeHomeScreen from '../component/recharge/ReachargeHomeScreen';
import RechargeSection from '../component/recharge/RechargeSection';
import Search from '../constatnt/Search';
import OrderHistory from '../component/order/OrderHistory';

export type BBPSStackParamList = {
  Home: undefined;
  ProductScreen: undefined;
  BillerSelectScreen: undefined;
  BillDetailsScreen: undefined;
  PaymentConfirmationScreen: undefined;
  OrderSuccessful: undefined;
  ReachargeHomeScreen: undefined;
  RechargeSection: undefined;
  RechargePlanScreen: undefined;
  RechargeConfirmationScreen: undefined;
  TransactionStatusScreen: undefined;
  Search: undefined;
  OrderHistory: undefined;
  Profile: { context?: 'bbps' } | undefined;
  AddressSelect: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddressDetails: undefined | { mode?: 'add' | 'edit'; addressId?: number; manageOnly?: boolean; initialData?: any };
  AddAddressMap: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  HelpForm: undefined;
  ChangePassword: undefined;

};

const Stack = createNativeStackNavigator<BBPSStackParamList>();

const BBPSHomeStack = React.memo(() => {
  return (
    <Stack.Navigator screenOptions={{ freezeOnBlur: true }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductScreen"
        component={ProductScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BillerSelectScreen"
        component={BillerSelectScreen}
        options={{ headerShown: false }}
      />


      <Stack.Screen
        name="BillDetailsScreen"
        component={BillDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentConfirmationScreen"
        component={PaymentConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderSuccessful"
        component={OrderSuccessful}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReachargeHomeScreen"
        component={ReachargeHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RechargeSection"
        component={RechargeSection}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RechargePlanScreen"
        component={RechargeSection}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RechargeConfirmationScreen"
        component={RechargeConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TransactionStatusScreen"
        component={TransactionStatusScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={Search}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistory}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => require('../../ecommerce/profile/ProfileScreen').default}
        initialParams={{ context: 'bbps' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AddressSelect" getComponent={() => require('../../ecommerce/components/ItemCardAddress/AddressSelectScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="AddressDetails" getComponent={() => require('../../ecommerce/components/ItemCardAddress/NewAddressForm').default} options={{ headerShown: false }} />
      <Stack.Screen name="AddAddressMap" getComponent={() => require('../../ecommerce/components/ItemCardAddress/AddAddressMapScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyPolicy" getComponent={() => require('../../ecommerce/profile/PrivacyPolicy').default} options={{ headerShown: false }} />
      <Stack.Screen name="TermsAndConditions" getComponent={() => require('../../ecommerce/profile/TermsandCondition').default} options={{ headerShown: false }} />
      <Stack.Screen name="HelpForm" getComponent={() => require('../../ecommerce/constants/Support/HelpForm').default} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" getComponent={() => require('../../common/auth/screens/ChangePasswordScreen').default} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
});

export default BBPSHomeStack;
