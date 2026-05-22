import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import OrderHeading from "../../constants/heading/OrderHeading";
import { HomeStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const notifications = [
  // {
  //   id: 1,
  //   title: "Order Confirmed",
  //   message: "Your order #65327VH has been confirmed successfully.",
  //   time: "2m ago",
  //   icon: "check-decagram",
  //   unread: true,
  // },
  // {
  //   id: 2,
  //   title: "Out for Delivery",
  //   message: "Your order is out for delivery and will reach today.",
  //   time: "1h ago",
  //   icon: "truck-delivery",
  //   unread: true,
  // },
  // {
  //   id: 3,
  //   title: "Offer Applied",
  //   message: "Coupon RPCC200 is applied on your latest order.",
  //   time: "Yesterday",
  //   icon: "ticket-percent",
  //   unread: false,
  // },
];

function Notification() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <OrderHeading
        title="Notifications"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="bell-badge" size={20} color="#6D5AE6" />
          <Text style={styles.summaryText}>No New Notification</Text>
        </View>

        {notifications.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.85} style={styles.card}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={item.icon} size={20} color="#6D5AE6" />
            </View>

            <View style={styles.contentWrap}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
            </View>

            {item.unread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}

        {notifications.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="bell-outline" size={34} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default Notification;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F8FC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9E6F7",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF0",
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F2EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  contentWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  message: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#6D5AE6",
    marginLeft: 8,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
});