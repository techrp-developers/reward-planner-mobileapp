import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import logo from "../../../../assets/menu/logo.png";
import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";

// Minimum time the splash stays visible (ms).
// Keeps the animation from feeling like a flicker on fast networks.
const MIN_SPLASH_MS = 1200;

export default function SplashScreen({ navigation: _navigation }: any) {
  const isMounted = useRef(true);

  // ── Animation values ────────────────────────────────────────────────────────
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    // ── 1. Kick off logo animation immediately on mount ──────────────────────
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,   // snappy but not jarring
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // ── 2. Preload data ──────────────────────────────────────────────────────
    // Performance improvements vs original:
    //   • All fetches are already parallel (Promise.all) — kept.
    //   • Minimum display time runs CONCURRENTLY with fetches, not after them.
    //     On a fast network this saves up to 1500 ms.
    //   • isMounted ref prevents setState / navigation calls on unmounted
    //     component (avoids the "Can't perform a React state update on an
    //     unmounted component" warning).
    const prepareApp = async () => {
      const minDelay = new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_SPLASH_MS)
      );

      const fetchAll = Promise.all([
        fetchBestSellers().catch(() => null),
        fetchTopRatedProducts().catch(() => null),
        fetchMostViewedProducts().catch(() => null),
        fetchAllCategories().catch(() => null),
      ]);

      // Wait for BOTH: all data ready AND minimum display time elapsed.
      // Whichever finishes last unblocks navigation.
      await Promise.all([fetchAll, minDelay]);

      // Navigation happens automatically when AuthContext finishes initializing.
      // Guard against unmounted component (e.g. fast back navigation in dev).
      if (!isMounted.current) return;
    };

    prepareApp().catch((e) => {
      if (isMounted.current) console.warn("SplashScreen prepareApp error:", e);
    });

    return () => {
      isMounted.current = false;
    };
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image source={logo} style={styles.logoStyle} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E3",
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoStyle: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
});
