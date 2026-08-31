import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Image as RNImage,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQuery } from "@tanstack/react-query";

import { fetchUserInfo, getStoredUserName } from "../modules/common/auth/api/AuthAPI";
import { fetchAllAddress } from "../modules/ecommerce/api/AddressApi";
import { getNotificationBadge } from "../modules/dashboard/notification/NotificationAPI";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { addressesQueryKey, handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";

import Navbar_Background from "./Navbar_Background";
import { useNavbarBanners } from "./hooks/useNavbarBanners";
import { TAB_MODULE_MAP, TopTab, isTopTab } from "./navbarConstants";
import { useModuleIcons } from "./hooks/useModuleIcons";
import type { ApiModuleIcon } from "./api/ModuleIconsApi";

import WalletSvg from "../assets/homepage/navwallet.svg";
import Reward from "../assets/product/rewards.svg";
import { useAppTheme } from "../theme/ThemeContext";

import type { RootStackParamList } from "@/navigation/types";

// --- Types & Constants ---
export type { TopTab } from "./navbarConstants";

type NavbarProps = {
  activeModule?: TopTab;
  onModuleChange?: (tab: TopTab) => void;
};

type ApiAddress = {
  address_type?: string;
  is_default?: number;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  zipcode?: string;
};

type NavStateLike = {
  index: number;
  routes: Array<{
    name: string;
    state?: NavStateLike;
    params?: { moduleName?: string; screen?: string };
  }>;
};

type NavbarUserSnapshot = {
  displayName: string;
  displayAddress: string;
  rewardPoints: number;
  ts: number;
};

const NAVBAR_USER_TTL_MS = 60_000;
const EMPTY_ADDRESS_LABEL = "Address not set";
let navbarUserCache: NavbarUserSnapshot | null = null;
let navbarUserInFlight: Promise<NavbarUserSnapshot> | null = null;

const PRODUCT_ROUTES = new Set(["Home", "Explore", "ProductScreen", "Cart"]);
const PRODUCT_MODULE_ROUTES = new Set(["ProductModule"]);

const SERVICE_ROUTES = new Set([
  "ServiceStack",
  "ServicesModule",
  "ServicesHome",
  "Government_Document_Screen",
  "PackScreen",
  "PackEnquiryForm",
  "BundleEnquiryForm",
  "SubmittedSuccessful",
]);

const PAYMENT_ROUTES = new Set([
  "BBPSHomeStack",
  "PaymentsModule",
  "BBPSHome",
  "BBPSCategory",
  "BBPSBillers",
]);

// --- Helpers ---

/**
 * Detects which module (ProductModule, ServicesModule, PaymentsModule, DineOutModule)
 * is currently active in the ModuleStack by traversing the navigation state.
 * Most reliable source for activeTab since it's independent of nested route names.
 */
const getActiveModuleFromState = (state?: NavStateLike): TopTab | null => {
  if (!state?.routes?.length) return null;

  let currentState = state;
  while (currentState?.routes?.length) {
    const focused = currentState.routes[currentState.index] ?? currentState.routes[0];

    if (focused?.name === "ProductModule") return "Product";
    if (focused?.name === "ServicesModule") return "Services";
    if (focused?.name === "PaymentsModule") return "Payments";
    if (focused?.name === "DineOutModule") return "DineOut";
    if (focused?.name === "Dashboard") return "Product";

    // When navigate('Home', { screen: 'ServicesModule' }) fires, Home.state may be
    // undefined for the first render tick before ModuleStack processes the nested params.
    // Check params.screen as an immediate signal so the correct tab highlights without flash.
    const paramsScreen = focused?.params?.screen as string | undefined;
    if (paramsScreen === "ProductModule") return "Product";
    if (paramsScreen === "ServicesModule") return "Services";
    if (paramsScreen === "PaymentsModule") return "Payments";
    if (paramsScreen === "DineOutModule") return "DineOut";

    if (focused?.state) {
      currentState = focused.state;
    } else {
      break;
    }
  }

  return null;
};

const getDeepestFocusedRoute = (
  state?: NavStateLike
): { routeName: string; moduleName?: string } => {
  if (!state?.routes?.length) return { routeName: "Home" };
  const focused = state.routes[state.index] ?? state.routes[0];
  if (focused?.state) return getDeepestFocusedRoute(focused.state);
  return {
    routeName: focused?.name ?? "Home",
    moduleName: focused?.params?.moduleName,
  };
};

const getActiveTab = (
  routeName: string,
  moduleName?: string,
  moduleFromState?: TopTab | null
): TopTab => {
  // Priority 1: Module detected from navigation state (most reliable)
  // This correctly identifies the active module even for ambiguous route names like "Home"
  if (moduleFromState) return moduleFromState;

  // Priority 2: moduleName param (for explicit routing)
  if (isTopTab(moduleName)) return moduleName;

  // Priority 3: routeName-based detection (fallback for edge cases)
  if (PRODUCT_ROUTES.has(routeName) || PRODUCT_MODULE_ROUTES.has(routeName)) return "Product";
  if (SERVICE_ROUTES.has(routeName)) return "Services";
  if (PAYMENT_ROUTES.has(routeName)) return "Payments";
  if (routeName === "DineOutModule") return "DineOut";

  return "Product";
};

const TOP_TAB_BY_ROUTE_KEY: Record<string, TopTab> = {
  ProductModule: "Product",
  ServicesModule: "Services",
  PaymentsModule: "Payments",
  DineOutModule: "DineOut",
};

const MODULE_KEY_BY_TOP_TAB = Object.entries(TAB_MODULE_MAP).reduce(
  (acc, [tab, moduleKey]) => {
    acc[tab as TopTab] = moduleKey;
    return acc;
  },
  {} as Record<TopTab, string>
);

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const ACTIVE_TAB_SCALE = 1.08;
const PRESSED_SCALE_DELTA = 0.08;

// --- Sub-component (icon-forward, no card background — dot indicator marks active) ---
const TopIconWithLabel = React.memo(
  ({
    active,
    onPress,
    iconUrl,
    moduleKey,
    label,
    activeTint,
    inactiveTint,
    gradientStart,
    gradientEnd,
  }: {
    active: boolean;
    onPress: () => void;
    iconUrl: string | null;
    moduleKey: string;
    label: string;
    activeTint?: string;
    inactiveTint: string;
    gradientStart?: string | null;
    gradientEnd?: string | null;
  }) => {
    const hasGradient = Boolean(gradientStart && gradientEnd);
    const tint = active ? activeTint ?? "#FFFFFF" : inactiveTint;
    // Base scale grows with a spring when the tab becomes active (visual
    // weight), and presses shrink from whatever the current base is —
    // never fighting an in-flight active/inactive transition.
    const scale = React.useRef(new Animated.Value(active ? ACTIVE_TAB_SCALE : 1)).current;
    const isPressedRef = React.useRef(false);

    React.useEffect(() => {
      if (isPressedRef.current) return;
      Animated.spring(scale, {
        toValue: active ? ACTIVE_TAB_SCALE : 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 8,
      }).start();
    }, [active, scale]);

    const handlePressIn = React.useCallback(() => {
      isPressedRef.current = true;
      Animated.spring(scale, {
        toValue: (active ? ACTIVE_TAB_SCALE : 1) - PRESSED_SCALE_DELTA,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }).start();
    }, [active, scale]);

    const handlePressOut = React.useCallback(() => {
      isPressedRef.current = false;
      Animated.spring(scale, {
        toValue: active ? ACTIVE_TAB_SCALE : 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    }, [active, scale]);

    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabItem, { transform: [{ scale }] }]}
      >
        {iconUrl ? (
          hasGradient ? (
            <LinearGradient
              colors={[gradientStart as string, gradientEnd as string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.moduleIconGradientWrap}
            >
              <RNImage
                source={{ uri: iconUrl }}
                style={styles.moduleIconInGradient}
                resizeMode="contain"
                onLoad={() => {
                  if (__DEV__) {
                    console.log("[CMS] Module icon loaded:", moduleKey);
                  }
                }}
                onError={() => {
                  if (__DEV__) {
                    console.log("[CMS] Module icon failed:", moduleKey, iconUrl);
                  }
                }}
              />
            </LinearGradient>
          ) : (
            <RNImage
              source={{ uri: iconUrl }}
              style={styles.moduleIcon}
              resizeMode="contain"
              onLoad={() => {
                if (__DEV__) {
                  console.log("[CMS] Module icon loaded:", moduleKey);
                }
              }}
              onError={() => {
                if (__DEV__) {
                  console.log("[CMS] Module icon failed:", moduleKey, iconUrl);
                }
              }}
            />
          )
        ) : null}

        <Text
          style={[styles.topTabLabel, { color: tint, opacity: active ? 1 : 0.75 }]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {active ? (
          <View style={[styles.activeDot, { backgroundColor: tint }]} />
        ) : (
          <View style={styles.activeDotSpacer} />
        )}
      </AnimatedTouchableOpacity>
    );
  }
);

export default function Navbar({ activeModule, onModuleChange }: NavbarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const { isDark, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const rewardPointsLabel = React.useMemo(() => {
    const points = Number(rewardPoints || 0);
    if (points >= 100000) return `${Math.floor(points / 1000)}k`;
    if (points >= 10000) return `${(points / 1000).toFixed(1)}k`;
    return points.toLocaleString("en-IN");
  }, [rewardPoints]);
  // ✅ Get full navigation state once and derive both deepest route and active module
  const navigationState = useNavigationState((state) => state);

  const { deepestRoute, activeModuleTab } = React.useMemo(() => {
    return {
      deepestRoute: getDeepestFocusedRoute(navigationState as unknown as NavStateLike),
      activeModuleTab: getActiveModuleFromState(navigationState as unknown as NavStateLike),
    };
  }, [navigationState]);

  // Depend only on primitive moduleName, not route.params object
  const routeModuleName = route?.params?.moduleName;
  const moduleName = routeModuleName ?? deepestRoute.moduleName;

  const detectedActiveTab = React.useMemo<TopTab>(
    () =>
      getActiveTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [deepestRoute.routeName, route.name, moduleName, activeModuleTab]
  );
  const activeTab = activeModule ?? detectedActiveTab;
  const showLocation = activeTab === "Product";

  // Campaign-driven banner config per tab (falls back to the bundled static
  // images/colors in navbarConstants when the API has no data for a tab).
  const { banners } = useNavbarBanners();
  React.useEffect(() => {
    if (!__DEV__) return;
    console.log("[CMS] Navbar active tab:", activeTab);
    console.log("[CMS] Navbar banner:", banners[activeTab]);
    console.log("[CMS] Navbar image URL:", banners[activeTab]?.imageUrl);
  }, [activeTab, banners]);

  // API failure/empty response just yields an empty list — no hardcoded
  // Product/Services/Payments/etc. fallback, per the CMS-only requirement.
  const { modules } = useModuleIcons();
  const activeModuleKeyFromRoute = MODULE_KEY_BY_TOP_TAB[activeTab];
  const [selectedModuleKey, setSelectedModuleKey] = React.useState(activeModuleKeyFromRoute);

  React.useEffect(() => {
    setSelectedModuleKey(activeModuleKeyFromRoute);
  }, [activeModuleKeyFromRoute]);

  React.useEffect(() => {
    if (!__DEV__) return;
    console.log("[CMS] Modules:", modules);
    modules.forEach((module) => {
      console.log("[CMS] Module:", {
        module_key: module.module_key,
        label: module.label,
        icon_url: module.icon_url,
        active_icon_url: module.active_icon_url,
        route_key: module.route_key,
        is_active: module.is_active,
      });
    });
  }, [modules]);

  const activeThemeColor = React.useMemo(
    () => banners[activeTab]?.bgColor ?? "transparent",
    [activeTab, banners]
  );
  const walletBadgeColor = React.useMemo(
    () => activeThemeColor,
    [activeThemeColor]
  );
  // Search bar + wallet button float over the campaign banner, so they read
  // as translucent glass cards rather than solid boxes on top of it.
  const frostedSurface = isDark ? "rgba(20,20,20,0.55)" : "rgba(255,255,255,0.9)";
  const navbarBorder = isDark ? theme.border : "rgba(0,0,0,0.10)";
  const navbarIconColor = isDark ? "#FFFFFF" : "#111827";
  const navbarMutedColor = isDark ? theme.secondaryText : "#6B7280";
  const isNavigatingRef = React.useRef(false);

  const [displayName, setDisplayName] = React.useState("User");
  const [displayAddress, setDisplayAddress] =
    React.useState(EMPTY_ADDRESS_LABEL);
  const hasAddress = String(displayAddress || "").trim() !== EMPTY_ADDRESS_LABEL;

  // Shares the same query cache the address screens invalidate after add/edit/
  // delete/set-default, so the navbar address updates immediately instead of
  // only refreshing once per 60s cache window on mount.
  const { data: liveAddressData } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  const { data: notificationBadge } = useQuery({
    queryKey: ["notification", "badge"],
    queryFn: getNotificationBadge,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const hasUnreadNotifications = Boolean(notificationBadge?.success && notificationBadge.count > 0);

  React.useEffect(() => {
    if (!isAuthenticated || !liveAddressData) return;

    const list: ApiAddress[] = Array.isArray(liveAddressData?.data) ? liveAddressData.data : [];
    const selectedAddress =
      list.find((item) => Number(item?.is_default) === 1) || list[0];

    const addressText = [
      selectedAddress?.address1,
      selectedAddress?.address2,
      selectedAddress?.city,
      selectedAddress?.state,
      selectedAddress?.zipcode,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");

    const nextDisplayAddress = addressText || EMPTY_ADDRESS_LABEL;
    setDisplayAddress(nextDisplayAddress);
    if (navbarUserCache) {
      navbarUserCache = {
        ...navbarUserCache,
        displayAddress: nextDisplayAddress,
      };
    }
  }, [isAuthenticated, liveAddressData]);

  const applyUserSnapshot = React.useCallback((snapshot: NavbarUserSnapshot) => {
    setDisplayName((prev) => (prev === snapshot.displayName ? prev : snapshot.displayName));
    setDisplayAddress((prev) => {
      if (prev !== EMPTY_ADDRESS_LABEL && snapshot.displayAddress === EMPTY_ADDRESS_LABEL) {
        return prev;
      }
      return prev === snapshot.displayAddress ? prev : snapshot.displayAddress;
    });
    setRewardPoints((prev) =>
      prev === snapshot.rewardPoints ? prev : snapshot.rewardPoints
    );
  }, []);

  const navigateToScreen = React.useCallback(
    (screen: string, params?: any) => {
      handleNavigateWithPrefetch({
        navigate: () => {
          try {
            if (params) (navigation as any).navigate(screen, params);
            else (navigation as any).navigate(screen);
          } catch (error) {
            console.warn(`Navigation to ${screen} failed:`, error);
            const parentNav = (navigation as any).getParent?.();
            try {
              if (parentNav) {
                if (params) parentNav.navigate?.(screen, params);
                else parentNav.navigate?.(screen);
              }
            } catch (parentError) {
              console.error(
                `Parent navigation to ${screen} also failed:`,
                parentError
              );
            }
          }
        },
      });
    },
    [navigation]
  );

  const handleTab = React.useCallback(
    (tab: TopTab) => {
      if (tab === activeTab || isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const SCREEN: Record<TopTab, string> = {
        Product: "ProductModule",
        Services: "ServicesModule",
        Payments: "PaymentsModule",
        DineOut: "DineOutModule",
      };

      // navigate('Home', { screen }) works from both Dashboard (AppStack – mounts MainLayout
      // then navigates inside ModuleStack) and from within MainLayout (already on Home –
      // React Navigation detects the screen is focused and updates the nested state directly).
      // No handleNavigateWithPrefetch wrapper so the switch is instant (<1 frame).
       if (onModuleChange) {
         onModuleChange(tab);
       } else {
         (navigation as any).navigate("Home", {
           screen: SCREEN[tab],
           params: { moduleName: tab },
         });
       }

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation, onModuleChange]
  );

  const handleModulePress = React.useCallback(
    (module: ApiModuleIcon) => {
      if (module.module_key === selectedModuleKey || isNavigatingRef.current) return;

      setSelectedModuleKey(module.module_key);

      if (!module.route_key) return;

      const knownTab = TOP_TAB_BY_ROUTE_KEY[module.route_key];
      if (knownTab) {
        handleTab(knownTab);
        return;
      }

      try {
        (navigation as any).navigate("Home", {
          screen: module.route_key,
          params: { moduleName: module.module_key },
          moduleName: module.module_key,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn("Navigation to CMS module failed:", {
            module_key: module.module_key,
            route_key: module.route_key,
            error,
          });
        }
      }
    },
    [handleTab, navigation, selectedModuleKey]
  );

  const navigateToAddAddress = React.useCallback(() => {
    navigateToScreen("AddressSelect", { manageOnly: true });
  }, [navigateToScreen]);

  const navigateToChangeAddress = React.useCallback(() => {
    navigateToScreen("AddressSelect", { manageOnly: true });
  }, [navigateToScreen]);

  const loadNavbarUser = React.useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      applyUserSnapshot({
        displayName: "Guest",
        displayAddress: EMPTY_ADDRESS_LABEL,
        rewardPoints: 0,
        ts: Date.now(),
      });
      return;
    }

    const now = Date.now();
    const hasFreshCache =
      !forceRefresh &&
      navbarUserCache &&
      now - navbarUserCache.ts < NAVBAR_USER_TTL_MS;

    if (hasFreshCache) {
      applyUserSnapshot(navbarUserCache as NavbarUserSnapshot);
      return;
    }

    if (navbarUserInFlight) {
      const snapshot = await navbarUserInFlight;
      applyUserSnapshot(snapshot);
      return;
    }

    navbarUserInFlight = (async () => {
      try {
        const storedName = await getStoredUserName();
        const userInfo = await fetchUserInfo();
        const user = userInfo?.user || null;
        const fetchedRewardPoints = Number(
          user?.rewardPoints || userInfo?.data?.rewardPoints || 0
        );
        const userName =
          userInfo?.name ||
          user?.name ||
          user?.full_name ||
          user?.username ||
          storedName ||
          "User";

        // Address is now sourced reactively from the shared addresses query
        // (see liveAddressData above), which updates instantly whenever an
        // address is added/edited/deleted/set-default anywhere in the app.
        const snapshot: NavbarUserSnapshot = {
          displayName: String(userName),
          displayAddress: navbarUserCache?.displayAddress || EMPTY_ADDRESS_LABEL,
          rewardPoints: fetchedRewardPoints,
          ts: Date.now(),
        };

        navbarUserCache = snapshot;
        return snapshot;
      } catch (error) {
        console.warn("Failed to load navbar user info:", error);
        return {
          displayName: navbarUserCache?.displayName || "User",
          displayAddress: navbarUserCache?.displayAddress || EMPTY_ADDRESS_LABEL,
          rewardPoints: navbarUserCache?.rewardPoints || 0,
          ts: Date.now(),
        } as NavbarUserSnapshot;
      } finally {
        navbarUserInFlight = null;
      }
    })();

    const snapshot = await navbarUserInFlight;
    applyUserSnapshot(snapshot);
  }, [applyUserSnapshot, isAuthenticated]);

  React.useEffect(() => {
    loadNavbarUser(false);
  }, [loadNavbarUser]);

  return (
    <View style={styles.wrapper}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ✅ Campaign-driven banner, cross-fades smoothly between modules */}
      <Navbar_Background
        activeTab={activeTab}
        banners={banners}
        insetsTop={insets.top}
        isDark={isDark}
      />

      {/* PROFILE: avatar + greeting/address, wallet + notifications */}
      <View style={styles.profileRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.avatarWrap, { backgroundColor: frostedSurface, borderColor: navbarBorder }]}
          onPress={() => navigateToScreen("Profile")}
        >
          <MaterialCommunityIcons name="account-circle" size={40} color={navbarIconColor} />
        </TouchableOpacity>

        <View style={styles.greetColumn}>
          <Text style={styles.helloText} numberOfLines={1}>
            Hello, {displayName}!
          </Text>

          <View
            style={[styles.miniLocationRow, !showLocation && styles.locationRowHidden]}
            pointerEvents={showLocation ? "auto" : "none"}
          >
            <MaterialCommunityIcons name="map-marker" size={13} color="#4ADE80" />
            <Text
              style={styles.miniLocationText}
              numberOfLines={1}
              ellipsizeMode="tail"
              onPress={hasAddress ? navigateToChangeAddress : navigateToAddAddress}
            >
              {hasAddress ? displayAddress : "Add address"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={13} color="rgba(255,255,255,0.85)" />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.walletBox, { backgroundColor: frostedSurface, borderColor: navbarBorder }]}
            onPress={() => navigateToScreen("WalletHistory")}
            hitSlop={{ top: 6, bottom: 10, left: 6, right: 6 }}
          >
            <WalletSvg width={26} height={26} />
            <View
              style={[
                styles.walletTag,
                { backgroundColor: walletBadgeColor },
              ]}
            >
              <View style={styles.walletTagInner}>
                <Reward width={11} height={11} />
                <Text style={styles.walletTagText} numberOfLines={1}>
                  {rewardPointsLabel}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bellBtn, { backgroundColor: frostedSurface, borderColor: navbarBorder }]}
            onPress={() => navigateToScreen("Notification")}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={navbarIconColor} />
            {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.searchContainer,
            {
              backgroundColor: frostedSurface,
              borderColor: navbarBorder,
            },
          ]}
          onPress={() => {
            if (activeTab === "Services") {
              navigateToScreen("ServiceSearch");
            } else if (activeTab === "Payments") {
              (navigation as any).navigate("Home", {
                screen: "PaymentsModule",
                params: { screen: "Search" },
              });
            } else {
              navigateToScreen("SearchScreen");
            }
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={navbarIconColor} />
          <Text style={[styles.fakePlaceholder, { color: navbarMutedColor }]}>Search products, services & more</Text>
        </TouchableOpacity>
      </View>

      {/* MODULE TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topIconsRow}
      >
        {modules.map((module) => {
          const active = module.module_key === selectedModuleKey;
          const iconUrl = active
            ? module.active_icon_url || module.icon_url
            : module.icon_url;

          return (
            <TopIconWithLabel
              key={module.module_key}
              active={active}
              onPress={() => handleModulePress(module)}
              iconUrl={iconUrl}
              moduleKey={module.module_key}
              label={module.label}
              activeTint={module.active_color || activeThemeColor}
              inactiveTint={module.normal_color || navbarIconColor}
              gradientStart={module.gradient_start_color}
              gradientEnd={module.gradient_end_color}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 18,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 10,
    marginTop: 4,
  },

  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  greetColumn: {
    flex: 1,
    minWidth: 0,
  },

  helloText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  miniLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 4,
  },

  miniLocationText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bellBtn: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    width: 46,
    height: 46,
    borderWidth: 1,
  },

  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
    marginTop: 14,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },

  fakePlaceholder: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13.5,
    fontWeight: "500",
  },

  walletBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    width: 46,
    height: 46,
    borderWidth: 1,
    overflow: "visible",
  },

  walletTag: {
    position: "absolute",
    bottom: -7,
    right: -6,
    minWidth: 28,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: "#fff",
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  walletTagInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  walletTagText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
    lineHeight: 12,
    maxWidth: 34,
  },

  locationRowHidden: {
    opacity: 0,
  },

  // --- Module tabs: no box, icon-forward, bottom of navbar ---
  topIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: "100%",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 22,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 56,
  },

  moduleIcon: {
    width: 64,
    height: 64,
  },

  // Only used when a module has both gradient_start_color and
  // gradient_end_color from the CMS — keeps the same 64x64 footprint as the
  // plain icon so layout never shifts, just shows a colored backdrop.
  moduleIconGradientWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  moduleIconInGradient: {
    width: 40,
    height: 40,
  },

  topTabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },

  activeDotSpacer: {
    height: 8,
  },
});
