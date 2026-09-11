import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RewardPlannersLogo from "../../../../assets/homepage/RewardPlannersLogo.png";
import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";

const MIN_SPLASH_MS = 1800;

function SplashScreenComponent() {
  const isMounted = useRef(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 70,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const prepareApp = async () => {
      const minDelay = new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_SPLASH_MS),
      );

      const fetchAll = Promise.all([
        fetchBestSellers().catch(() => null),
        fetchTopRatedProducts().catch(() => null),
        fetchMostViewedProducts().catch(() => null),
        fetchAllCategories().catch(() => null),
      ]);

      await Promise.all([fetchAll, minDelay]);

      if (!isMounted.current) return;
    };

    prepareApp().catch((error) => {
      if (isMounted.current) {
        console.warn("SplashScreen prepareApp error:", error);
      }
    });

    return () => {
      isMounted.current = false;
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
    };
  }, [logoOpacity, logoScale]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Image source={RewardPlannersLogo} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Text style={styles.label}>Reward Planners</Text>
    </View>
  );
}

const SplashScreen = React.memo(SplashScreenComponent);
export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logoWrap: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 170,
    height: 170,
  },
  label: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "rgba(236, 72, 153, 0.42)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
