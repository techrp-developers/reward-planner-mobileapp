import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../modules/ecommerce/auth/context/AuthContext";
import { checkAppVersion } from "../modules/common/versionupdate/checkAppVersion";
import { AppUpdateModal } from "../modules/common/versionupdate/AppUpdateModal";

import ServiceHomeStack from "../modules/services/navigation/ServiceHomeStack";
import RewardHomeStack from "../modules/step_counter/navigation/RewardHomeStack";
import BBPSHomeStack from "../modules/bbps/navigation/BBPSHomeStack";

import MainLayout from "./MainLayout";
import SplashScreen from "../modules/ecommerce/auth/screens/SplashScreen";
import TermsGateScreen from "../modules/ecommerce/auth/screens/TermsGateScreen";
import LoginScreen from "../modules/ecommerce/auth/screens/LoginScreen";
import BiometricLockScreen from "../modules/ecommerce/auth/screens/BiometricLockScreen";
import AccountActivate from "../modules/ecommerce/components/auth/AccountActivate";
import OTPScreen from "../modules/ecommerce/components/auth/OTPScreen";
import SetNewPassword from "../modules/ecommerce/components/auth/SetNewPassword";
import AccountActivationSuccess from "../modules/ecommerce/components/auth/AccountActivationSuccess";
import VerifyEmailScreen from "../modules/ecommerce/auth/screens/VerifyEmailScreen";
// import Dashbord from "../modules/dashboard/dashboard/dashbord";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};

export type AppStackParamList = {
  Home: undefined;
  Checkout: undefined;
  ProductDetails: { productId: number | string };
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
  ServiceStack: undefined;
  RewardStack: undefined;
  BBPSHomeStack: undefined;
  Search: undefined;
  WalletHistory: undefined;
  HelpForm: undefined;
  StepCount: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;

};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
  TermsGate: undefined;
  BiometricGate: undefined;

};

// ─── Navigators ───────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const defaultScreenOptions = {
  headerShown: false,
  animation: "slide_from_right" as const,
  gestureEnabled: true,
};

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={defaultScreenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="AccountActivate" component={AccountActivate} />
      <AuthStack.Screen name="OTPScreen" component={OTPScreen} />
      <AuthStack.Screen name="SetNewPassword" component={SetNewPassword} />
      <AuthStack.Screen name="AccountActivationSuccess" component={AccountActivationSuccess} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </AuthStack.Navigator>
  );
}

// ─── App Navigator ────────────────────────────────────────────────────────────

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={defaultScreenOptions}>

      <AppStack.Screen name="Home" component={MainLayout} />

      <AppStack.Screen
        name="Checkout"
        getComponent={() =>
          require("../modules/ecommerce/components/checkout/OrderStepUI").default
        }
      />
      <AppStack.Screen
        name="ProductDetails"
        getComponent={() =>
          require("../modules/ecommerce/screens/product_description_screen").default
        }
      />
      <AppStack.Screen
        name="Cart"
        getComponent={() =>
          require("../modules/ecommerce/screens/cartScreen").default
        }
      />
      <AppStack.Screen
        name="Orders"
        getComponent={() =>
          require("../modules/ecommerce/components/order/MyOrder").default
        }
      />
      <AppStack.Screen
        name="Profile"
        getComponent={() =>
          require("../modules/ecommerce/profile/Profile").default
        }
      />
      <AppStack.Screen
        name="Search"
        getComponent={() =>
          require("../modules/ecommerce/screens/SearchScreen").default
        }
      />
      <AppStack.Screen
        name="WalletHistory"
        getComponent={() =>
          require("../modules/ecommerce/components/home/Wallet_History").default
        }
      />
      <AppStack.Screen name="ServiceStack" component={ServiceHomeStack} />
      <AppStack.Screen name="RewardStack" component={RewardHomeStack} />
      <AppStack.Screen name="BBPSHomeStack" component={BBPSHomeStack} />
      <AppStack.Screen
        name="HelpForm"
        getComponent={() =>
          require("../modules/ecommerce/constants/Support/HelpForm").default
        }
      />
      <AppStack.Screen
        name="TermsAndConditions"
        getComponent={() =>
          require("../modules/ecommerce/profile/TermsandCondition").default
        }
      />
      <AppStack.Screen
        name="OrderConfirmedScreen"
        getComponent={() =>
          require("../modules/ecommerce/screens/OrderConfirmedScreen").default
        }
      />

    </AppStack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
//
//  Routing logic:
//
//  isInitializing = true
//    └─ Splash  (session hydration in progress)
//
//  isAuthenticated = false
//    └─ Auth  (login / register flow)
//
//  isAuthenticated = true, termsAccepted = null
//    └─ Splash  (terms status API call in progress, triggered by login/restore)
//
//  isAuthenticated = true, termsAccepted = false
//    └─ TermsGate  (first-time acceptance; back gesture + hardware back locked)
//
//  isAuthenticated = true, termsAccepted = true
//    └─ App  (normal app flow)

type VersionModalState = {
  visible: boolean;
  forceUpdate: boolean;
  maintenance: boolean;
  updateUrl: string;
};

const MODAL_HIDDEN: VersionModalState = {
  visible: false,
  forceUpdate: false,
  maintenance: false,
  updateUrl: "",
};

export default function RootNavigator() {
  const { isAuthenticated, isInitializing, termsAccepted } = useAuth();
  const [versionModal, setVersionModal] = useState<VersionModalState>(MODAL_HIDDEN);
  const [biometricCleared, setBiometricCleared] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkVersion = async () => {
      const result = await checkAppVersion();

      if (!mounted || !result.success) return;

      if (result.maintenance || result.updateAvailable) {
        setVersionModal({
          visible: true,
          maintenance: result.maintenance,
          forceUpdate: result.forceUpdate,
          updateUrl: result.updateUrl,
        });
      }
    };

    checkVersion();

    return () => {
      mounted = false;
    };
  }, []);

  // Show Splash while: (a) session is hydrating, OR (b) authenticated but
  // terms status API call hasn't resolved yet (termsAccepted is still null).
  const isCheckingTerms = isAuthenticated && termsAccepted === null;
  const showSplash = isInitializing || isCheckingTerms;

  const navigator = showSplash ? (
    <RootStack.Navigator screenOptions={defaultScreenOptions}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
    </RootStack.Navigator>
  ) : (
    <RootStack.Navigator screenOptions={defaultScreenOptions}>
      {isAuthenticated ? (
        termsAccepted ? (
          // ── Normal app — terms already accepted ─────────────────
          <RootStack.Screen
            name="App"
            component={AppNavigator}
          />
        ) : (
          // ── Terms gate — must accept before entering app ─────────
          // gestureEnabled: false prevents swipe-back.
          // BackHandler in TermsGateScreen prevents hardware back.
          <RootStack.Screen
            name="TermsGate"
            component={TermsGateScreen}
            options={{
              gestureEnabled: false,
              animation: "fade",
            }}
          />
        )
      ) : (
        // ── Auth flow ─────────────────────────────────────────────
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </RootStack.Navigator>
  );

  return (
    <>
      {navigator}
      <BiometricLockScreen
        visible={!showSplash && !biometricCleared}
        onSuccess={() => setBiometricCleared(true)}
        onUseFallback={() => setBiometricCleared(true)}
      />
      <AppUpdateModal
        visible={versionModal.visible}
        forceUpdate={versionModal.forceUpdate}
        maintenance={versionModal.maintenance}
        updateUrl={versionModal.updateUrl}
        onLater={() => setVersionModal(MODAL_HIDDEN)}
      />
    </>
  );
}
