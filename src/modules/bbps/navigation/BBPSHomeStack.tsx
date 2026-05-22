import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screen/HomePage';
import ProductScreen from '../screen/ProductScreen';
import BillerSelectScreen from '../screen/BillerSelectScreen';
import BillDetailsScreen from '../screen/BillDetailsScreen';
import PaymentConfirmationScreen from '../screen/PaymentConfirmationScreen';
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
  Search: undefined;
  OrderHistory: undefined;

};

const Stack = createNativeStackNavigator<BBPSStackParamList>();

function BBPSHomeStack() {
  return (
    <Stack.Navigator>
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
        name="Search"
        component={Search}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistory}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default BBPSHomeStack;