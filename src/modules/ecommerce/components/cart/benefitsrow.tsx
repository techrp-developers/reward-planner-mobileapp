import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function BenefitsRow() {
  return (
    <View style={styles.benefitsRow}>
      <View style={styles.benefitItem}>
        <MaterialCommunityIcons name="package-variant" size={26} color="#F59E0B" />
        <Text style={styles.benefitText}>10 Day Return</Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons name="leaf" size={26} color="#22C55E" />
        <Text style={styles.benefitText}>Sustainable</Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons name="flash" size={26} color="#F97316" />
        <Text style={styles.benefitText}>Fast Delivery</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  benefitsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  benefitItem: {
    width: "33.33%",
    alignItems: "center",
    gap: 6,
  },

  benefitText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
  },
});
