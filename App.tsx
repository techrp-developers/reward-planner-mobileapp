import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/modules/common/auth/context/AuthContext';
import { AlertProvider, AlertContainer } from './src/modules/ecommerce/components/alerts';
import { CartProvider } from './src/modules/ecommerce/context/CartContext';
import { NavigationContainer, LinkingOptions, NavigatorScreenParams } from "@react-navigation/native";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/query/queryClient';
import { AppThemeProvider } from "./src/theme/ThemeContext";
import NetworkGuard from './src/modules/common/noInternet/NetworkGuard';
type AuthModalStackParamList = {
  Login: undefined;
  LoginOTP: { identifier: string };
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
          LoginOTP: 'login/otp',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AlertProvider>
            <AuthProvider>
              <CartProvider>
                <NetworkGuard>
                  <NavigationContainer linking={linking}>
                    <AlertContainer />
                    <RootNavigator />
                  </NavigationContainer>
                </NetworkGuard>
              </CartProvider>
            </AuthProvider>
          </AlertProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}


