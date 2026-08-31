import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NavbarBannerMap } from "./api/NavbarContentApi";
import { TAB_THEME, TopTab } from "./navbarConstants";

type Props = {
  activeTab: TopTab;
  banners: NavbarBannerMap;
  insetsTop: number;
  isDark: boolean;
};

const NAVBAR_BACKGROUND_HEIGHT = 260;

export default function Navbar_Background({
  activeTab,
  banners,
  insetsTop,
  isDark,
}: Props) {
  const { width } = useWindowDimensions();
  const [previousTab, setPreviousTab] = React.useState<TopTab>(activeTab);
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});
  const fade = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (previousTab === activeTab) return;

    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPreviousTab(activeTab);
        fade.setValue(1);
      }
    });
  }, [activeTab, fade, previousTab]);

  const currentBanner = banners[activeTab];
  const previousBanner = banners[previousTab];

  const renderLayer = (tab: TopTab, opacity?: Animated.Value | number) => {
    const banner = banners[tab];
    const imageUrl = banner?.imageUrl;
    const showImage = Boolean(imageUrl && !failedImages[imageUrl]);
    const bgColor = banner?.bgColor ?? TAB_THEME[tab]?.bgColor ?? TAB_THEME.Product.bgColor;

    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        {showImage ? (
          <Image
            source={{ uri: imageUrl as string }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => {
              if (__DEV__) {
                console.log("[CMS] Navbar image failed:", imageUrl);
              }
              setFailedImages((prev) => ({
                ...prev,
                [imageUrl as string]: true,
              }));
            }}
          />
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        {
          width,
          height: NAVBAR_BACKGROUND_HEIGHT + insetsTop,
          backgroundColor:
            currentBanner?.bgColor ??
            previousBanner?.bgColor ??
            TAB_THEME[activeTab]?.bgColor,
        },
      ]}
    >
      {previousTab !== activeTab ? renderLayer(previousTab, 1) : null}
      {renderLayer(activeTab, previousTab === activeTab ? 1 : fade)}

      <LinearGradient
        colors={
          isDark
            ? ["rgba(0,0,0,0.12)", "rgba(0,0,0,0.58)"]
            : ["rgba(0,0,0,0.04)", "rgba(0,0,0,0.35)"]
        }
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
});
