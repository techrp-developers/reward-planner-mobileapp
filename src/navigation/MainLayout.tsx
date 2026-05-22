import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Navbar from "../navbar/Navbar";
import BottomTabs from "../modules/ecommerce/navigation/BottomTabs";
import { TAB_BAR_HEIGHT } from "../modules/ecommerce/navigation/BottomTabs";
import { handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";
import { useCart } from "../modules/ecommerce/context/CartContext";

export type ModuleStackParamList = {
  ProductModule: { moduleName?: string } | undefined;
  ServicesModule: { moduleName?: string } | undefined;
  PaymentsModule: { moduleName?: string } | undefined;
  DineOutModule: { moduleName?: string } | undefined;
};

const ModuleStack = createNativeStackNavigator<ModuleStackParamList>();

type RouteStateLike = {
  index: number;
  routes: Array<{
    name: string;
    state?: RouteStateLike;
  }>;
};

type AppMode = "Product" | "Services" | "Payments" | "DineOut";

const getActiveRouteChain = (state?: RouteStateLike): string[] => {
  if (!state?.routes?.length) return [];

  const focused = state.routes[state.index] ?? state.routes[0];
  const currentName = focused?.name ? [focused.name] : [];

  if (!focused?.state) return currentName;
  return [...currentName, ...getActiveRouteChain(focused.state)];
};

const shouldShowNavbar = (routeChain: string[]): boolean => {
  if (routeChain.length === 0) return true;

  const moduleRoute = routeChain.find((routeName) =>
    ["ProductModule", "ServicesModule", "PaymentsModule", "DineOutModule"].includes(routeName)
  );
  const leafRoute = routeChain[routeChain.length - 1];

  if (!moduleRoute) {
    return routeChain[0] === "Home";
  }

  if (moduleRoute === "ProductModule") {
    return ["ProductModule", "HomeTab", "Home", "Explore"].includes(leafRoute);
  }

  if (moduleRoute === "ServicesModule") {
    return ["ServicesModule", "Home"].includes(leafRoute);
  }

  if (moduleRoute === "PaymentsModule") {
    return ["PaymentsModule", "Home"].includes(leafRoute);
  }

  return moduleRoute === "DineOutModule";
};

const getActiveMode = (routeChain: string[]): AppMode => {
  if (routeChain.includes("ServicesModule")) return "Services";
  if (routeChain.includes("PaymentsModule")) return "Payments";
  if (routeChain.includes("DineOutModule")) return "DineOut";
  return "Product";
};

const shouldShowBottomTabs = (activeMode: AppMode): boolean => {
  return activeMode === "Services" || activeMode === "Payments";
};

function MainLayout() {
  const navigation = useNavigation<any>();
  const navigationState = useNavigationState((state) => state);
  const insets = useSafeAreaInsets();

  const routeChain = React.useMemo(
    () => getActiveRouteChain(navigationState as unknown as RouteStateLike),
    [navigationState]
  );

  const activeMode = React.useMemo(() => getActiveMode(routeChain), [routeChain]);
  const showNavbar = React.useMemo(() => shouldShowNavbar(routeChain), [routeChain]);
  const showBottomTabs = React.useMemo(
    () => shouldShowBottomTabs(activeMode),
    [activeMode]
  );
  const bottomInset = Math.max(insets.bottom, 8);
  const { totalQuantity } = useCart(); // import this

  const contentBottomSpacing = showBottomTabs ? TAB_BAR_HEIGHT + bottomInset : 0;
  const handleBottomTabPress = React.useCallback(
    (tab: "Home" | "Search" | "Explore" | "Cart" | "Profile") => {

      // ✅ GLOBAL CART NAVIGATION (works for all modes)
      if (tab === "Cart") {
        handleNavigateWithPrefetch({
          navigate: () => navigation.navigate("CartScreen"),
        });
        return;
      }

      if (tab === "Profile") {
        handleNavigateWithPrefetch({
          navigate: () => {
            if (activeMode === "Services") {
              navigation.navigate("ServicesModule", { screen: "Profile" });
              return;
            }

            navigation.navigate("Profile");
          },
        });
        return;
      }

      if (activeMode === "Payments") {
        if (tab === "Home") {
          handleNavigateWithPrefetch({
            navigate: () => navigation.navigate("PaymentsModule", { screen: "Home" }),
          });
          return;
        }
        if (tab === "Search") {
          handleNavigateWithPrefetch({
            navigate: () => navigation.navigate("PaymentsModule", { screen: "Search" }),
          });
          return;
        }
      }

      if (activeMode === "Services") {
        if (tab === "Home") {
          handleNavigateWithPrefetch({
            navigate: () => navigation.navigate("ServicesModule", { screen: "Home" }),
          });
          return;
        }
        if (tab === "Search") {
          handleNavigateWithPrefetch({
            navigate: () => navigation.navigate("ServicesModule", { screen: "ServiceSearch" }),
          });
          return;
        }
      }
    },
    [activeMode, navigation]
  );



  return (
    <View style={styles.container}>
      <View style={showNavbar ? styles.navbarSlot : styles.navbarSlotHidden}>
        <Navbar />
      </View>
      <View style={[styles.content, { paddingBottom: contentBottomSpacing }]}>
        <ModuleStack.Navigator
          initialRouteName="ProductModule"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        >
          <ModuleStack.Screen
            name="ProductModule"
            getComponent={() => require("../modules/ecommerce/navigation/MainTabs").default}
            initialParams={{ moduleName: "Product" }}
          />
          <ModuleStack.Screen
            name="ServicesModule"
            getComponent={() => require("../modules/services/navigation/ServiceHomeStack").default}
            initialParams={{ moduleName: "Services" }}
          />
          <ModuleStack.Screen
            name="PaymentsModule"
            getComponent={() => require("../modules/bbps/navigation/BBPSHomeStack").default}
            initialParams={{ moduleName: "Payments" }}
          />
          <ModuleStack.Screen
            name="DineOutModule"
            getComponent={() => require("../modules/ecommerce/constants/ComingSoon").default}
            initialParams={{ moduleName: "DineOut" }}
          />
        </ModuleStack.Navigator>
      </View>
      {showBottomTabs ? (
        <BottomTabs
          activeMode={activeMode}
          cartCount={totalQuantity}
          onTabPress={handleBottomTabPress}
        />) : null}
    </View>
  );
}

export default React.memo(MainLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbarSlot: {
    display: "flex",
  },
  navbarSlotHidden: {
    display: "none",
  },
  content: {
    flex: 1,
  },
});
