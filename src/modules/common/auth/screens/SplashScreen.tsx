import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import logo from "../../../../assets/menu/logo.png";
import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";

const MIN_SPLASH_MS = 2500;

export default function SplashScreen() {
  const isMounted = useRef(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const dotOne = useRef(new Animated.Value(0)).current;
  const dotTwo = useRef(new Animated.Value(0)).current;
  const dotThree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const introAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 58,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    const ringAnimation = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatA, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatA, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(floatB, {
            toValue: 1,
            duration: 3400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatB, {
            toValue: 0,
            duration: 3400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const createDotAnimation = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(360 - delay),
        ])
      );

    const dotAnimations = [
      createDotAnimation(dotOne, 0),
      createDotAnimation(dotTwo, 120),
      createDotAnimation(dotThree, 240),
    ];

    introAnimation.start();
    ringAnimation.start();
    shimmerAnimation.start();
    floatingAnimation.start();
    dotAnimations.forEach((animation) => animation.start());

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
      introAnimation.stop();
      ringAnimation.stop();
      shimmerAnimation.stop();
      floatingAnimation.stop();
      dotAnimations.forEach((animation) => animation.stop());
    };
  }, [
    dotOne,
    dotThree,
    dotTwo,
    floatA,
    floatB,
    logoOpacity,
    logoScale,
    ringRotate,
    shimmer,
  ]);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const floatATranslate = floatA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const floatBTranslate = floatB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 22],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  const dotTranslate = (value: Animated.Value) =>
    value.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    });

  return (
    <LinearGradient
      colors={["#FFF8E7", "#FFFFFF", "#EEF7FF"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeTop,
          { transform: [{ translateY: floatATranslate }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeBottom,
          { transform: [{ translateY: floatBTranslate }] },
        ]}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoStage,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View
            style={[styles.loadingRing, { transform: [{ rotate: spin }] }]}
          />
          <View style={styles.logoCard}>
            <Image source={logo} style={styles.logo} />
          </View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>Reward Planner</Text>
          <Text style={styles.subtitle}>Getting your rewards ready</Text>
        </View>

        <View style={styles.loader}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressShimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
          <View style={styles.dots}>
            {[dotOne, dotTwo, dotThree].map((dot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { transform: [{ translateY: dotTranslate(dot) }] },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  floatingShape: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  shapeTop: {
    top: 86,
    right: -44,
    width: 156,
    height: 156,
    backgroundColor: "#FFD166",
  },
  shapeBottom: {
    left: -58,
    bottom: 92,
    width: 190,
    height: 190,
    backgroundColor: "#2EC4B6",
  },
  logoStage: {
    width: 188,
    height: 188,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRing: {
    position: "absolute",
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 5,
    borderColor: "rgba(255, 184, 28, 0.18)",
    borderTopColor: "#FFB81C",
    borderRightColor: "#11A6A6",
  },
  logoCard: {
    width: 126,
    height: 126,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  logo: {
    width: 88,
    height: 88,
    resizeMode: "contain",
  },
  copy: {
    alignItems: "center",
    marginTop: 18,
  },
  title: {
    color: "#17213A",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#687083",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0,
    marginTop: 8,
  },
  loader: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
    marginTop: 34,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.1)",
  },
  progressShimmer: {
    width: 120,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#FFB81C",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 24,
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#11A6A6",
  },
});
