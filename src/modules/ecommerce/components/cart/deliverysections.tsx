import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchAllAddress } from "../../api/AddressApi";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuth } from "../../../common/auth/context/AuthContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type AddressItem = {
  address_id?: number;
  is_default?: number | boolean;
  contact_name?: string;
  contact_phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

const getDeliveryDateText = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);

  const day = date.toLocaleDateString("en-IN", { day: "numeric" });
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  const year = date.toLocaleDateString("en-IN", { year: "numeric" });

  return `Delivery by ${day} ${month}, ${year}`;
};

export default function DeliverySection() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState("User");
  const [displayAddress, setDisplayAddress] = useState("Address not set");

  const loadAddress = useCallback(async () => {
    if (!isAuthenticated) {
      setDisplayName("Guest");
      setDisplayAddress("Address not set");
      return;
    }

    try {
      const res = await fetchAllAddress();
      const addresses: AddressItem[] = Array.isArray(res?.data) ? res.data : [];

      const selectedAddress =
        addresses.find((item) => Number(item?.is_default) === 1) || addresses[0];

      if (!selectedAddress) {
        setDisplayName("User");
        setDisplayAddress("Address not set");
        return;
      }

      const addressText = [
        selectedAddress.address1,
        selectedAddress.address2,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.zipcode,
      ]
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(", ");

      setDisplayName(selectedAddress.contact_name || "User");
      setDisplayAddress(addressText || "Address not set");
    } catch (error) {
      console.log("Failed to load delivery address", error);
      setDisplayName("User");
      setDisplayAddress("Address not set");
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadAddress();
    }, [loadAddress])
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>

      <View style={styles.deliveryCard}>
        {/* Row 1 */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.deliveryRowCard}
          onPress={() => navigation.navigate("AddressSelect")}
        >
          <View style={styles.deliveryIconBox}>
            <MaterialCommunityIcons name="home-outline" size={20} color="#E11D48" />
          </View>

          <View style={styles.deliveryMid}>
            <Text style={styles.deliveryBold}>Delivering to {displayName}</Text>
            <Text style={styles.deliverySub} numberOfLines={1}>
              {displayAddress}
            </Text>
          </View>

          <MaterialIcons name="chevron-right" size={22} color="#777" />
        </TouchableOpacity>

        {/* Row 2 */}
        <View style={styles.deliveryRowCard2}>
          <View style={styles.deliveryIconBox}>
            <MaterialCommunityIcons name="truck-outline" size={20} color="#555" />
          </View>

          <Text style={styles.deliveryBold}>{getDeliveryDateText()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    marginTop: 6,
  },

  sectionTitle: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  deliveryCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FFFFFF",
    padding: 10,
    gap: 10,
  },

  deliveryRowCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FFFBF5",
  },

  deliveryRowCard2: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FFFFFF",
  },

  deliveryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  deliveryMid: { flex: 1 },

  deliveryBold: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111",
  },

  deliverySub: {
    marginTop: 2,
    fontSize: 11,
    color: "#666",
  },
});
