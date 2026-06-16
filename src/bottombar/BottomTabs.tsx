import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../modules/ecommerce/context/CartContext";

import ProfileIcon from "../assets/menu/profile.svg";
import HomeIcon from "../assets/menu/Home.svg";
import CenterIcon from "../assets/menu/Menu_Home.svg";
import dashbord_menu from "../assets/menu/dashbord_home.png";
import CartIcon from "../assets/menu/Cart.svg";
import ExploreIcon from "../assets/menu/Explore.svg";
import SearchIcon from "../assets/menu/Search.svg";

export const TAB_BAR_HEIGHT = 68;

type AppMode = "Product" | "Services" | "Payments" | "DineOut";

export type TabKey = "Home" | "Explore" | "Cart" | "Profile" | "Search";

type Props = {
  activeMode?: AppMode;
  onTabPress?: (tab: TabKey) => void;
  cartCount?: number;
  isDashboard?: boolean;
  activeTabKey?: TabKey;
  // Navigation for the center button is delegated to the parent so BottomTabs
  // works correctly in both the MainLayout context (Dashboard) and the
  // MainTabs/HomeStack context, which have different navigation scopes.
  onCenterPress?: () => void;
};

type TabConfig = {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ width: number; height: number; color?: string }>;
};

type TabItemProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ width: number; height: number; color?: string }>;
  badgeCount?: number;
};

// Defined outside render — stable reference, no allocation per press.
const HIT_SLOP = { top: 10, bottom: 10, left: 6, right: 6 } as const;
const NOOP = () => {};

const TabItem = React.memo(({ label, active, onPress, Icon, badgeCount }: TabItemProps) => {
  const iconColor = active ? "#111827" : "#8B8B8B";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.item}
      hitSlop={HIT_SLOP}
    >
      <View>
        <Icon width={24} height={24} color={iconColor} />
        {(badgeCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
});

TabItem.displayName = "TabItem";

const CenterButton = React.memo(function CenterButton({
  isDashboard,
  onPress,
}: {
  isDashboard: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.fabWrap}
      hitSlop={HIT_SLOP}
    >
      <View style={styles.diamond}>
        {isDashboard ? (
          <Image source={dashbord_menu} style={{ width: 90, height: 90 }} resizeMode="contain" />
        ) : (
          <CenterIcon width={90} height={90} />
        )}
      </View>
    </TouchableOpacity>
  );
});

CenterButton.displayName = "CenterButton";

function BottomTabs({
  activeMode = "Product",
  onTabPress,
  isDashboard = false,
  activeTabKey,
  onCenterPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const { totalQuantity: cartCount } = useCart();
  const bottomInset = Math.max(insets.bottom, 8);

  // Ref guards the early-return check so handlePress never needs activeTab as a dep.
  // Without this, every tab press invalidates handlePress → pressHandlers → all TabItem memos.
  const activeTabRef = useRef<TabKey>("Home");
  const [activeTab, setActiveTab] = useState<TabKey>("Home");

  const handlePress = useCallback(
    (tab: TabKey) => {
      if (tab === activeTabRef.current) return;
      activeTabRef.current = tab;
      setActiveTab(tab);
      onTabPress?.(tab);
    },
    [onTabPress], // no activeTab dep — ref handles the guard
  );

  const isProductMode = activeMode === "Product";

  // cartCount intentionally excluded — injected at render time per tab.key so
  // a badge update only re-renders the Cart TabItem, not the full tabs array.
  const tabs = useMemo<TabConfig[]>(
    () => [
      { key: "Home", label: "Home", Icon: HomeIcon },
      {
        key: isProductMode ? "Explore" : "Search",
        label: isProductMode ? "Explore" : "Search",
        Icon: isProductMode ? ExploreIcon : SearchIcon,
      },
      { key: "Cart", label: "Cart", Icon: CartIcon },
      { key: "Profile", label: "Profile", Icon: ProfileIcon },
    ],
    [isProductMode],
  );

  // One stable handler per key — rebuilt only when handlePress (i.e. onTabPress) changes,
  // not on every tab press. Passing these as onPress keeps TabItem React.memo effective.
  const pressHandlers = useMemo<Record<TabKey, () => void>>(
    () => ({
      Home: () => handlePress("Home"),
      Explore: () => handlePress("Explore"),
      Search: () => handlePress("Search"),
      Cart: () => handlePress("Cart"),
      Profile: () => handlePress("Profile"),
    }),
    [handlePress],
  );

  // Keep local active tab state in sync with navigation-driven activeTabKey from parent.
  React.useEffect(() => {
    if (activeTabKey && activeTabKey !== activeTabRef.current) {
      activeTabRef.current = activeTabKey;
      setActiveTab(activeTabKey);
    }
  }, [activeTabKey]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bar,
          { height: TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset },
        ]}
      >
        {/* LEFT SIDE */}
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={pressHandlers[tab.key]}
            Icon={tab.Icon}
          />
        ))}

        <View style={styles.centerSpacer} />

        {/* RIGHT SIDE */}
        {tabs.slice(2).map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={pressHandlers[tab.key]}
            Icon={tab.Icon}
            badgeCount={tab.key === "Cart" ? cartCount : undefined}
          />
        ))}

        {/* CENTER BUTTON — onCenterPress is supplied by the parent so this
            component stays navigation-agnostic and works in both MainLayout
            and MainTabs (HomeStack) contexts without needing useNavigation. */}
        <CenterButton
          isDashboard={Boolean(isDashboard)}
          onPress={onCenterPress ?? NOOP}
        />
      </View>
    </View>
  );
}

export default React.memo(BottomTabs);

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: "#8B8B8B",
    fontWeight: "500",
  },
  labelActive: {
    color: "#111827",
    fontWeight: "700",
  },
  centerSpacer: {
    width: 60,
  },
  fabWrap: {
    position: "absolute",
    alignSelf: "center",
    top: -25,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  diamond: {
    width: 95,
    height: 95,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
