import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";

import { fetchUserInfo, getStoredUserName } from "../modules/common/auth/api/AuthAPI";
import { fetchAllAddress } from "../modules/ecommerce/api/AddressApi";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import {
  addressesQueryKey,
  handleNavigateWithPrefetch,
} from "../modules/ecommerce/navigation/navigationPerformance";

import ServiceTop from "./assete/Service_BG.png";
import PaymentTop from "./assete/Payment_BG.png";
import BusBookingTop from "./assete/Bus_BG.png";
import Background1 from "./assete/Background1.jpeg";

import WalletSvg from "../assets/homepage/navwallet.svg";
import Home_Nav from "../assets/menu/Home_Nav.svg";
import Services from "../assets/menu/Services.svg";
import Payments from "../assets/menu/Payments.svg";
import Payments2 from "../assets/menu/Payments2.svg";
import Bus_Booking from "../assets/menu/Bus_Booking.svg";
import Bus from "../assets/menu/Bus.svg";
import Reward from "../assets/product/rewards.svg";
import HealthTopIcon from "../modules/health/assets/icons/health_icon.svg";
import GamesTopIcon from "../modules/health/assets/icons/games_icon.svg";
import CommunityTopIcon from "../modules/health/assets/icons/community_icon.svg";
import DineoutTopIcon from "../modules/health/assets/icons/dineout_icon.svg";
import { useAppTheme } from "../theme/ThemeContext";

import type { RootStackParamList } from "@/navigation/types";

export type TopTab = "Product" | "Services" | "Payments" | "DineOut";

type NavbarProps = {
  activeModule?: TopTab;
  onModuleChange?: (tab: TopTab) => void;
  topTabsVariant?: "default" | "health" | "busBooking";
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
  rewardPoints: number;
  ts: number;
};

type HealthEntry = {
  id: "health" | "games" | "community" | "dineout";
  label: string;
  Icon: SvgIcon;
  variant: "filled" | "outline";
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
  Product: Background1,
  Services: ServiceTop,
  Payments: PaymentTop,
  DineOut: BusBookingTop,
};

const TAB_THEME: Record<TopTab, { bgColor: string; activeTint?: string }> = {
  Product: { bgColor: "#5F341A" },
  Services: { bgColor: "#4F6BFF" },
  Payments: { bgColor: "#EAE2FF", activeTint: "#532C99" },
  DineOut: { bgColor: "#FFE3E8", activeTint: "#CE1538" },
};

const TOP_TABS: TopTab[] = ["Product", "Services", "Payments", "DineOut"];
const HEALTH_HEADER_GRADIENT = ["#2e72be", "#013674"];

