import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/modules/ecommerce/auth/context/AuthContext';
import { AlertProvider, AlertContainer } from './src/modules/ecommerce/components/alerts';
import { CartProvider } from './src/modules/ecommerce/context/CartContext';
import { NavigationContainer, LinkingOptions, NavigatorScreenParams } from "@react-navigation/native";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/query/queryClient';

type AuthModalStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};

type RootStackParamList = {
  SplashScreen: undefined;
  AuthStack: NavigatorScreenParams<AuthModalStackParamList>;
  AppStack: undefined;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rewardplanners://', 'rewardapp://'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          AccountActivate: 'activate',
          OTPScreen: 'otp',
          SetNewPassword: 'set-password',
          AccountActivationSuccess: 'activation-success',
          VerifyEmail: 'verify-email',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer linking={linking}>
                <AlertContainer />
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </AlertProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}


