import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  AppState,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchUserInfo, getStoredUserName } from "../modules/common/auth/api/AuthAPI";
import { fetchAllAddress } from "../modules/ecommerce/api/AddressApi";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";

import ProductTop from "./assete/Product_BG.jpg";
import ServiceTop from "./assete/Service_BG.png";
import PaymentTop from "./assete/Payment_BG.png";
import LinearGradient from "react-native-linear-gradient";

import WalletSvg from "../assets/homepage/navwallet.svg";
import Home_Nav from "../assets/menu/Home_Nav.svg";
import Services from "../assets/menu/Services.svg";
import Payments from "../assets/menu/Payments.svg";
import Dine_Out from "../assets/menu/Dine_Out.svg";
import Reward from "../assets/product/rewards.svg";
import HealthTopIcon from "../modules/health/assets/icons/health_icon.svg";
import GamesTopIcon from "../modules/health/assets/icons/games_icon.svg";
import CommunityTopIcon from "../modules/health/assets/icons/community_icon.svg";
import DineoutTopIcon from "../modules/health/assets/icons/dineout_icon.svg";

import type { RootStackParamList } from "@/navigation/types";

type NavbarProps = {
  topTabsVariant?: "default" | "health";
};

type TopTab = "Product" | "Services" | "Payments" | "DineOut";

type ApiAddress = {
  address_type?: string;
  is_default?: number;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  zipcode?: string;
};

type SvgIcon = React.ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  color?: string;
}>;

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
  userImage?: string | null;
  rewardPoints?: number;
  ts: number;
};

const NAVBAR_USER_TTL_MS = 60_000;
let navbarUserCache: NavbarUserSnapshot | null = null;
let navbarUserInFlight: Promise<NavbarUserSnapshot> | null = null;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 8000)));
    }
  }

  throw new Error("fetchWithRetry: exhausted retries");
};

const extractRewardPoints = (res: any): number => {
  if (__DEV__) {
    console.log("[WalletBadge] raw reward response:", {
      keys: Object.keys(res ?? {}),
      rewardCoins: res?.rewardCoins,
      reward_coins: res?.reward_coins,
      rewardPoints: res?.rewardPoints,
      reward_points: res?.reward_points,
      coins: res?.coins,
      points: res?.points,
      dataKeys: Object.keys(res?.data ?? {}),
      dataRewardCoins: res?.data?.rewardCoins,
      dataRewardPoints: res?.data?.rewardPoints,
      dataCoins: res?.data?.coins,
      userRewardCoins: res?.user?.rewardCoins,
      walletCoins: res?.wallet?.coins,
    });
  }

  return toNumber(
    res?.rewardCoins ??
      res?.reward_coins ??
      res?.rewardPoints ??
      res?.reward_points ??
      res?.coins ??
      res?.points ??
      res?.data?.rewardCoins ??
      res?.data?.reward_coins ??
      res?.data?.rewardPoints ??
      res?.data?.reward_points ??
      res?.data?.coins ??
      res?.data?.points ??
      res?.user?.rewardCoins ??
      res?.user?.reward_coins ??
      res?.user?.rewardPoints ??
      res?.user?.coins ??
      res?.wallet?.coins ??
      res?.wallet?.points ??
      res?.wallet?.rewardCoins,
    0
  );
};

const PRODUCT_ROUTES = new Set(["Home", "Explore", "ProductScreen", "Cart"]);
const PRODUCT_MODULE_ROUTES = new Set(["ProductModule"]);

