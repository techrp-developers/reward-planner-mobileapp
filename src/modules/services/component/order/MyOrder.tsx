import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

import { useAuth } from "../../../common/auth/context/AuthContext";
import type { HomeStackParamList } from "../../navigation/type";
import {
  getMyServiceOrders,
  type ServiceOrder,
  type OrdersResponse,
} from "../../api/OrderAPI";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_payment", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  in_progress:      { color: "#2563EB", bg: "#EFF6FF", label: "In Progress" },
  pending_payment:  { color: "#D97706", bg: "#FFFBEB", label: "Pending Payment" },
  completed:        { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
  cancelled:        { color: "#DC2626", bg: "#FEF2F2", label: "Cancelled" },
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({
  item,
  onPress,
}: {
  item: ServiceOrder;
  onPress: () => void;
}) => {
  const meta = STATUS_META[item.status] || { color: "#6B7280", bg: "#F3F4F6", label: item.status };

  const images: string[] = [];
  item.items.forEach(i => { if (i.image_url) images.push(i.image_url); });
  item.bundles.forEach(b => b.items.forEach(i => { if (i.image_url) images.push(i.image_url); }));

  const previewImages = images.slice(0, 3);
  const extraCount = images.length - previewImages.length;
  const isBundle = item.summary.total_bundles > 0;
  const firstPreview = item.preview[0];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={onPress}>
      {/* Status + date */}
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {firstPreview ? firstPreview.name : "Service Order"}
        {item.preview.length > 1 ? ` +${item.preview.length - 1} more` : ""}
      </Text>

      {/* Image strip + meta row */}
      <View style={styles.cardBottomRow}>
        {previewImages.length > 0 && (
          <View style={styles.imageStrip}>
            {previewImages.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={[styles.thumb, idx > 0 && styles.thumbOverlap]}
              />
            ))}
            {extraCount > 0 && (
              <View style={[styles.thumb, styles.extraBubble, styles.thumbOverlap]}>
                <Text style={styles.extraText}>+{extraCount}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.metaChips}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="briefcase-outline" size={13} color="#6B7280" />
            <Text style={styles.chipText}>
              {item.summary.total_items} service{item.summary.total_items !== 1 ? "s" : ""}
            </Text>
          </View>
          {isBundle && (
            <View style={styles.chip}>
              <MaterialCommunityIcons name="package-variant-closed" size={13} color="#6B7280" />
              <Text style={styles.chipText}>{item.summary.total_bundles} bundle</Text>
            </View>
          )}
        </View>

        <Text style={styles.amountText}>
          ₹{item.total_amount.toLocaleString("en-IN")}
        </Text>
      </View>

      {/* Ref ID */}
      <Text style={styles.refText}>
        #{item.parent_order_id.slice(0, 8).toUpperCase()}
      </Text>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color="#9CA3AF"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyOrder() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [summaryData, setSummaryData] = useState<OrdersResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrders = useCallback(
    async (pageNum = 1, append = false) => {
      if (!isAuthenticated) {
        setOrders([]);
        setLoading(false);
        return;
      }
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const res = await getMyServiceOrders({
          page: pageNum,
          search: searchQuery,
          timeFilter: statusFilter,
        });
        if (res.success) {
          const fetched = res.orders || [];
          setOrders(prev => (append ? [...prev, ...fetched] : fetched));
          setSummaryData(res.summary || null);
          setTotalPages(res.totalPages || 1);
          setPage(pageNum);
        } else {
          if (!append) setOrders([]);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated, searchQuery, statusFilter]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadOrders(1), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadOrders]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) loadOrders(page + 1, true);
  };

  const getSummaryCount = (key: string) => {
    if (!summaryData) return 0;
    if (key === "") return summaryData.all;
    return (summaryData as any)[key] ?? 0;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Service Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search services, order ref…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {STATUS_TABS.map(tab => {
          const active = statusFilter === tab.key;
          const count = getSummaryCount(tab.key);
          const inner = (
            <>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {summaryData !== null && (
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </>
          );
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setStatusFilter(tab.key)}
              activeOpacity={0.7}
            >
              {active ? (
                <LinearGradient
                  colors={["#8665FF", "#5B47A3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tab}
                >
                  {inner}
                </LinearGradient>
              ) : (
                <View style={styles.tab}>{inner}</View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders(1)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No orders found</Text>
          {(searchQuery || statusFilter) ? (
            <TouchableOpacity
              onPress={() => { setSearchQuery(""); setStatusFilter(""); }}
            >
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.parent_order_id}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              onPress={() =>
                navigation.navigate("ServiceOrderDetail", {
                  parent_order_id: item.parent_order_id,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#7C3AED"
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const PURPLE = "#7C3AED";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },

  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFF" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },

  tabsRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
        height: 94,

  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#FFF" },
  tabCount: {
    backgroundColor: "#E5E7EB",
    borderRadius: 99,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  tabCountTextActive: { color: "#FFF" },

  listContent: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  dateText: { fontSize: 12, color: "#9CA3AF" },

  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },

  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  imageStrip: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFF",
    backgroundColor: "#F3F4F6",
  },
  extraBubble: {
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  extraText: { fontSize: 10, fontWeight: "700", color: PURPLE },

  metaChips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipText: { fontSize: 11, color: "#6B7280", fontWeight: "500" },

  amountText: { fontSize: 15, fontWeight: "800", color: "#111827" },

  refText: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  chevron: { position: "absolute", right: 12, top: "50%" },

  // States
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  errorText: { fontSize: 14, color: "#B91C1C", textAlign: "center", marginTop: 10, marginBottom: 14 },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 12 },
  clearText: { fontSize: 14, color: PURPLE, fontWeight: "600", marginTop: 8 },
  headerSpacer: { width: 24 },
  thumbOverlap: { marginLeft: -10 },
  footerLoader: { marginVertical: 16 },
});
