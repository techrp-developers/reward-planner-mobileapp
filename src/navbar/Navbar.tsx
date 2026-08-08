import React from "react";
import {
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useNavigation,
  useNavigationState,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "../theme/ThemeContext";
import { fetchUserInfo, getStoredUserName } from "../modules/common/auth/api/AuthAPI";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { fetchAllAddress } from "../modules/ecommerce/api/AddressApi";
import { handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";

import ServiceTop from "./assete/Service_BG.png";
import PaymentTop from "./assete/Payment_BG.png";
import BusBookingTop from "./assete/Bus_BG.png";
import Background1 from "./assete/Background1.jpeg";
import HealthTopIcon from "./assete/HealthTopIcon.svg";
import GamesTopIcon from "./assete/GamesTopIcon.svg";
import CommunityTopIcon from "./assete/CommunityTopIcon.svg";
import DineoutTopIcon from "./assete/DineoutTopIcon.svg";

import WalletSvg from "../assets/homepage/navwallet.svg";
import HomeNav from "../assets/menu/Home_Nav.svg";
import ServicesIcon from "../assets/menu/Services.svg";
import PaymentsIcon from "../assets/menu/Payments.svg";
import DineOutIcon from "../assets/menu/Dine_Out.svg";
import Reward from "../assets/product/rewards.svg";

import type { RootStackParamList } from "@/navigation/types";

export type TopTab = "Product" | "Services" | "Payments" | "DineOut";

type NavbarProps = {
  activeModule?: TopTab;
  onModuleChange?: (tab: TopTab) => void;
  topTabsVariant?: "default" | "health";
};

type ApiAddress = {
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
  "Health",
  "Government_Document_Screen",
  "PackScreen",
  "PackEnquiryForm",
  "BundleEnquiryForm",
  "SubmittedSuccessful",
  "ProvidersScreen",
  "EventsScreen",
  "BloodTestScreen",
  "FullBodyScreen",
  "XRAYScreen",
  "SpecializedGoalsScreen",
  "UpcomingEvenetsScreen",
  "BookAppointment",
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

const TAB_THEME: Record<
  TopTab,
  { bgColor: string; activeTint?: string; inactiveTint: string }
> = {
  Product: {
    bgColor: "#5F341A",
    inactiveTint: "#6B7280",
  },
  Services: {
    bgColor: "#4F6BFF",
    inactiveTint: "#6B7280",
  },
  Payments: {
    bgColor: "#EAE2FF",
    activeTint: "#532C99",
    inactiveTint: "#6B7280",
  },
  DineOut: {
    bgColor: "#FFE3E8",
    activeTint: "#CE1538",
    inactiveTint: "#6B7280",
  },
};

const TOP_TABS: TopTab[] = ["Product", "Services", "Payments", "DineOut"];
const MODULE_SCREEN_BY_TAB: Record<TopTab, string> = {
  Product: "ProductModule",
  Services: "ServicesModule",
  Payments: "PaymentsModule",
  DineOut: "DineOutModule",
};

const HEALTH_EXPERIENCE_TABS: HealthEntry[] = [
  { id: "health", label: "Health", Icon: HealthTopIcon as unknown as SvgIcon },
  { id: "games", label: "Games", Icon: GamesTopIcon as unknown as SvgIcon },
  { id: "community", label: "Community", Icon: CommunityTopIcon as unknown as SvgIcon },
  { id: "dineout", label: "Dine Out", Icon: DineoutTopIcon as unknown as SvgIcon },
];

const isTopTab = (value?: string): value is TopTab =>
  !!value && TOP_TABS.includes(value as TopTab);

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

    const paramsScreen = focused?.params?.screen;
    if (paramsScreen === "ProductModule") return "Product";
    if (paramsScreen === "ServicesModule") return "Services";
    if (paramsScreen === "PaymentsModule") return "Payments";
    if (paramsScreen === "DineOutModule") return "DineOut";

    if (!focused?.state) break;
    currentState = focused.state;
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

const getDetectedTab = (
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

const TopIconWithLabel = React.memo(
  ({
    active,
    onPress,
    Icon,
    label,
    activeColor,
    activeTint,
    inactiveTint,
  }: {
    active: boolean;
    onPress: () => void;
    Icon: SvgIcon;
    label: string;
    activeColor: string;
    activeTint?: string;
    inactiveTint: string;
  }) => {
    const tint = active ? activeTint ?? "#FFFFFF" : inactiveTint;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.topTabCard,
          active ? { backgroundColor: activeColor, borderColor: "transparent" } : null,
        ]}
      >
        <Icon width={28} height={28} fill={tint} stroke={tint} color={tint} />
        <Text style={[styles.topTabLabel, { color: tint }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
);

const HealthTopCard = React.memo(
  ({
    active,
    Icon,
    label,
    onPress,
  }: {
    active: boolean;
    Icon: SvgIcon;
    label: string;
    onPress: () => void;
  }) => {
    const tint = active ? "#0C7A43" : "#64748B";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.healthTopTabCard,
          active ? styles.healthTopTabCardActive : styles.healthTopTabCardInactive,
        ]}
      >
        <Icon width={28} height={28} fill={tint} stroke={tint} color={tint} />
        <Text style={[styles.healthTopTabLabel, active && styles.healthTopTabLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);

export default function Navbar({
  activeModule,
  onModuleChange,
  topTabsVariant = "default",
}: NavbarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const navigationState = useNavigationState((state) => state);
  const { isAuthenticated } = useAuth();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { deepestRoute, activeModuleTab } = React.useMemo(
    () => ({
      deepestRoute: getDeepestFocusedRoute(navigationState as unknown as NavStateLike),
      activeModuleTab: getActiveModuleFromState(navigationState as unknown as NavStateLike),
    }),
    [navigationState]
  );

  const routeModuleName = route?.params?.moduleName;
  const moduleName = routeModuleName ?? deepestRoute.moduleName;
  const detectedActiveTab = React.useMemo(
    () => getDetectedTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [activeModuleTab, deepestRoute.routeName, moduleName, route.name]
  );
  const activeTab = activeModule ?? detectedActiveTab;
  const bgSource = BG_MAP[activeTab];
  const showLocation = topTabsVariant !== "health" && activeTab === "Product";
  const activeThemeColor = TAB_THEME[activeTab]?.bgColor ?? TAB_THEME.Product.bgColor;

  const [prevBgSource, setPrevBgSource] = React.useState(bgSource);
  const bgFade = React.useRef(new Animated.Value(1)).current;
  const isNavigatingRef = React.useRef(false);

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
  }, [bgFade, bgSource, prevBgSource]);

  const [displayName, setDisplayName] = React.useState("User");
  const [displayAddress, setDisplayAddress] = React.useState(EMPTY_ADDRESS_LABEL);
  const [rewardPoints, setRewardPoints] = React.useState(
    () => navbarUserCache?.rewardPoints ?? 0
  );

  const rewardPointsLabel = React.useMemo(() => {
    const points = Number(rewardPoints || 0);
    if (points >= 100000) return `${Math.floor(points / 1000)}k`;
    if (points >= 10000) return `${(points / 1000).toFixed(1)}k`;
    return points.toLocaleString("en-IN");
  }, [rewardPoints]);

  const hasAddress = String(displayAddress || "").trim() !== EMPTY_ADDRESS_LABEL;

  const applyUserSnapshot = React.useCallback((snapshot: NavbarUserSnapshot) => {
    setDisplayName(snapshot.displayName);
    setDisplayAddress((prev) => {
      if (prev !== EMPTY_ADDRESS_LABEL && snapshot.displayAddress === EMPTY_ADDRESS_LABEL) {
        return prev;
      }
      return snapshot.displayAddress;
    });
    setRewardPoints(snapshot.rewardPoints);
  }, []);

  const navigateToScreen = React.useCallback(
    (screen: keyof RootStackParamList | string, params?: any) => {
      handleNavigateWithPrefetch({
        navigate: () => {
          try {
            if (params) {
              (navigation as any).navigate(screen, params);
            } else {
              (navigation as any).navigate(screen);
            }
          } catch (error) {
            console.warn(`Navigation to ${screen} failed:`, error);
            const parentNav = (navigation as any).getParent?.();
            if (!parentNav) return;

            try {
              if (params) {
                parentNav.navigate?.(screen, params);
              } else {
                parentNav.navigate?.(screen);
              }
            } catch (parentError) {
              console.error(`Parent navigation to ${screen} also failed:`, parentError);
            }
          }
        },
      });
    },
    [navigation]
  );

  const handleDefaultTabPress = React.useCallback(
    (tab: TopTab) => {
      if (tab === activeTab || isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (onModuleChange) {
        onModuleChange(tab);
      } else {
        (navigation as any).navigate("Home", {
          screen: MODULE_SCREEN_BY_TAB[tab],
          params: { moduleName: tab },
        });
      }

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation, onModuleChange]
  );

  const handleHealthTabPress = React.useCallback(
    (entryId: HealthEntry["id"]) => {
      if (entryId === "health") {
        if (deepestRoute.routeName !== "Home") {
          (navigation as any).navigate("Home");
        }
        return;
      }

      if (entryId === "dineout") {
        onModuleChange?.("DineOut");
        return;
      }

      if (entryId === "games" || entryId === "community") {
        navigateToScreen("ExploreModule");
      }
    },
    [deepestRoute.routeName, navigateToScreen, navigation, onModuleChange]
  );

  const navigateToAddAddress = React.useCallback(() => {
    navigateToScreen("AddressSelect", { manageOnly: true });
  }, [navigateToScreen]);

  const loadNavbarUser = React.useCallback(async () => {
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
    if (navbarUserCache && now - navbarUserCache.ts < NAVBAR_USER_TTL_MS) {
      applyUserSnapshot(navbarUserCache);
      return;
    }

    if (navbarUserInFlight) {
      applyUserSnapshot(await navbarUserInFlight);
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

        const addressRes = await fetchAllAddress();
        const addresses: ApiAddress[] = Array.isArray(addressRes?.data) ? addressRes.data : [];
        const selectedAddress =
          addresses.find((item) => Number(item?.is_default) === 1) || addresses[0];
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
          displayAddress: addressText || EMPTY_ADDRESS_LABEL,
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
        };
      } finally {
        navbarUserInFlight = null;
      }
    })();

    applyUserSnapshot(await navbarUserInFlight);
  }, [applyUserSnapshot, isAuthenticated]);

  React.useEffect(() => {
    loadNavbarUser();
  }, [loadNavbarUser]);

  if (topTabsVariant === "health") {
    return (
      <View style={[styles.wrapper, styles.healthWrapper, { paddingTop: insets.top + 8 }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.healthBackground} />

        <View style={styles.healthTopTabsRow}>
          {HEALTH_EXPERIENCE_TABS.map((entry) => (
            <HealthTopCard
              key={entry.id}
              active={entry.id === "health"}
              Icon={entry.Icon}
              label={entry.label}
              onPress={() => handleHealthTabPress(entry.id)}
            />
          ))}
        </View>

        <View style={styles.healthProfileRow}>
          <View style={styles.healthIdentityWrap}>
            <Text style={styles.healthHelloText}>Hello, {displayName}</Text>
            <Text style={styles.healthSubText}>Health benefits and care in one place</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.healthWalletShell}
            onPress={() => navigateToScreen("WalletHistory")}
          >
            <WalletSvg width={24} height={24} />
            <View style={styles.healthWalletMiniTag}>
              <Reward width={10} height={10} />
              <Text style={styles.healthWalletMiniText}>{rewardPointsLabel}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.healthBellCircle}
            activeOpacity={0.85}
            onPress={() => navigateToScreen("Notification")}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#0F172A" />
            <View style={styles.healthBadgeDot} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.bgWrapper} pointerEvents="none">
        <Image
          source={prevBgSource}
          style={[styles.absoluteFill, { top: -insets.top }]}
          resizeMode="cover"
        />
        {bgSource !== prevBgSource ? (
          <Animated.Image
            source={bgSource}
            style={[styles.absoluteFill, { top: -insets.top, opacity: bgFade }]}
            resizeMode="cover"
          />
        ) : null}
      </View>

      <View style={styles.topIconsRow}>
        <TopIconWithLabel
          active={activeTab === "Product"}
          onPress={() => handleDefaultTabPress("Product")}
          Icon={HomeNav as unknown as SvgIcon}
          label="Product"
          activeColor={TAB_THEME.Product.bgColor}
          inactiveTint={TAB_THEME.Product.inactiveTint}
        />
        <TopIconWithLabel
          active={activeTab === "Services"}
          onPress={() => handleDefaultTabPress("Services")}
          Icon={ServicesIcon as unknown as SvgIcon}
          label="Services"
          activeColor={TAB_THEME.Services.bgColor}
          inactiveTint={TAB_THEME.Services.inactiveTint}
        />
        <TopIconWithLabel
          active={activeTab === "Payments"}
          onPress={() => handleDefaultTabPress("Payments")}
          Icon={PaymentsIcon as unknown as SvgIcon}
          label="Payments"
          activeColor={TAB_THEME.Payments.bgColor}
          activeTint={TAB_THEME.Payments.activeTint}
          inactiveTint={TAB_THEME.Payments.inactiveTint}
        />
        <TopIconWithLabel
          active={activeTab === "DineOut"}
          onPress={() => handleDefaultTabPress("DineOut")}
          Icon={DineOutIcon as unknown as SvgIcon}
          label="Dine Out"
          activeColor={TAB_THEME.DineOut.bgColor}
          activeTint={TAB_THEME.DineOut.activeTint}
          inactiveTint={TAB_THEME.DineOut.inactiveTint}
        />
      </View>

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
          <Text style={styles.fakePlaceholder}>Search Reward Planners</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.walletBox}
          onPress={() => navigateToScreen("WalletHistory")}
        >
          <WalletSvg width={26} height={26} />
          <View style={[styles.walletTag, { backgroundColor: activeThemeColor }]}>
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
    </View>
  );
}

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
    overflow: "hidden",
  },
  healthBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B63CE",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  topTabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  healthTopTabCard: {
    width: 82,
    height: 70,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    ...shadow,
  },
  healthTopTabCardActive: {
    backgroundColor: "#DDFEE2",
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
    color: "#0C7A43",
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
  },
  locationRowHidden: {
    opacity: 0,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    flexShrink: 1,
  },
  homeBold: {
    fontWeight: "900",
    color: "#111827",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
    borderColor: "#FFFFFF",
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
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 10,
    lineHeight: 12,
    maxWidth: 34,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  badgeDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  addAddressLink: {
    color: "#2563EB",
    textDecorationLine: "underline",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
  },
  healthProfileRow: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthIdentityWrap: {
    flex: 1,
    marginRight: 12,
  },
  healthHelloText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  healthSubText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
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
    marginRight: 10,
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
    backgroundColor: "#0B63CE",
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
    borderColor: "#FFFFFF",
  },
});