const SERVICE_ROUTES = new Set([
  "ServiceStack",
  "ServicesModule",
  "ServicesHome",
  "HealthStack",
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

const BG_MAP: Record<TopTab, any> = {
  Product: ProductTop,
  Services: ServiceTop,
  Payments: PaymentTop,
  DineOut: ProductTop,
};

const TAB_THEME: Record<TopTab, { bgColor: string }> = {
  Product: { bgColor: "#5F341A" },
  Services: { bgColor: "#4F6BFF" },
  Payments: { bgColor: "#7C3AED" },
  DineOut: { bgColor: "#DC2626" },
};

const TOP_TABS: TopTab[] = ["Product", "Services", "Payments", "DineOut"];

const isTopTab = (value?: string): value is TopTab => {
  if (!value) return false;
  return TOP_TABS.includes(value as TopTab);
};

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
  if (moduleFromState) return moduleFromState;
  if (isTopTab(moduleName)) return moduleName;

  if (PRODUCT_ROUTES.has(routeName) || PRODUCT_MODULE_ROUTES.has(routeName)) return "Product";
  if (SERVICE_ROUTES.has(routeName)) return "Services";
  if (PAYMENT_ROUTES.has(routeName)) return "Payments";
  if (routeName === "DineOutModule") return "DineOut";

  return "Product";
};

const TopIconWithLabel = React.memo(
  ({
    active,
    onPress,
    Icon,
    label,
    activeColor,
  }: {
    active: boolean;
    onPress: () => void;
    Icon: SvgIcon;
    label: string;
    activeColor: string;
  }) => {
    const tint = active ? "#FFFFFF" : "#374151";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.topTabCard,
          active && styles.topTabCardActive,
          active && { backgroundColor: activeColor },
        ]}
      >
        <Icon width={28} height={28} fill={tint} stroke={tint} color={tint} />
        <Text style={[styles.topTabLabel, { color: tint }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
);

type HealthEntry = {
  id: "health" | "games" | "community" | "dineout";
  label: string;
  Icon: SvgIcon;
  variant: "filled" | "outline";
};

const HEALTH_EXPERIENCE_TABS: HealthEntry[] = [
  { id: "health", label: "Health", Icon: HealthTopIcon as unknown as SvgIcon, variant: "filled" },
  { id: "games", label: "Games", Icon: GamesTopIcon as unknown as SvgIcon, variant: "outline" },
  { id: "community", label: "Community", Icon: CommunityTopIcon as unknown as SvgIcon, variant: "outline" },
  { id: "dineout", label: "Dine Out", Icon: DineoutTopIcon as unknown as SvgIcon, variant: "outline" },
];

export default function Navbar({ topTabsVariant = "default" }: NavbarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const lastKnownPoints = React.useRef(navbarUserCache?.rewardPoints ?? 0);
  const [rewardPoints, setRewardPoints] = React.useState(
    () => navbarUserCache?.rewardPoints ?? 0
  );

  const updatePoints = React.useCallback((value: number) => {
    lastKnownPoints.current = value;
    setRewardPoints(value);
    if (navbarUserCache) {
      navbarUserCache.rewardPoints = value;
    }
  }, []);

  const rewardPointsLabel = React.useMemo(() => {
    const points = Number(rewardPoints || 0);
    if (points >= 100000) return `${Math.floor(points / 1000)}k`;
    if (points >= 10000) return `${(points / 1000).toFixed(1)}k`;
    return points.toLocaleString("en-IN");
  }, [rewardPoints]);

  const navigationState = useNavigationState((state) => state);

  const { deepestRoute, activeModuleTab } = React.useMemo(() => {
    return {
      deepestRoute: getDeepestFocusedRoute(navigationState as unknown as NavStateLike),
      activeModuleTab: getActiveModuleFromState(navigationState as unknown as NavStateLike),
    };
  }, [navigationState]);

  const routeModuleName = route?.params?.moduleName;
  const moduleName = routeModuleName ?? deepestRoute.moduleName;

  const activeTab = React.useMemo<TopTab>(
    () =>
      getActiveTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [deepestRoute.routeName, route.name, moduleName, activeModuleTab]
  );
  const showLocation = activeTab === "Product";

  const bgSource = React.useMemo(() => BG_MAP[activeTab], [activeTab]);
  const activeThemeColor = React.useMemo(
    () => TAB_THEME[activeTab]?.bgColor ?? TAB_THEME.Product.bgColor,
    [activeTab]
  );
  const isNavigatingRef = React.useRef(false);

  const [prevBgSource, setPrevBgSource] = React.useState(bgSource);
  const bgFade = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (bgSource === prevBgSource) return;
    bgFade.setValue(0);
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPrevBgSource(bgSource);
    });
  }, [bgSource, prevBgSource, bgFade]);

  const [displayName, setDisplayName] = React.useState("User");
  const [displayAddress, setDisplayAddress] =
    React.useState("Address not set");
  const [displayUserImage, setDisplayUserImage] = React.useState<string | null>(null);
  const hasAddress = String(displayAddress || "").trim() !== "Address not set";

  const applyUserSnapshot = React.useCallback(
    (snapshot: NavbarUserSnapshot) => {
      setDisplayName((prev) => (prev === snapshot.displayName ? prev : snapshot.displayName));
      setDisplayAddress((prev) =>
        prev === snapshot.displayAddress ? prev : snapshot.displayAddress
      );
      setDisplayUserImage((prev) => (prev === (snapshot.userImage ?? null) ? prev : (snapshot.userImage ?? null)));
      if (snapshot.rewardPoints !== undefined) {
        updatePoints(snapshot.rewardPoints);
      }
    },
    [updatePoints]
  );

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

      (navigation as any).navigate("Home", {
        screen: SCREEN[tab],
        params: { moduleName: tab },
      });

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation]
  );

  const handleHealthExperienceTab = React.useCallback(
    (tabId: HealthEntry["id"]) => {
      if (tabId === "health") {
        navigation.navigate("HealthStack");
        return;
      }

      if (tabId === "games") {
        (navigation as any).navigate("Home", {
          screen: "ProductModule",
          params: { moduleName: "Product" },
        });
        return;
      }

      if (tabId === "community") {
        (navigation as any).navigate("Home", {
          screen: "ServicesModule",
          params: { moduleName: "Services" },
        });
        return;
      }

      (navigation as any).navigate("Home", {
        screen: "DineOutModule",
        params: { moduleName: "DineOut" },
      });
    },
    [navigation]
  );

  const navigateToAddAddress = React.useCallback(() => {
    navigateToScreen("AddAddressMap", { fromSource: "newAddress" });
  }, [navigateToScreen]);

  const loadNavbarUser = React.useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      applyUserSnapshot({
        displayName: "Guest",
        displayAddress: "Address not set",
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
        const userInfo = await fetchWithRetry(() => fetchUserInfo());
        const user = userInfo?.user || null;
        const points = extractRewardPoints(userInfo);
        updatePoints(points);
        const userName =
          userInfo?.name ||
          user?.name ||
          user?.full_name ||
          user?.username ||
          storedName ||
          "User";
        const userImage =
          userInfo?.userImage ||
          user?.userImage ||
          user?.image ||
          user?.avatar ||
          null;

        const addressRes = await fetchAllAddress();
        const addresses: ApiAddress[] = Array.isArray(addressRes?.data)
          ? addressRes.data
          : [];

        const selectedAddress =
          addresses.find((item) => Number(item?.is_default) === 1) ||
          addresses[0];

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

        const snapshot: NavbarUserSnapshot = {
          displayName: String(userName),
          displayAddress: addressText || "Address not set",
          userImage: userImage ? String(userImage) : null,
          rewardPoints: points,
          ts: Date.now(),
        };

        navbarUserCache = snapshot;
        return snapshot;
      } catch (error) {
        console.warn("Failed to load navbar user info:", error);
        return {
          displayName: "User",
          displayAddress: "Address not set",
          userImage: null,
          rewardPoints: lastKnownPoints.current,
          ts: Date.now(),
        } as NavbarUserSnapshot;
      } finally {
        navbarUserInFlight = null;
      }
    })();

    const snapshot = await navbarUserInFlight;
    applyUserSnapshot(snapshot);
  }, [applyUserSnapshot, isAuthenticated, updatePoints]);

  const fetchRewardPoints = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetchWithRetry(() => fetchUserInfo());
      const points = extractRewardPoints(res);
      updatePoints(points);
    } catch (err) {
      if (__DEV__) {
        console.warn("[WalletBadge] fetchRewardPoints failed:", err);
      }
    }
  }, [isAuthenticated, updatePoints]);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchRewardPoints();
    });
    return () => sub.remove();
  }, [fetchRewardPoints]);

  React.useEffect(() => {
    loadNavbarUser(false);
  }, [loadNavbarUser]);

  const navbarContent = (
    <>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.bgWrapper} pointerEvents="none">
        <Image
          source={prevBgSource}
          style={[styles.absoluteFill, { top: -insets.top }]}
          resizeMode="cover"
        />
        {bgSource !== prevBgSource && (
          <Animated.Image
            source={bgSource}
            style={[styles.absoluteFill, { top: -insets.top, opacity: bgFade }]}
            resizeMode="cover"
          />
        )}
      </View>

      {topTabsVariant === "health" ? (
        <View style={styles.healthTopTabsRow}>
          {HEALTH_EXPERIENCE_TABS.map((tab) => {
            const isActive = tab.id === "health";

            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.9}
                onPress={() => handleHealthExperienceTab(tab.id)}
                style={[
                  styles.healthTopTabCard,
                  isActive ? styles.healthTopTabCardActive : styles.healthTopTabCardInactive,
                ]}
              >
                <tab.Icon
                  width={30}
                  height={30}
                  color={isActive ? "#22C55E" : "#6B7280"}
                  fill={tab.variant === "filled" ? (isActive ? "#22C55E" : "#6B7280") : "none"}
                  stroke={isActive ? "#22C55E" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.healthTopTabLabel,
                    isActive ? styles.healthTopTabLabelActive : null,
                  ]}
                  numberOfLines={2}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.topIconsRow}>
          <TopIconWithLabel
            active={activeTab === "Product"}
            onPress={() => handleTab("Product")}
            Icon={Home_Nav as unknown as SvgIcon}
            label="Product"
            activeColor={TAB_THEME.Product.bgColor}
          />

          <TopIconWithLabel
            active={activeTab === "Services"}
            onPress={() => handleTab("Services")}
            Icon={Services as unknown as SvgIcon}
            label="Services"
            activeColor={TAB_THEME.Services.bgColor}
          />

          <TopIconWithLabel
            active={activeTab === "Payments"}
            onPress={() => handleTab("Payments")}
            Icon={Payments as unknown as SvgIcon}
            label="Payments"
            activeColor={TAB_THEME.Payments.bgColor}
          />

          <TopIconWithLabel
            active={activeTab === "DineOut"}
            onPress={() => handleTab("DineOut")}
            Icon={Dine_Out as unknown as SvgIcon}
            label="Dine Out"
            activeColor={TAB_THEME.DineOut.bgColor}
          />
        </View>
      )}

      {topTabsVariant === "health" ? (
        <View style={styles.healthProfileRow}>
          <View style={styles.healthProfileLeft}>
            <View style={styles.healthAvatarOuter}>
              <View style={styles.healthAvatarInner}>
                {displayUserImage ? (
                  <Image
                    source={{ uri: displayUserImage }}
                    style={styles.healthAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="account" size={20} color="#7C2D12" />
                )}
              </View>
            </View>

            <View style={styles.healthIdentityBlock}>
              <Text style={styles.healthGreeting} numberOfLines={1}>
                Hello, {displayName}
              </Text>
              <View style={styles.healthLocationRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#FACC15" />
                <Text style={styles.healthLocationText} numberOfLines={1}>
                  {hasAddress ? displayAddress : "Add Address"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.healthActionsRight}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.healthWalletShell}
              onPress={() => navigateToScreen("WalletHistory")}
              hitSlop={{ top: 6, bottom: 10, left: 6, right: 6 }}
            >
              <WalletSvg width={26} height={26} />
              <View style={styles.healthWalletMiniTag}>
                <Reward width={10} height={10} />
                <Text style={styles.healthWalletMiniText} numberOfLines={1}>
                  {rewardPointsLabel}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.healthBellCircle}
              activeOpacity={0.85}
              onPress={() => navigateToScreen("Notification")}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#4B5563" />
              <View style={styles.healthBadgeDot} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.topRow}>
            <View
              style={[styles.locationRow, !showLocation && styles.locationRowHidden]}
              pointerEvents={showLocation ? "auto" : "none"}
            >
              <MaterialCommunityIcons name="map-marker" size={18} color="#16A34A" />
              <Text style={styles.locationText} numberOfLines={1}>
                <Text style={styles.homeBold}>HOME- </Text>
                {displayName}
                {hasAddress ? `, ${displayAddress}` : ", "}
                {!hasAddress ? (
                  <Text style={styles.addAddressLink} onPress={navigateToAddAddress}>
                    Add Address
                  </Text>
                ) : null}
              </Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.searchContainer}
              onPress={() => {
                if (activeTab === "Services") {
                  navigateToScreen("ServiceSearch");
                } else {
                  navigateToScreen("SearchScreen");
                }
              }}
            >
              <MaterialCommunityIcons name="magnify" size={20} color="#111827" />
              <Text style={styles.fakePlaceholder}>Search “Reward Planners”</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.walletBox}
              onPress={() => navigateToScreen("WalletHistory")}
              hitSlop={{ top: 6, bottom: 10, left: 6, right: 6 }}
            >
              <WalletSvg width={26} height={26} />
              <View
                style={[
                  styles.walletTag,
                  { backgroundColor: activeThemeColor },
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
              style={styles.iconCircle}
              activeOpacity={0.85}
              onPress={() => navigateToScreen("Notification")}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#111827" />
              <View style={styles.badgeDot} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );

  if (topTabsVariant === "health") {
    return (
      <LinearGradient
        colors={["#0157BB", "#013674"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrapper, styles.healthWrapper, { paddingTop: insets.top + 8 }]}
      >
        {navbarContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      {navbarContent}
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  android: {
    elevation: 6,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
  },
  healthWrapper: {
    paddingBottom: 12,
  },
  bgWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: -1,
    overflow: "hidden",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  topIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  healthTopTabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 8,
  },
  topTabCard: {
    width: 82,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadow,
  },
  topTabCardActive: {
    borderColor: "transparent",
  },
  topTabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  healthTopTabCard: {
    width: 82,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    ...shadow,
  },
  healthTopTabCardActive: {
    backgroundColor: "#CCFFC1",
    borderColor: "#BBF7D0",
  },
  healthTopTabCardInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(148,163,184,0.24)",
  },
  healthTopTabLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  healthTopTabLabelActive: {
    color: "#22C55E",
  },
  healthProfileRow: {
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthProfileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  healthAvatarOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  healthAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  healthAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  healthIdentityBlock: {
    flex: 1,
  },
  healthGreeting: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  healthLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthLocationText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12.5,
    fontWeight: "500",
    marginLeft: 2,
    flexShrink: 1,
  },
  healthActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  healthWalletShell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadow,
  },
  healthWalletMiniTag: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: [{ translateX: -16 }],
    minWidth: 34,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#7C3AED",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    gap: 2,
  },
  healthWalletMiniText: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 10,
    fontWeight: "900",
    maxWidth: 24,
  },
  healthBellCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  healthBadgeDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#fff",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  locationRowHidden: {
    opacity: 0,
  },
  homeBold: {
    fontWeight: "900",
    color: "#111827",
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    flexShrink: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderColor: "rgba(0,0,0,0.10)",
    borderWidth: 1,
    ...shadow,
  },
  fakePlaceholder: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  walletBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    overflow: "visible",
    ...shadow,
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
  iconCircle: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    ...shadow,
  },
  badgeDot: {
    position: "absolute",
    top: 9,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#fff",
  },
  addAddressLink: {
    color: "#2563EB",
    textDecorationLine: "underline",
    fontWeight: "800",
  },
});
