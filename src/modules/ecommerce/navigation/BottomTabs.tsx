import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileIcon from "../../../assets/menu/profile.svg";
import HomeIcon from "../../../assets/menu/Home.svg";
import CenterIcon from "../../../assets/menu/Menu_Home.svg";
import CartIcon from "../../../assets/menu/Cart.svg";
import ExploreIcon from "../../../assets/menu/Explore.svg";
import SearchIcon from "../../../assets/menu/Search.svg";

export const TAB_BAR_HEIGHT = 68;

type AppMode = "Product" | "Services" | "Payments" | "DineOut";

type TabKey =
  | "Home"
  | "Explore"
  | "Cart"
  | "Profile"
  | "Search";

type Props = {
  activeMode?: AppMode;
  onTabPress?: (tab: TabKey) => void;
  cartCount?: number;
};

function BottomTabs({
  activeMode = "Product",
  onTabPress,
  cartCount = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  const [activeTab, setActiveTab] = useState<TabKey>("Home");

  // ✅ SINGLE HANDLER (optimized)
  const handlePress = useCallback(
    (tab: TabKey) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      onTabPress?.(tab);
    },
    [activeTab, onTabPress]
  );

  const isProductMode = activeMode === "Product";

  // ✅ TAB CONFIG (clean + scalable)
  const tabs = useMemo(() => {
    return [
      {
        key: "Home",
        label: "Home",
        Icon: HomeIcon,
      },
      {
        key: isProductMode ? "Explore" : "Search",
        label: isProductMode ? "Explore" : "Search",
        Icon: isProductMode ? ExploreIcon : SearchIcon,
      },
      {
        key: "Cart",
        label: "Cart",
        Icon: CartIcon,
        badge: cartCount,
      },
      {
        key: "Profile",
        label: "Profile",
        Icon: ProfileIcon,
      },
    ];
  }, [isProductMode, cartCount]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.bar,
          {
            height: TAB_BAR_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* LEFT SIDE */}
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={() => handlePress(tab.key as TabKey)}
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
            onPress={() => handlePress(tab.key as TabKey)}
            Icon={tab.Icon}
            badgeCount={tab.badge}
          />
        ))}

        {/* CENTER BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handlePress("Home")}
          style={styles.fabWrap}
        >
          <View style={styles.diamond}>
            <CenterIcon width={90} height={90} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ✅ PURE COMPONENT (NO RE-RENDER UNLESS PROPS CHANGE)
const TabItem = React.memo(
  ({ label, active, onPress, Icon, badgeCount }: any) => {
    const iconColor = active ? "#111827" : "#8B8B8B";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.item}
      >
        <View>
          <Icon width={24} height={24} color={iconColor} />
          {badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, active && styles.labelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);

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
