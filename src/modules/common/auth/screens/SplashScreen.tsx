import React, { useEffect } from "react";
import { View, Image, StatusBar, StyleSheet, useWindowDimensions } from "react-native";
import logo from "../../../../assets/menu/logo.png";
import logoword from "../../../../assets/menu/logo word.png";
import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";


function SplashScreen() {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, height * 0.32, 240);
  const wordWidth = Math.min(width * 0.76, 340);

  // Warm existing product caches; RootNavigator owns startup readiness.
  useEffect(() => {
    Promise.allSettled([
      fetchBestSellers(), fetchTopRatedProducts(),
      fetchMostViewedProducts(), fetchAllCategories(),
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1F9" />
      <View style={styles.content}>
        <View style={[styles.logo, { width: logoSize, height: logoSize }]}>
          <Image source={logo} style={{ width: logoSize, height: logoSize }} resizeMode="contain" accessible={false} />
        </View>
        <Image source={logoword} style={{ width: wordWidth, height: wordWidth * 718 / 2191 }} resizeMode="contain" accessible accessibilityLabel="Reward Planners" />
      </View>
    </View>
  );
}
export default React.memo(SplashScreen);
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F1F9", alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", justifyContent: "center" },
  logo: { marginBottom: 24, alignItems: "center", justifyContent: "center" },
});
