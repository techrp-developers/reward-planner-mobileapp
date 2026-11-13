import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import OrderHeading from "../constants/heading/OrderHeading";
import { fetchItemReturnDetails, ItemReturnDetails } from "../api/OrderApi";
import { HomeStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteProps = RouteProp<HomeStackParamList, "ItemReturnDetails">;

const STATUS_STYLES: Record<string, { label: string; color: string; icon: string; message: string }> = {
  pending: {
    label: "Under Review",
    color: "#D97706",
    icon: "clock-outline",
    message: "The seller is reviewing your request.",
  },
  approved: {
    label: "Approved",
    color: "#16A34A",
    icon: "check-circle-outline",
    message: "Your request was approved. We'll arrange the pickup.",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    icon: "close-circle-outline",
    message: "Your request was not approved.",
  },
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function ItemReturnDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { isDark, theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ItemReturnDetails["data"] | null>(null);

  const orderItemId = route.params?.orderItemId;

  useEffect(() => {
    const load = async () => {
      if (!orderItemId) {
        setError("Order item not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await fetchItemReturnDetails(orderItemId);
      if (response?.success && response.data) {
        setData(response.data);
      } else {
        setError("Unable to load request details.");
      }

      setLoading(false);
    };

    load();
  }, [orderItemId]);

  const openVideo = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open video", "Please try again later.");
    }
  };

  const typeLabel = data?.request_type === "replacement" ? "Replacement" : "Return";
  const title = `${typeLabel} Status`;

  if (loading || error || !data) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <OrderHeading title="Request Status" onBackPress={() => navigation.goBack()} isDark={isDark} />
        <View style={styles.centeredState}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.stateText, { color: theme.secondaryText }]}>Loading request details...</Text>
            </>
          ) : (
            <Text style={styles.errorText}>{error || "Unable to load request details."}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_STYLES[data.status] || {
    label: data.status,
    color: theme.secondaryText,
    icon: "information-outline",
    message: "",
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <OrderHeading title={title} onBackPress={() => navigation.goBack()} isDark={isDark} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
            {data.product_name}
          </Text>
          <Text style={[styles.meta, { color: theme.secondaryText }]}>
            Qty: {data.quantity}  •  Order {data.order_ref || data.order_id}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name={status.icon} size={24} color={status.color} />
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {typeLabel} {status.label}
            </Text>
          </View>
          {status.message ? (
            <Text style={[styles.body, { color: theme.secondaryText }]}>{status.message}</Text>
          ) : null}
          {data.vendor_note ? (
            <View style={[styles.noteBox, { backgroundColor: isDark ? "#111827" : "#F9FAFB", borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>Seller note</Text>
              <Text style={[styles.body, { color: theme.text }]}>{data.vendor_note}</Text>
            </View>
          ) : null}
          <Text style={[styles.meta, { color: theme.secondaryText }]}>
            Requested on {formatDisplayDate(data.created_at)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Your reason</Text>
          <Text style={[styles.body, { color: theme.text }]}>{data.reason}</Text>

          {data.video_url ? (
            <TouchableOpacity
              style={[styles.videoButton, { borderColor: theme.primary }]}
              activeOpacity={0.8}
              onPress={() => openVideo(data.video_url as string)}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={20} color={theme.primary} />
              <Text style={[styles.videoText, { color: theme.primary }]}>View uploaded video</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  noteBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  videoButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  videoText: {
    fontSize: 13,
    fontWeight: "700",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
});
