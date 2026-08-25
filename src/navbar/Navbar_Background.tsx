import React from "react";
import { Animated, Image as RNImage, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import { TOP_TABS, TopTab } from "./navbarConstants";
import type { NavbarBannerMap } from "./hooks/useNavbarBanners";

export type NavbarBackgroundProps = {
  activeTab: TopTab;
  banners: NavbarBannerMap;
  insetsTop: number;
  isDark?: boolean;
};

const HEADER_HEIGHT = 280;
const GRADIENT_HEIGHT = 110;

function Navbar_Background({ activeTab, banners, insetsTop, isDark }: NavbarBackgroundProps) {
  // One cross-fade opacity per tab, owned here so switching tabs never remounts
  // the Image (a remount could briefly show the previous banner underneath).
  const backgroundOpacities = React.useRef<Record<TopTab, Animated.Value>>({
    Product: new Animated.Value(activeTab === "Product" ? 1 : 0),
    Services: new Animated.Value(activeTab === "Services" ? 1 : 0),
    Payments: new Animated.Value(activeTab === "Payments" ? 1 : 0),
    DineOut: new Animated.Value(activeTab === "DineOut" ? 1 : 0),
  }).current;

  // Tracks remote images that failed to load so we can silently fall back to
  // the CMS/theme background color for that tab instead of showing a broken image.
  const [failedRemote, setFailedRemote] = React.useState<Record<TopTab, boolean>>({
    Product: false,
    Services: false,
    Payments: false,
    DineOut: false,
  });

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

  // Reset a tab's failure flag if its campaign image URL changes (e.g. a new
  // campaign is pushed after the previous one had failed to load).
  const prevUrlsRef = React.useRef<Record<TopTab, string | null>>({
    Product: banners.Product.imageUrl,
    Services: banners.Services.imageUrl,
    Payments: banners.Payments.imageUrl,
    DineOut: banners.DineOut.imageUrl,
  });
  React.useEffect(() => {
    TOP_TABS.forEach((tab) => {
      if (prevUrlsRef.current[tab] !== banners[tab].imageUrl) {
        prevUrlsRef.current[tab] = banners[tab].imageUrl;
        setFailedRemote((prev) => (prev[tab] ? { ...prev, [tab]: false } : prev));
      }
    });
  }, [banners]);

  const markRemoteFailed = React.useCallback((tab: TopTab) => {
    setFailedRemote((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  }, []);

  const activeBgColor = banners[activeTab]?.bgColor ?? "#5F341A";
  const gradientColors: string[] = isDark
    ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]
    : ["rgba(0,0,0,0)", "rgba(0,0,0,0.25)"];

  return (
    <View style={[styles.bgWrapper, { backgroundColor: activeBgColor }]} pointerEvents="none">
      {TOP_TABS.map((tab) => {
        const theme = banners[tab];
        const remoteUrl = !failedRemote[tab] ? theme.imageUrl : null;

        return (
          <Animated.View
            key={tab}
            style={[styles.absoluteFill, { top: -insetsTop, opacity: backgroundOpacities[tab] }]}
          >
            {/* Solid fallback color shows through until the image (remote or
                local) has painted, so slow networks never flash white. */}
            <View style={[styles.absoluteFill, { backgroundColor: theme.bgColor }]} />

            {remoteUrl ? (
              <RNImage
                source={{ uri: remoteUrl }}
                style={styles.absoluteFill}
                resizeMode="cover"
                fadeDuration={200}
                onLoad={() => {
                  console.log("[CMS] Navbar image loaded:", {
                    tab,
                    url: remoteUrl,
                  });
                }}
                onError={(event) => {
                  console.warn("[CMS] Navbar image FAILED:", {
                    tab,
                    url: remoteUrl,
                    error: event.nativeEvent,
                  });

                  markRemoteFailed(tab);
                }}
              />
            ) : null}
          </Animated.View>
        );
      })}

      {/* Bottom scrim keeps the search bar/location row legible over any
          campaign image, brightness-independent. */}
      <LinearGradient colors={gradientColors} style={styles.gradientOverlay} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
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

  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: GRADIENT_HEIGHT,
  },
});

export default React.memo(Navbar_Background);
