// src/modules/ecommerce/navigation/MainTabs.tsx
import React from "react";
import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import type { MainTabParamList } from "./types";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../auth/context/AuthContext";
import { useCart } from "../context/CartContext";

const Tab = createBottomTabNavigator<MainTabParamList>();

type CustomTabBarProps = {
  navigation: any;
  cartCount: number;
  isAuthenticated: boolean;
};

function CustomTabBar({ navigation, cartCount, isAuthenticated }: CustomTabBarProps) {
  const goTo = (screen: string) => {
    navigation.navigate("HomeTab", { screen });
  };

  return (
    <BottomTabs
      cartCount={cartCount}
      onTabPress={(tab) => {
        switch (tab) {
          case "Home":
            goTo("Home");
            break;

          case "Cart":
            goTo("Cart");
            break;

          case "Explore":
            goTo("Explore");
            break;

          case "Profile":
            const parentNav = navigation.getParent();
            if (isAuthenticated) {
              parentNav?.navigate("Profile");
            } else {
              // Fallback path (normally unreachable because app is auth-first).
              parentNav?.getParent?.()?.navigate("AuthStack", {
                screen: "Login",
              });
            }
            break;
        }
      }}
    />
  );
}

export default function MainTabs() {
  const { isAuthenticated } = useAuth();
  const { totalQuantity } = useCart();
  
  const renderTabBar = React.useCallback(
    (props: any) => (
      <CustomTabBar
        {...props}
        cartCount={totalQuantity}
        isAuthenticated={isAuthenticated}
      />
    ),
    [totalQuantity, isAuthenticated]
  );

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
    </Tab.Navigator>
  );
}