const HEALTH_EXPERIENCE_TABS: HealthEntry[] = [
  { id: "health", label: "Health", Icon: HealthTopIcon as unknown as SvgIcon, variant: "filled" },
  { id: "games", label: "Games", Icon: GamesTopIcon as unknown as SvgIcon, variant: "outline" },
  { id: "community", label: "Community", Icon: CommunityTopIcon as unknown as SvgIcon, variant: "outline" },
  { id: "dineout", label: "Dine Out", Icon: DineoutTopIcon as unknown as SvgIcon, variant: "outline" },
];

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
    ActiveIcon,
    label,
    activeColor,
    activeTint,
    inactiveTint,
    inactiveBackground,
    inactiveBorder,
  }: {
    active: boolean;
    onPress: () => void;
    Icon: SvgIcon;
    ActiveIcon?: SvgIcon;
    label: string;
    activeColor: string;
    activeTint?: string;
    inactiveTint: string;
    inactiveBackground: string;
    inactiveBorder: string;
  }) => {
    const tint = active ? activeTint ?? "#FFFFFF" : inactiveTint;
    const RenderIcon = active && ActiveIcon ? ActiveIcon : Icon;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.topTabCard,
          {
            backgroundColor: inactiveBackground,
            borderColor: inactiveBorder,
          },
          active && styles.topTabCardActive,
          active && { backgroundColor: activeColor },
        ]}
      >
        <RenderIcon width={28} height={28} fill={tint} stroke={tint} color={tint} />
        <Text style={[styles.topTabLabel, { color: tint }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
);

export default function Navbar({
  activeModule,
  onModuleChange,
  topTabsVariant = "default",
}: NavbarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const { isDark, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const [displayName, setDisplayName] = React.useState("User");
  const [displayAddress, setDisplayAddress] =
    React.useState(EMPTY_ADDRESS_LABEL);
  const hasAddress = String(displayAddress || "").trim() !== EMPTY_ADDRESS_LABEL;
  const isNavigatingRef = React.useRef(false);

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

  const detectedActiveTab = React.useMemo<TopTab>(
    () =>
      getActiveTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [deepestRoute.routeName, route.name, moduleName, activeModuleTab]
  );

  const activeTab = activeModule ?? detectedActiveTab;
  const showLocation = activeTab === "Product";

  const activeThemeColor = React.useMemo(
    () => TAB_THEME[activeTab]?.bgColor ?? TAB_THEME.Product.bgColor,
    [activeTab]
  );
  const walletBadgeColor = React.useMemo(
    () => TAB_THEME[activeTab]?.activeTint ?? activeThemeColor,
    [activeTab, activeThemeColor]
  );
  const navbarSurface = isDark ? theme.card : "#FFFFFF";
  const navbarBorder = isDark ? theme.border : "rgba(0,0,0,0.10)";
  const navbarIconColor = isDark ? "#FFFFFF" : "#111827";
  const navbarMutedColor = isDark ? theme.secondaryText : "#6B7280";
  const backgroundOpacities = React.useRef<Record<TopTab, Animated.Value>>({
    Product: new Animated.Value(activeTab === "Product" ? 1 : 0),
    Services: new Animated.Value(activeTab === "Services" ? 1 : 0),
    Payments: new Animated.Value(activeTab === "Payments" ? 1 : 0),
    DineOut: new Animated.Value(activeTab === "DineOut" ? 1 : 0),
  }).current;

  React.useEffect(() => {
    const animations = TOP_TABS.map((tab) => {
      backgroundOpacities[tab].stopAnimation();
      return Animated.timing(backgroundOpacities[tab], {
        toValue: tab === activeTab ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      });
    });

    Animated.parallel(animations).start();
    return () => animations.forEach((animation) => animation.stop());
  }, [activeTab, backgroundOpacities]);

  const { data: liveAddressData } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!isAuthenticated || !liveAddressData) return;

    const list: ApiAddress[] = Array.isArray(liveAddressData?.data)
      ? liveAddressData.data
      : [];
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
    (screen: keyof RootStackParamList | string, params?: any) => {
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

      const screenMap: Record<TopTab, string> = {
        Product: "ProductModule",
        Services: "ServicesModule",
        Payments: "PaymentsModule",
        DineOut: "DineOutModule",
      };

      if (onModuleChange) {
        onModuleChange(tab);
      } else {
        (navigation as any).navigate("Home", {
          screen: screenMap[tab],
          params: { moduleName: tab },
        });
      }

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation, onModuleChange]
  );

  const handleHealthExperienceTab = React.useCallback(
    (tabId: HealthEntry["id"]) => {
      if (tabId === "health") {
        navigateToScreen("HealthStack");
        return;
      }

      if (tabId === "games") {
        handleTab("Product");
        return;
      }

      if (tabId === "community") {
        handleTab("Services");
        return;
      }

      handleTab("DineOut");
    },
    [handleTab, navigateToScreen]
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
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {topTabsVariant === "health" ? (
        <LinearGradient
          colors={HEALTH_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bgWrapper, styles.healthBgWrapper]}
          pointerEvents="none"
        />
      ) : (
        <View
          style={[styles.bgWrapper, { backgroundColor: activeThemeColor }]}
          pointerEvents="none"
        >
          {TOP_TABS.map((tab) => (
            <Animated.Image
              key={tab}
              source={BG_MAP[tab]}
              style={[
                styles.absoluteFill,
                { top: -insets.top, opacity: backgroundOpacities[tab] },
              ]}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {topTabsVariant === "health" ? (
        <>
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

          <View style={styles.healthProfileRow}>
            <View style={styles.healthProfileLeft}>
              <View style={styles.healthAvatarOuter}>
                <View style={styles.healthAvatarInner}>
                  <MaterialCommunityIcons name="account" size={20} color="#7C2D12" />
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
        </>
      ) : topTabsVariant === "busBooking" ? (
        <>
          <View style={styles.topIconsRow}>
            <TopIconWithLabel
              active={activeTab === "Product"}
              onPress={() => handleTab("Product")}
              Icon={Home_Nav as unknown as SvgIcon}
              label="Product"
              activeColor={TAB_THEME.Product.bgColor}
              activeTint={TAB_THEME.Product.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "Services"}
              onPress={() => handleTab("Services")}
              Icon={Services as unknown as SvgIcon}
              label="Services"
              activeColor={TAB_THEME.Services.bgColor}
              activeTint={TAB_THEME.Services.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "Payments"}
              onPress={() => handleTab("Payments")}
              Icon={Payments as unknown as SvgIcon}
              ActiveIcon={Payments2 as unknown as SvgIcon}
              label="Payments"
              activeColor={TAB_THEME.Payments.bgColor}
              activeTint={TAB_THEME.Payments.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "DineOut"}
              onPress={() => handleTab("DineOut")}
              Icon={Bus_Booking as unknown as SvgIcon}
              ActiveIcon={Bus as unknown as SvgIcon}
              label="Bus Booking"
              activeColor={TAB_THEME.DineOut.bgColor}
              activeTint={TAB_THEME.DineOut.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />
          </View>

          <View style={styles.busBookingProfileRow}>
            <View style={styles.busBookingIdentityWrap}>
              <View style={styles.busBookingAvatar}>
                <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" />
              </View>

              <View style={styles.busBookingTextWrap}>
                <Text style={styles.busBookingGreeting} numberOfLines={1}>
                  Hello, {displayName}
                </Text>
                <View style={styles.busBookingLocationRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color="#FBBF24" />
                  <Text style={styles.busBookingLocationText} numberOfLines={1}>
                    {hasAddress ? displayAddress : "Pune, India"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.busBookingActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.busBookingWalletPill}
                onPress={() => navigateToScreen("WalletHistory")}
              >
                <WalletSvg width={19} height={19} />
                <Text style={styles.busBookingWalletText} numberOfLines={1}>
                  ₹6,549
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.busBookingBellButton}
                onPress={() => navigateToScreen("Notification")}
              >
                <MaterialCommunityIcons name="bell-outline" size={21} color="#374151" />
                <View style={styles.busBookingBellBadge}>
                  <Text style={styles.busBookingBellBadgeText}>1</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.topIconsRow}>
            <TopIconWithLabel
              active={activeTab === "Product"}
              onPress={() => handleTab("Product")}
              Icon={Home_Nav as unknown as SvgIcon}
              label="Product"
              activeColor={TAB_THEME.Product.bgColor}
              activeTint={TAB_THEME.Product.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "Services"}
              onPress={() => handleTab("Services")}
              Icon={Services as unknown as SvgIcon}
              label="Services"
              activeColor={TAB_THEME.Services.bgColor}
              activeTint={TAB_THEME.Services.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "Payments"}
              onPress={() => handleTab("Payments")}
              Icon={Payments as unknown as SvgIcon}
              ActiveIcon={Payments2 as unknown as SvgIcon}
              label="Payments"
              activeColor={TAB_THEME.Payments.bgColor}
              activeTint={TAB_THEME.Payments.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />

            <TopIconWithLabel
              active={activeTab === "DineOut"}
              onPress={() => handleTab("DineOut")}
              Icon={Bus_Booking as unknown as SvgIcon}
              ActiveIcon={Bus as unknown as SvgIcon}
              label="Bus Booking"
              activeColor={TAB_THEME.DineOut.bgColor}
              activeTint={TAB_THEME.DineOut.activeTint}
              inactiveTint={navbarIconColor}
              inactiveBackground={navbarSurface}
              inactiveBorder={navbarBorder}
            />
          </View>

          <View style={styles.topRow}>
            <View
              style={[styles.locationRow, !showLocation && styles.locationRowHidden]}
              pointerEvents={showLocation ? "auto" : "none"}
            >
              <MaterialCommunityIcons name="map-marker" size={18} color="#16A34A" />
              <Text
                style={[styles.locationText, { color: "#111827" }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                <Text style={[styles.homeBold, { color: "#111827" }]}>HOME- </Text>
                {displayName}
                {hasAddress ? `, ${displayAddress}` : ""}
              </Text>
              {hasAddress ? (
                <Text
                  style={styles.addAddressLink}
                  numberOfLines={1}
                  onPress={navigateToChangeAddress}
                >
                  {" "}Change Address
                </Text>
              ) : (
                <Text
                  style={styles.addAddressLink}
                  numberOfLines={1}
                  onPress={navigateToAddAddress}
                >
                  {" "}Add Address
                </Text>
              )}
            </View>
          </View>

          <View style={styles.searchRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.searchContainer,
                {
                  backgroundColor: navbarSurface,
                  borderColor: navbarBorder,
                  shadowColor: isDark ? "#000000" : "#000000",
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
              <Text style={[styles.fakePlaceholder, { color: navbarMutedColor }]}>
                Search “Reward Planners”
              </Text>
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
          </View>
        </>
      )}
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

  bgWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: "hidden",
  },

  healthBgWrapper: {
    top: -24,
    height: 320,
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

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 12,
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

  busBookingProfileRow: {
    marginTop: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  busBookingIdentityWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  busBookingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  busBookingTextWrap: {
    flex: 1,
  },

  busBookingGreeting: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  busBookingLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  busBookingLocationText: {
    marginLeft: 3,
    color: "rgba(255,255,255,0.94)",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },

  busBookingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  busBookingWalletPill: {
    minWidth: 70,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F59E0B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 4,
  },

  busBookingWalletText: {
    color: "#7C2D12",
    fontSize: 11,
    fontWeight: "900",
  },

  busBookingBellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  busBookingBellBadge: {
    position: "absolute",
    top: -2,
    right: -1,
    minWidth: 15,
    height: 15,
    borderRadius: 999,
    backgroundColor: "#F43F5E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  busBookingBellBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    lineHeight: 9,
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

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "72%",
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
    gap: 12,
    marginBottom: 15,
    marginTop: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderColor: "rgba(0,0,0,0.10)",
    borderWidth: 1,
    ...shadow,
  },

  fakePlaceholder: {
    flex: 1,
    marginLeft: 9,
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

  addAddressLink: {
    color: "#2563EB",
    textDecorationLine: "underline",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
  },
});
