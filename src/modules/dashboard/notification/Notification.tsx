import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import OrderHeading from "../../ecommerce/constants/heading/OrderHeading";
import {
  deleteNotification,
  getNotificationBadge,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "./NotificationAPI";

type Nav = NativeStackNavigationProp<any>;

const ICON_MAP: Record<string, string> = {
  "shopping-bag": "shopping-outline",
  "map-pin": "map-marker-outline",
  support: "lifebuoy",
  wallet: "wallet-outline",
  target: "target",
  "x-circle": "close-circle-outline",
  clock: "clock-outline",
  briefcase: "briefcase-outline",
  "file-check": "file-check-outline",
};

function getIconName(icon?: string | null, module?: string) {
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  if (module === "ecommerce") return "shopping-outline";
  if (module === "service") return "briefcase-outline";
  if (module === "wallet") return "wallet-outline";
  if (module === "fitness") return "target";
  if (module === "bbps") return "receipt-text-outline";
  return "bell-outline";
}

function formatNotificationTime(value: string) {
  const normalized = value?.includes("T") ? value : value?.replace(" ", "T");
  const date = new Date(normalized);
  const time = date.getTime();

  if (!Number.isFinite(time)) return value;

  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 2 * day) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function isUnread(item: NotificationItem) {
  return item.is_read === false || Number(item.is_read) === 0;
}

function Notification() {
  const navigation = useNavigation<Nav>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [badgeCount, setBadgeCount] = useState(0);

  const loadNotifications = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [notificationsRes, badgeRes] = await Promise.all([
        getMyNotifications(),
        getNotificationBadge(),
      ]);
      const fetched = notificationsRes.success ? notificationsRes.data : [];

      setNotifications(fetched);
      setBadgeCount(
        badgeRes.success ? badgeRes.count : fetched.filter(isUnread).length
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
      setNotifications([]);
      setBadgeCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = (item: NotificationItem) => {
    const actionUrl = String(item.action_url || "").trim();
    const referenceId = String(item.reference_id || "").trim();

    if (isUnread(item)) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === item.notification_id
            ? { ...notification, is_read: 1 }
            : notification
        )
      );
      setBadgeCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(item.notification_id).catch(() => loadNotifications(true));
    }

    if (actionUrl === "/wallet") {
      navigation.navigate("WalletHistory");
      return;
    }

    const ecommerceOrderMatch = actionUrl.match(/\/orders\/order-details\/(\d+)/);
    if (ecommerceOrderMatch?.[1]) {
      navigation.navigate("OrderConfirmedScreen", {
        order_id: Number(ecommerceOrderMatch[1]),
      });
      return;
    }

    const serviceOrderMatch = actionUrl.match(/\/service-orders\/([^/]+)/);
    const serviceDocsMatch = actionUrl.match(
      /\/service-order-documents\/parent-documents\/([^/]+)/
    );
    const parentOrderId = serviceOrderMatch?.[1] || serviceDocsMatch?.[1];

    if (parentOrderId || item.reference_type === "service_order") {
      navigation.navigate("ServiceStack", {
        screen: "ServiceOrderDetail",
        params: { parent_order_id: parentOrderId || referenceId },
      });
      return;
    }

    if (actionUrl === "/fitness") {
      navigation.navigate("RewardStack");
    }
  };

  const handleMarkAllRead = async () => {
    if (badgeCount <= 0) return;

    const previousNotifications = notifications;
    const previousBadgeCount = badgeCount;

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, is_read: 1 }))
    );
    setBadgeCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      setNotifications(previousNotifications);
      setBadgeCount(previousBadgeCount);
    }
  };

  const handleDeleteNotification = (item: NotificationItem) => {
    Alert.alert(
      "Delete notification",
      "Remove this notification from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previousNotifications = notifications;
            const previousBadgeCount = badgeCount;

            setNotifications(prev =>
              prev.filter(
                notification =>
                  notification.notification_id !== item.notification_id
              )
            );
            if (isUnread(item)) setBadgeCount(prev => Math.max(0, prev - 1));

            try {
              await deleteNotification(item.notification_id);
            } catch {
              setNotifications(previousNotifications);
              setBadgeCount(previousBadgeCount);
            }
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const unread = isUnread(item);
    const highPriority = item.priority === "high";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, unread && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDeleteNotification(item)}
      >
        <View style={[styles.iconWrap, highPriority && styles.iconWrapHigh]}>
          <MaterialCommunityIcons
            name={getIconName(item.icon, item.module)}
            size={20}
            color={highPriority ? "#DC2626" : "#6D5AE6"}
          />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatNotificationTime(item.created_at)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {unread ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OrderHeading
        title="Notifications"
        onBackPress={() => navigation.goBack()}
        showHelp={false}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6D5AE6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={42} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor="#6D5AE6"
              colors={["#6D5AE6"]}
            />
          }
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="bell-badge" size={20} color="#6D5AE6" />
              <Text style={styles.summaryText}>
                {badgeCount > 0
                  ? `${badgeCount} new notification${badgeCount > 1 ? "s" : ""}`
                  : "No New Notification"}
              </Text>
              {badgeCount > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.markAllButton}
                  onPress={handleMarkAllRead}
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="bell-outline" size={34} color="#9CA3AF" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
        />
      )}
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
    flex: 1,
  },
  markAllButton: {
    borderRadius: 999,
    backgroundColor: "#F2EDFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 11,
    color: "#6D5AE6",
    fontWeight: "700",
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
  cardUnread: {
    borderColor: "#DED8FF",
    backgroundColor: "#FEFEFF",
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
  iconWrapHigh: {
    backgroundColor: "#FEF2F2",
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    marginBottom: 14,
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#6D5AE6",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
