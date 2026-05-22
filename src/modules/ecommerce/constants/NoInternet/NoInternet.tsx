import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import StatusBG from "../../../../assets/homepage/NoInternetBG.svg";
import StatusIcon from "../../../../assets/homepage/NoInternetStatus.svg";

const { width, height } = Dimensions.get("window");

export default function NoInternetScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      
      {/* Background SVG */}
      <View style={styles.bgWrap}>
        <StatusBG width={width} height={height * 0.35} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <StatusIcon width={120} height={120} style={styles.icon} />

        <Text style={styles.title}>No Internet Connection</Text>

        <Text style={styles.subtitle}>
          Wi-Fi on a space adventure 🚀
        </Text>
        <Text style={styles.subtitle}>
          Rewards safe at mission control ✨
        </Text>
        <Text style={styles.subtitle}>
          We’ll catch up when you’re online!
        </Text>

        <LinearGradient
          colors={["#8665FF", "#5B47A3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Return Home</Text>
        </LinearGradient>
      </View>

    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  bgWrap: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: height * 0.1,
  },

  icon: {
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7E69FF",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  button: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
